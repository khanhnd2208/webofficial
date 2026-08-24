import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import { coerceLearnerResponse, displayChosen, displayCorrect, parseAnswerSpec } from '../domain/answerSpec';
import { normalizeBankFilter, splitCsvParam, type BankFilter } from '../domain/bankFilter';
import { listSkip, parseListQuery, parseOptionalBoolean, parseOptionalSortDir, parsePublishStatus, toListPage } from '../domain/listQuery';
import { gradeResponse, scalePoints } from '../domain/grading';
import { formatEvidenceSummary } from '../domain/format';
import { normalizeSlug } from '../domain/normalize';
import { parsePublicOptions, parseQuestionOptions } from '../domain/options';
import { placementKey } from '../domain/placementKey';
import { withUniqueConflict } from '../domain/prismaErrors';
import { validatePlacementPublish, validateTestPublish } from '../domain/publishValidation';
import { sanitizeMyClassHtml } from '../domain/sanitize';
import { assertTestScope } from '../domain/scope';
import { buildKuEvidence, weightedAccuracy } from '../domain/scoring';
import * as repo from '../repositories/assessmentRepository';
import * as courseRepo from '../repositories/courseRepository';
import * as kuRepo from '../repositories/knowledgeUnitRepository';
import * as cohortRepo from '../repositories/cohortRepository';
import type {
	QuestionBodyInput,
	CreateTestInput,
	UpdateTestInput,
	TestQuestionInput,
	TestPlacementInput,
	SubmitTestInput,
	CheckTestQuestionInput,
	BankBulkInput,
} from '../schemas';
import type {
	AnswerSpec,
	AdminQuestionTablePage,
	AdminTestTablePage,
	LearnerResponse,
	MyClassQuestionCheck,
	MyClassQuestionForPlay,
	MyClassQuestionType,
	MyClassTestForPlay,
	MyClassTestResult,
	PublishIssue,
	QuestionOption,
} from '../types';
import { testReturnTo } from './mappers';

const TEST_TABLE_SORT_FIELDS = ['title', 'status', 'updatedAt', 'questions', 'attempts', 'placements'] as const;

function questionWrite(input: QuestionBodyInput, slug: string) {
	return {
		slug,
		type: input.type,
		stem: input.stem.trim(),
		options: (input.options ?? []) as unknown as Prisma.InputJsonValue,
		answer: input.answer as unknown as Prisma.InputJsonValue,
		explanation: sanitizeMyClassHtml(input.explanation),
		hint: input.hint ?? '',
		source: input.source ?? '',
		difficulty: input.difficulty,
		subjectId: input.subjectId ?? null,
		topicId: input.topicId ?? null,
		tags: input.tags ?? [],
		knowledgeUnitIds: input.knowledgeUnitIds ?? [],
		status: input.status,
	};
}

function playQuestion(
	item: { position: number; points?: number; question: { id: string; type: MyClassQuestionType; stem: string; options: unknown; answer: unknown } },
): MyClassQuestionForPlay {
	const answer = parseAnswerSpec(item.question.answer);
	return {
		id: item.question.id,
		type: item.question.type,
		stem: item.question.stem,
		options: item.question.type === 'FILL_BLANK' ? [] : parsePublicOptions(item.question.options),
		blanks:
			answer.type === 'FILL_BLANK'
				? answer.blanks.map((blank) => ({ id: blank.id, length: blank.length, hint: blank.hint }))
				: undefined,
		position: item.position,
		points: item.points ?? 1,
	};
}

export async function listAdminQuestions(filter: BankFilter = {}) {
	return repo.listQuestions(filter);
}

export async function listAdminQuestionTable(
	filter: BankFilter & {
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
	} = {},
): Promise<AdminQuestionTablePage> {
	const query = parseListQuery(
		{
			q: filter.q,
			page: filter.page ? String(filter.page) : undefined,
			pageSize: filter.pageSize ? String(filter.pageSize) : undefined,
			sortBy: filter.sortBy ?? filter.sort,
			sortDir: filter.sortDir,
		},
		{ sortFields: ['updatedAt', 'difficulty', 'usage'] as const, defaultSortBy: 'updatedAt' },
	);
	const sort = query.sortBy === 'difficulty' || query.sortBy === 'usage' ? query.sortBy : 'updatedAt';
	const { items, total } = await repo.listQuestionTable({
		...filter,
		sort,
		sortDir: query.sortDir,
		skip: listSkip(query.page, query.pageSize),
		take: query.pageSize,
		cursor: undefined,
	});
	return toListPage(
		items.map((item) => ({
			id: item.id,
			stem: item.stem,
			type: item.type,
			difficulty: item.difficulty,
			status: item.status,
			tags: item.tags,
			subjectName: item.subject?.name ?? null,
			topicPath: item.topic?.path ?? null,
			testCount: item._count.tests,
			updatedAt: item.updatedAt.toISOString(),
		})),
		total,
		query.page,
		query.pageSize,
	);
}

export async function listBankFacets(filter: BankFilter = {}) {
	const [facets, suggestedTopics] = await Promise.all([
		repo.listQuestionFacets(filter),
		filter.courseId ? repo.suggestedTopicsForCourse(filter.courseId) : Promise.resolve([]),
	]);
	return { ...facets, suggestedTopics };
}

export async function getAdminQuestion(id: string) {
	const question = await repo.findQuestion(id);
	if (!question) throw new AppError('Không tìm thấy câu hỏi', 404);
	return {
		...question,
		options: parseQuestionOptions(question.options),
		answer: parseAnswerSpec(question.answer),
	};
}

export async function createQuestion(input: QuestionBodyInput) {
	const slug = normalizeSlug(input.slug ?? input.stem.slice(0, 80), 'question');
	if (await repo.findQuestionBySlug(slug)) {
		throw new AppError(`Question slug đã tồn tại: ${slug}`, 409, 'CONFLICT');
	}
	return withUniqueConflict(`Question slug đã tồn tại: ${slug}`, () =>
		repo.createQuestion(questionWrite(input, slug)),
	);
}

async function revertPublishedTestsUsing(questionIds: string | string[]) {
	const ids = Array.isArray(questionIds) ? questionIds : [questionIds];
	if (!ids.length) return;
	const testsUsing = await prisma.myClassTest.findMany({
		where: { status: 'PUBLISHED', questions: { some: { questionId: { in: ids } } } },
		select: { id: true },
	});
	if (testsUsing.length) {
		await prisma.myClassTest.updateMany({
			where: { id: { in: testsUsing.map((item) => item.id) } },
			data: { status: 'DRAFT', publishedAt: null },
		});
	}
}

export async function updateQuestion(id: string, input: QuestionBodyInput) {
	const existing = await getAdminQuestion(id);
	const updated = await withUniqueConflict('Question slug đã tồn tại', () =>
		repo.updateQuestion(id, {
			...questionWrite(input, input.slug ? normalizeSlug(input.slug, existing.slug) : existing.slug),
			slug: input.slug ? normalizeSlug(input.slug, existing.slug) : undefined,
		}),
	);
	await revertPublishedTestsUsing(id);
	return updated;
}

export async function archiveQuestion(id: string) {
	await getAdminQuestion(id);
	const updated = await repo.updateQuestion(id, { status: 'ARCHIVED' });
	await revertPublishedTestsUsing(id);
	return updated;
}

export async function bulkBankAction(input: BankBulkInput) {
	const ids = [...new Set(input.ids)];
	if (input.action === 'archive') {
		await repo.bulkUpdateQuestions(ids, { status: 'ARCHIVED' });
		await revertPublishedTestsUsing(ids);
		return { updated: ids.length };
	}
	if (input.action === 'restore') {
		await repo.bulkUpdateQuestions(ids, { status: 'ACTIVE' });
		return { updated: ids.length };
	}
	if (input.action === 'set-topic') {
		await repo.bulkUpdateQuestions(ids, {
			topicId: input.topicId ?? null,
			subjectId: input.subjectId ?? undefined,
		});
		return { updated: ids.length };
	}
	if (input.action === 'add-tags' || input.action === 'remove-tags') {
		const tags = input.tags ?? [];
		const rows = await prisma.myClassQuestion.findMany({ where: { id: { in: ids } }, select: { id: true, tags: true } });
		await prisma.$transaction(
			rows.map((row) => {
				const next =
					input.action === 'add-tags'
						? [...new Set([...row.tags, ...tags])]
						: row.tags.filter((tag) => !tags.includes(tag));
				return prisma.myClassQuestion.update({ where: { id: row.id }, data: { tags: next } });
			}),
		);
		return { updated: rows.length };
	}
	if (input.action === 'add-to-test') {
		if (!input.testId) throw new AppError('Thiếu testId', 422);
		const test = await getAdminTest(input.testId);
		const existing = test.questions.map((item) => item.question.id);
		const merged = [...existing, ...ids.filter((id) => !existing.includes(id))];
		await repo.setTestQuestions(
			input.testId,
			merged.map((questionId, index) => ({
				questionId,
				points: test.questions[index]?.points ?? 1,
			})),
		);
		return { updated: ids.length };
	}
	throw new AppError('Hành động không hợp lệ', 422);
}

export async function listAdminTests(
	filter:
		| string
		| {
				courseId?: string;
				placementCourseId?: string;
				q?: string;
				status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
				subjectId?: string;
				unplaced?: boolean;
				hasAttempts?: boolean;
				topicId?: string;
		  } = {},
) {
	const resolved = typeof filter === 'string' ? { placementCourseId: filter } : filter;
	return repo.listAdminTests({
		...resolved,
		placementCourseId: resolved.placementCourseId ?? resolved.courseId,
	});
}

export async function listAdminTestTable(
	filter: {
		courseId?: string;
		placementCourseId?: string;
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		subjectId?: string;
		unplaced?: boolean;
		hasAttempts?: boolean;
		topicId?: string;
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
	} = {},
): Promise<AdminTestTablePage> {
	const query = parseListQuery(
		{
			q: filter.q,
			page: filter.page ? String(filter.page) : undefined,
			pageSize: filter.pageSize ? String(filter.pageSize) : undefined,
			sortBy: filter.sortBy,
			sortDir: filter.sortDir,
		},
		{ sortFields: TEST_TABLE_SORT_FIELDS, defaultSortBy: 'updatedAt' },
	);
	const { items, total } = await repo.listAdminTestTable({
		q: query.q ?? filter.q,
		status: filter.status,
		subjectId: filter.subjectId,
		placementCourseId: filter.placementCourseId ?? filter.courseId,
		unplaced: filter.unplaced,
		hasAttempts: filter.hasAttempts,
		topicId: filter.topicId,
		sortBy: query.sortBy as (typeof TEST_TABLE_SORT_FIELDS)[number],
		sortDir: query.sortDir,
		skip: listSkip(query.page, query.pageSize),
		take: query.pageSize,
	});
	return toListPage(
		items.map((test) => ({
			id: test.id,
			slug: test.slug,
			title: test.title,
			status: test.status,
			subjectName: test.subject?.name ?? null,
			placementCount: test._count.placements,
			questionCount: test._count.questions,
			attemptCount: test._count.attempts,
			courseTitles: [...new Set(test.placements.map((item) => item.course.title))],
			updatedAt: test.updatedAt.toISOString(),
		})),
		total,
		query.page,
		query.pageSize,
	);
}

export function testTableQueryFromSearch(search: {
	q?: string;
	status?: string;
	courseId?: string;
	subjectId?: string;
	topicId?: string;
	unplaced?: string;
	hasAttempts?: string;
	page?: string;
	pageSize?: string;
	sortBy?: string;
	sortDir?: string;
}) {
	return {
		q: search.q,
		status: parsePublishStatus(search.status),
		courseId: search.courseId || undefined,
		subjectId: search.subjectId || undefined,
		topicId: search.topicId || undefined,
		unplaced: parseOptionalBoolean(search.unplaced),
		hasAttempts: parseOptionalBoolean(search.hasAttempts),
		page: search.page ? Number(search.page) : undefined,
		pageSize: search.pageSize ? Number(search.pageSize) : undefined,
		sortBy: search.sortBy,
		sortDir: parseOptionalSortDir(search.sortDir),
	};
}

export async function getAdminTest(id: string) {
	const test = await repo.findAdminTest(id);
	if (!test) throw new AppError('Không tìm thấy Test', 404);
	return test;
}

export async function createTest(input: CreateTestInput) {
	const slug = normalizeSlug(input.slug ?? input.title, 'test');
	return withUniqueConflict(`Test slug đã tồn tại: ${slug}`, () =>
		repo.createTest({
			slug,
			title: input.title.trim(),
			description: input.description ?? '',
			subjectId: input.subjectId ?? null,
			tags: input.tags ?? [],
			passScore: input.passScore ?? null,
			timeLimitMinutes: input.timeLimitMinutes ?? null,
			maxAttempts: input.maxAttempts ?? null,
			shuffleQuestions: input.shuffleQuestions,
			shuffleOptions: input.shuffleOptions,
			revealPolicy: input.revealPolicy,
		}),
	);
}

export async function updateTest(id: string, input: UpdateTestInput) {
	const existing = await getAdminTest(id);
	const data = {
		title: input.title?.trim(),
		slug: input.slug ? normalizeSlug(input.slug, existing.slug) : undefined,
		description: input.description,
		subjectId: input.subjectId,
		tags: input.tags,
		passScore: input.passScore,
		timeLimitMinutes: input.timeLimitMinutes,
		maxAttempts: input.maxAttempts,
		shuffleQuestions: input.shuffleQuestions,
		shuffleOptions: input.shuffleOptions,
		revealPolicy: input.revealPolicy,
		status: input.status,
		publishedAt:
			input.status === 'PUBLISHED' ? new Date() : input.status ? null : existing.publishedAt,
	};
	if (input.status === 'PUBLISHED') {
		await withUniqueConflict('Test slug đã tồn tại', () =>
			repo.updateTest(id, { ...data, status: 'DRAFT', publishedAt: null }),
		);
		const issues = (await validateAdminTestPublish(id)).filter((item) => item.severity !== 'warning');
		if (issues.length) throw new AppError(issues[0]!.message, 422, 'PUBLISH_BLOCKED');
		return repo.updateTest(id, { status: 'PUBLISHED', publishedAt: new Date() });
	}
	return withUniqueConflict('Test slug đã tồn tại', () => repo.updateTest(id, data));
}

export async function setTestQuestions(
	id: string,
	questionIds: string[] | Array<{ questionId: string; points?: number }>,
) {
	await getAdminTest(id);
	const items = Array.isArray(questionIds) && typeof questionIds[0] === 'string'
		? (questionIds as string[]).map((questionId) => ({ questionId }))
		: (questionIds as Array<{ questionId: string; points?: number }>);
	return repo.setTestQuestions(id, items);
}

export async function addTestQuestion(testId: string, input: TestQuestionInput) {
	await getAdminTest(testId);
	const slug = normalizeSlug(input.slug ?? input.stem.slice(0, 80), 'question');
	if (await repo.findQuestionBySlug(slug)) {
		throw new AppError(`Question slug đã tồn tại: ${slug}`, 409, 'CONFLICT');
	}
	const question = await withUniqueConflict(`Question slug đã tồn tại: ${slug}`, () =>
		repo.appendTestQuestion(testId, questionWrite(input, slug)),
	);
	return { question, test: await getAdminTest(testId) };
}

export async function randomFillTest(testId: string, filter: BankFilter, count: number, replace = false) {
	const test = await getAdminTest(testId);
	const pool = await repo.listQuestions({
		...normalizeBankFilter({ ...filter, excludeTestId: replace ? undefined : testId, status: 'ACTIVE', take: 200 }),
	});
	const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
	const existing = replace ? [] : test.questions.map((item) => ({ questionId: item.question.id, points: item.points }));
	const added = shuffled
		.filter((item) => !existing.some((row) => row.questionId === item.id))
		.map((item) => ({ questionId: item.id, points: 1 }));
	return repo.setTestQuestions(testId, [...existing, ...added]);
}

export async function archiveTest(id: string) {
	await getAdminTest(id);
	return repo.updateTest(id, { status: 'ARCHIVED' });
}

async function assertPlacementScope(input: TestPlacementInput) {
	const lesson = input.lessonId ? await courseRepo.findLesson(input.lessonId) : null;
	const section = input.sectionId ? await courseRepo.findSection(input.sectionId) : null;
	assertTestScope({
		scope: input.scope,
		courseId: input.courseId,
		lessonId: input.lessonId,
		sectionId: input.sectionId,
		lessonCourseId: lesson?.courseId ?? null,
		sectionLessonId: section?.lessonId ?? null,
	});
}

export async function listTestPlacements(testId: string) {
	const test = await getAdminTest(testId);
	return test.placements;
}

export async function createTestPlacement(testId: string, input: TestPlacementInput) {
	await getAdminTest(testId);
	const course = await courseRepo.findAdminCourse(input.courseId);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	await assertPlacementScope(input);
	try {
		return await repo.createPlacement({
			testId,
			courseId: input.courseId,
			lessonId: input.scope === 'COURSE' ? null : input.lessonId,
			sectionId: input.scope === 'SECTION' ? input.sectionId : null,
			scope: input.scope,
			position: input.position,
			status: input.status,
		});
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
			throw new AppError('Test đã được gắn vào vị trí này', 409, 'CONFLICT');
		}
		throw error;
	}
}

export async function deleteTestPlacement(testId: string, placementId: string) {
	const placement = await repo.findPlacement(placementId);
	if (!placement || placement.testId !== testId) throw new AppError('Không tìm thấy vị trí gắn', 404);
	return repo.deletePlacement(placementId);
}

export async function validatePlacement(testId: string, courseId: string): Promise<PublishIssue[]> {
	const test = await getAdminTest(testId);
	const courseKuIds = await kuRepo.courseKnowledgeUnitIds(courseId);
	const outOfCourse: string[] = [];
	for (const item of test.questions) {
		for (const link of item.question.knowledgeUnits) {
			if (!courseKuIds.has(link.knowledgeUnitId)) {
				outOfCourse.push(link.knowledgeUnit.currentPublishedRevision?.title ?? link.knowledgeUnit.slug);
			}
		}
	}
	return validatePlacementPublish({ outOfCourseKuTitles: [...new Set(outOfCourse)] });
}

export async function validateAdminTestPublish(id: string): Promise<PublishIssue[]> {
	const test = await getAdminTest(id);
	const unpublished: string[] = [];
	let inactive = 0;
	for (const item of test.questions) {
		if (item.question.status !== 'ACTIVE') inactive += 1;
		for (const link of item.question.knowledgeUnits) {
			const title = link.knowledgeUnit.currentPublishedRevision?.title ?? link.knowledgeUnit.slug;
			if (link.knowledgeUnit.status !== 'PUBLISHED' || !link.knowledgeUnit.currentPublishedRevision) {
				unpublished.push(title);
			}
		}
	}
	const placementWarnings: PublishIssue[] = [];
	for (const placement of test.placements) {
		placementWarnings.push(...(await validatePlacement(id, placement.courseId)));
	}
	return [
		...validateTestPublish({
			questionCount: test.questions.filter((item) => item.question.status === 'ACTIVE').length,
			inactiveQuestionCount: inactive,
			unpublishedKuTitles: [...new Set(unpublished)],
		}),
		...placementWarnings,
	];
}

export async function publishTest(id: string) {
	const issues = (await validateAdminTestPublish(id)).filter((item) => item.severity !== 'warning');
	if (issues.length) throw new AppError(issues[0]!.message, 422, 'PUBLISH_BLOCKED');
	return repo.updateTest(id, { status: 'PUBLISHED', publishedAt: new Date() });
}

type PlayActor = { userId?: string | null; guestId?: string | null };

function emptyWrongResponse(type: MyClassQuestionType): LearnerResponse {
	if (type === 'MCQ_MULTI') return { type: 'MCQ_MULTI', keys: [] };
	if (type === 'FILL_BLANK') return { type: 'FILL_BLANK', blanks: {} };
	return { type: 'MCQ_SINGLE', key: 'A' };
}

function optionTexts(options: QuestionOption[], keys: string): string {
	return keys
		.split(', ')
		.filter(Boolean)
		.map((key) => options.find((option) => option.key === key)?.text ?? key)
		.join(', ');
}

function choiceLabels(
	type: MyClassQuestionType,
	options: QuestionOption[],
	chosenKey: string,
	correctKey: string,
	response: LearnerResponse,
	answer: AnswerSpec,
): { chosenLabel: string; correctLabel: string } {
	if (type === 'FILL_BLANK') {
		return { chosenLabel: chosenKey, correctLabel: correctKey };
	}
	if (answer.type === 'FILL_BLANK' || response.type === 'FILL_BLANK') {
		return { chosenLabel: chosenKey, correctLabel: correctKey };
	}
	return {
		chosenLabel: optionTexts(options, chosenKey) || chosenKey,
		correctLabel: optionTexts(options, correctKey) || correctKey,
	};
}

async function mapPlayFromPlacement(
	placement: NonNullable<Awaited<ReturnType<typeof repo.findPublishedPlacement>>>,
	actor?: PlayActor,
): Promise<MyClassTestForPlay> {
	const test = placement.test;
	const attemptsUsed = actor ? await repo.countAttempts(test.id, actor) : 0;
	return {
		id: test.id,
		slug: test.slug,
		title: test.title,
		description: test.description,
		questionCount: test.questions.length,
		scope: placement.scope,
		passScore: test.passScore ?? null,
		placementId: placement.id,
		courseSlug: placement.course.slug,
		timeLimitMinutes: test.timeLimitMinutes,
		maxAttempts: test.maxAttempts,
		attemptsUsed,
		shuffleQuestions: test.shuffleQuestions,
		shuffleOptions: test.shuffleOptions,
		revealPolicy: test.revealPolicy,
		returnTo: testReturnTo(placement.course.slug, {
			scope: placement.scope,
			lesson: placement.lesson,
			section: placement.section,
		}),
		questions: test.questions.map(playQuestion),
	};
}

export async function previewPublicTest(id: string): Promise<MyClassTestForPlay> {
	const test = await getAdminTest(id);
	const first = test.placements[0];
	return {
		id: test.id,
		slug: test.slug,
		title: test.title,
		description: test.description,
		questionCount: test.questions.length,
		scope: first?.scope ?? 'COURSE',
		passScore: test.passScore ?? null,
		placementId: first?.id,
		courseSlug: first?.course.slug ?? '',
		timeLimitMinutes: test.timeLimitMinutes,
		maxAttempts: null,
		attemptsUsed: 0,
		shuffleQuestions: test.shuffleQuestions,
		shuffleOptions: test.shuffleOptions,
		revealPolicy: test.revealPolicy,
		returnTo: first
			? testReturnTo(first.course.slug, { scope: first.scope, lesson: first.lesson, section: first.section })
			: { href: '/my-space/my-class', label: 'My Class' },
		questions: test.questions.filter((item) => item.question.status === 'ACTIVE').map(playQuestion),
	};
}

export async function getTest(
	courseSlug: string,
	testSlug: string,
	actor?: PlayActor,
): Promise<MyClassTestForPlay> {
	const placement = await repo.findPublishedPlacement(courseSlug, testSlug);
	if (!placement) throw new AppError('Không tìm thấy Test', 404);
	if (placement.test.questions.length === 0) {
		throw new AppError('Bài kiểm tra chưa có câu hỏi', 404);
	}
	return mapPlayFromPlacement(placement, actor);
}

function reviewFromQuestions(
	questions: Array<{
		position: number;
		points: number;
		question: {
			id: string;
			type: MyClassQuestionType;
			stem: string;
			options: unknown;
			answer: unknown;
			explanation: string;
			knowledgeUnits: Array<{ knowledgeUnitId: string; knowledgeUnit: { slug: string; currentPublishedRevision: { title: string } | null } }>;
		};
	}>,
	input: SubmitTestInput,
) {
	const officialIds = questions.map((item) => item.question.id);
	const submittedIds = Object.keys(input.answers);
	const officialSet = new Set(officialIds);
	if (submittedIds.some((id) => !officialSet.has(id))) {
		throw new AppError('Câu trả lời chứa question ID không thuộc Test', 422);
	}
	if (
		!input.timedOut &&
		(submittedIds.length !== officialIds.length || officialIds.some((id) => !(id in input.answers)))
	) {
		throw new AppError('Phải trả lời đúng toàn bộ câu hỏi của Test', 422);
	}
	return questions.map((item) => {
		const options = item.question.type === 'FILL_BLANK' ? [] : parseQuestionOptions(item.question.options);
		const answer = parseAnswerSpec(item.question.answer);
		const raw = input.answers[item.question.id];
		const missing = raw === undefined;
		const response = missing ? emptyWrongResponse(item.question.type) : coerceLearnerResponse(raw);
		const graded = missing
			? { earned: 0, max: 1, isCorrect: false }
			: gradeResponse(answer, response);
		const scaled = scalePoints(graded, item.points ?? 1);
		return {
			questionId: item.question.id,
			type: item.question.type,
			stem: item.question.stem,
			options,
			blanks:
				answer.type === 'FILL_BLANK'
					? answer.blanks.map((blank) => ({ id: blank.id, length: blank.length, hint: blank.hint }))
					: undefined,
			response,
			answer,
			chosenKey: displayChosen(response),
			correctKey: displayCorrect(answer),
			explanation: sanitizeMyClassHtml(item.question.explanation),
			earned: scaled.earned,
			max: scaled.max,
			isCorrect: graded.isCorrect,
			knowledgeUnitIds: item.question.knowledgeUnits.map((link) => link.knowledgeUnitId),
		};
	});
}

function kuMetaFromQuestions(
	questions: Array<{
		question: {
			knowledgeUnits: Array<{
				knowledgeUnitId: string;
				knowledgeUnit: { slug: string; currentPublishedRevision: { title: string } | null };
			}>;
		};
	}>,
) {
	const kuMeta = new Map<string, { slug: string; title: string }>();
	for (const item of questions) {
		for (const link of item.question.knowledgeUnits) {
			kuMeta.set(link.knowledgeUnitId, {
				slug: link.knowledgeUnit.slug,
				title: link.knowledgeUnit.currentPublishedRevision?.title ?? link.knowledgeUnit.slug,
			});
		}
	}
	return kuMeta;
}

function resultPayload(
	review: ReturnType<typeof reviewFromQuestions>,
	kuMeta: Map<string, { slug: string; title: string }>,
	attemptId: string | null,
	saved: boolean,
	revealPolicy: 'AFTER_SUBMIT' | 'IMMEDIATE' | 'NEVER' = 'AFTER_SUBMIT',
): MyClassTestResult {
	const evidence = buildKuEvidence(review);
	return {
		attemptId,
		saved,
		score: review.filter((item) => item.isCorrect).length,
		total: review.length,
		earnedPoints: review.reduce((sum, item) => sum + item.earned, 0),
		totalPoints: review.reduce((sum, item) => sum + item.max, 0),
		review:
			revealPolicy === 'NEVER'
				? []
				: review.map(({ knowledgeUnitIds: _ids, ...item }) => item),
		kuBreakdown: evidence.map((row) => {
			const meta = kuMeta.get(row.knowledgeUnitId);
			const accuracy = weightedAccuracy(row.correctCount, row.questionCount);
			return {
				slug: meta?.slug ?? row.knowledgeUnitId,
				title: meta?.title ?? row.knowledgeUnitId,
				questions: row.questionCount,
				correct: row.correctCount,
				accuracy,
				evidenceLabel: formatEvidenceSummary(row.correctCount, row.questionCount, accuracy),
			};
		}),
	};
}

export async function submitTest(
	courseSlug: string,
	testSlug: string,
	input: SubmitTestInput,
	actor?: string | { userId?: string | null; guestId?: string | null },
): Promise<MyClassTestResult> {
	const placement = await repo.findPublishedPlacement(courseSlug, testSlug);
	if (!placement) throw new AppError('Không tìm thấy Test', 404);
	if (placement.test.questions.length === 0) {
		throw new AppError('Bài kiểm tra chưa có câu hỏi', 404);
	}
	const resolved = typeof actor === 'string' ? { userId: actor, guestId: null } : (actor ?? {});
	const userId = resolved.userId ?? null;
	const guestId = userId ? null : (resolved.guestId ?? null);
	if (placement.test.maxAttempts != null && (userId || guestId)) {
		const used = await repo.countAttempts(placement.testId, { userId, guestId });
		if (used >= placement.test.maxAttempts) {
			throw new AppError('Bạn đã hết lượt làm bài này', 409, 'MAX_ATTEMPTS');
		}
	}
	const review = reviewFromQuestions(placement.test.questions, input);
	const kuMeta = kuMetaFromQuestions(placement.test.questions);
	const score = review.filter((item) => item.isCorrect).length;
	const earnedPoints = review.reduce((sum, item) => sum + item.earned, 0);
	const totalPoints = review.reduce((sum, item) => sum + item.max, 0);
	const evidence = buildKuEvidence(review);
	let attemptId: string | null = null;
	if (userId || guestId) {
		const membership = userId
			? await cohortRepo.findActiveByCourseUser(placement.courseId, userId)
			: null;
		const attempt = await repo.createAttempt({
			testId: placement.testId,
			placementId: placement.id,
			courseId: placement.courseId,
			userId,
			guestId,
			cohortId:
				membership?.status === 'ACTIVE' && membership.cohort.status === 'PUBLISHED'
					? membership.cohortId
					: null,
			score,
			total: review.length,
			earnedPoints,
			totalPoints,
			durationSeconds: input.durationSeconds ?? null,
			answers: review.map((item) => ({
				questionId: item.questionId,
				typeSnapshot: item.type,
				stemSnapshot: item.stem,
				optionsSnapshot: item.options as unknown as Prisma.InputJsonValue,
				answerSnapshot: item.answer as unknown as Prisma.InputJsonValue,
				response: item.response as unknown as Prisma.InputJsonValue,
				correctKey: item.correctKey,
				chosenKey: item.chosenKey,
				explanation: item.explanation,
				earned: item.earned,
				max: item.max,
				isCorrect: item.isCorrect,
			})),
			evidence: evidence.map((row) => ({
				knowledgeUnitId: row.knowledgeUnitId,
				weight: row.weight,
				correctCount: row.correctCount,
				questionCount: row.questionCount,
				knowledgeUnitSlugSnapshot: kuMeta.get(row.knowledgeUnitId)?.slug ?? null,
				knowledgeUnitTitleSnapshot: kuMeta.get(row.knowledgeUnitId)?.title ?? null,
				rawResponseCount: Math.round(row.questionCount),
			})),
		});
		attemptId = attempt.id;
	}
	return resultPayload(
		review,
		kuMeta,
		attemptId,
		Boolean(userId || guestId),
		placement.test.revealPolicy,
	);
}

export async function submitAdminPreviewTest(
	testId: string,
	input: SubmitTestInput,
): Promise<MyClassTestResult> {
	const test = await getAdminTest(testId);
	const active = test.questions.filter((item) => item.question.status === 'ACTIVE');
	const review = reviewFromQuestions(active, input);
	return resultPayload(review, kuMetaFromQuestions(active), null, false, test.revealPolicy);
}

export async function checkTestQuestion(
	courseSlug: string,
	testSlug: string,
	input: CheckTestQuestionInput,
): Promise<MyClassQuestionCheck> {
	const placement = await repo.findPublishedPlacement(courseSlug, testSlug);
	if (!placement) throw new AppError('Không tìm thấy Test', 404);
	if (placement.test.revealPolicy !== 'IMMEDIATE') {
		throw new AppError('Bài này không chấm từng câu', 422);
	}
	const item = placement.test.questions.find((row) => row.question.id === input.questionId);
	if (!item) throw new AppError('Không tìm thấy câu hỏi', 404);
	const options = item.question.type === 'FILL_BLANK' ? [] : parseQuestionOptions(item.question.options);
	const answer = parseAnswerSpec(item.question.answer);
	const response = coerceLearnerResponse(input.answer);
	const graded = gradeResponse(answer, response);
	const chosenKey = displayChosen(response);
	const correctKey = displayCorrect(answer);
	const labels = choiceLabels(item.question.type, options, chosenKey, correctKey, response, answer);
	return {
		questionId: item.question.id,
		isCorrect: graded.isCorrect,
		explanation: sanitizeMyClassHtml(item.question.explanation),
		chosenLabel: labels.chosenLabel,
		correctLabel: labels.correctLabel,
	};
}

export { splitCsvParam, placementKey };
export type { LearnerResponse, AnswerSpec };
