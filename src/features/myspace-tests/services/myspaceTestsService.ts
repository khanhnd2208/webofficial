import { AppError } from '@/lib/appError';
import { slugify } from '@/utils/slugify';

import { parseMcqCsvFile, parseMcqCsvText, type ParseMcqCsvResult } from '../parseMcqCsv';
import {
	parseTestBundleCsvFile,
	parseTestBundleCsvText,
	type ParseTestBundleResult,
} from '../parseTestBundleCsv';
import { sampleBalancedQuestions } from '../sampleBalanced';
import type {
	CheckAnswerInput,
	CreateSpaceTestInput,
	CreateSubjectInput,
	ImportTestMetaInput,
	McqCorrectOption,
	PlayPoolFiltersInput,
	StartSessionInput,
	SubmitSessionInput,
	UpdateMcqQuestionInput,
	UpdateSpaceTestInput,
	UpdateSubjectInput,
} from '../schemas';
import * as repo from '../repositories/myspaceTestsRepository';
import type {
	CheckAnswerResult,
	McqQuestionDTO,
	PlayPoolCountResult,
	PublicQuizQuestion,
	PublicSpaceTestListItem,
	PublicSubjectGroup,
	QuestionFilterMeta,
	SessionStartResult,
	SessionSubmitResult,
	SpaceTestDTO,
	SpaceTestWithQuestionCount,
	SubjectDTO,
	SubjectWithCounts,
	TestPlayOptions,
} from '../types';

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
	const root = slugify(base) || 'test';
	let candidate = root;
	let i = 2;
	while (await repo.slugExists(candidate, excludeId)) {
		candidate = `${root}-${i}`;
		i += 1;
	}
	return candidate;
}

async function uniqueSubjectSlug(base: string, excludeId?: string): Promise<string> {
	const root = slugify(base) || 'subject';
	let candidate = root;
	let i = 2;
	while (await repo.subjectSlugExists(candidate, excludeId)) {
		candidate = `${root}-${i}`;
		i += 1;
	}
	return candidate;
}

function toPublicQuestion(q: {
	id: string;
	stem: string;
	optionA: string;
	optionB: string;
	optionC: string;
	optionD: string;
}): PublicQuizQuestion {
	const options: PublicQuizQuestion['options'] = [
		{ key: 'A' as const, text: q.optionA },
		{ key: 'B' as const, text: q.optionB },
		{ key: 'C' as const, text: q.optionC },
		{ key: 'D' as const, text: q.optionD },
	].filter((o) => o.text.trim().length > 0);

	return {
		id: q.id,
		stem: q.stem,
		options,
	};
}

function toPublicListItem(
	t: SpaceTestDTO,
	stats?: {
		engaged: number;
		completed: number;
		avgScorePercent: number | null;
		avgDurationMs: number | null;
	},
): PublicSpaceTestListItem {
	return {
		slug: t.slug,
		title: t.title,
		description: t.description,
		subject: t.subjectName,
		subjectId: t.subjectId,
		questionCount: t.questionCount,
		attemptedCount: stats?.engaged ?? 0,
		completedCount: stats?.completed ?? 0,
		avgScorePercent: stats?.avgScorePercent ?? null,
		avgDurationMs: stats?.avgDurationMs ?? null,
	};
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export async function listSubjects(): Promise<SubjectWithCounts[]> {
	return repo.listSubjects();
}

export async function createSubject(input: CreateSubjectInput): Promise<SubjectDTO> {
	const name = input.name.trim();
	const existing = await repo.findSubjectByName(name);
	if (existing) throw new AppError('Môn học đã tồn tại', 409);
	const slug = await uniqueSubjectSlug(name);
	return repo.createSubject({ name, slug });
}

export async function updateSubject(id: string, input: UpdateSubjectInput): Promise<SubjectDTO> {
	const existing = await repo.findSubjectById(id);
	if (!existing) throw new AppError('Không tìm thấy môn học', 404);
	const name = input.name.trim();
	const byName = await repo.findSubjectByName(name);
	if (byName && byName.id !== id) throw new AppError('Tên môn đã được dùng', 409);
	const slug = await uniqueSubjectSlug(name, id);
	const updated = await repo.updateSubject(id, { name, slug });
	if (!updated) throw new AppError('Không tìm thấy môn học', 404);
	return updated;
}

export async function deleteSubject(id: string): Promise<void> {
	const existing = await repo.findSubjectById(id);
	if (!existing) throw new AppError('Không tìm thấy môn học', 404);
	const testCount = await repo.countTestsBySubjectId(id);
	if (testCount > 0) {
		throw new AppError(
			`Không thể xóa môn đang có ${testCount} bài test. Hãy chuyển hoặc xóa các bài test trước.`,
			409,
		);
	}
	const ok = await repo.deleteSubject(id);
	if (!ok) throw new AppError('Không tìm thấy môn học', 404);
}

// ─── Question bank import (legacy CSV) ──────────────────────────────────────

export async function importQuestionsFromFile(
	file: File,
	subjectId?: string | null,
): Promise<ParseMcqCsvResult & { imported: number }> {
	const parsed = await parseMcqCsvFile(file);
	const imported = await repo.createQuestions(parsed.questions, subjectId);
	return { ...parsed, imported };
}

export async function importQuestionsFromText(
	text: string,
	subjectId?: string | null,
): Promise<ParseMcqCsvResult & { imported: number }> {
	const parsed = parseMcqCsvText(text);
	const imported = await repo.createQuestions(parsed.questions, subjectId);
	return { ...parsed, imported };
}

// ─── Bundle / smart import ──────────────────────────────────────────────────

export type TestBundlePreview = {
	meta: NonNullable<ParseTestBundleResult['meta']> | {
		title: string;
		slug: string | null;
		description: string;
		subject: string;
		questionCount: number | null;
		status: 'DRAFT' | 'PUBLISHED';
	};
	questionCount: number;
	sampleStems: string[];
	errors: ParseTestBundleResult['errors'];
	metaErrors: string[];
	canImport: boolean;
};

function toBundlePreview(
	parsed: ParseTestBundleResult,
	opts?: { requireMeta?: boolean },
): TestBundlePreview {
	const requireMeta = opts?.requireMeta !== false;
	const canImport =
		parsed.metaErrors.length === 0 &&
		parsed.questions.length > 0 &&
		(!requireMeta || Boolean(parsed.meta?.title && parsed.meta?.subject));

	return {
		meta: parsed.meta ?? {
			title: '',
			slug: null,
			description: '',
			subject: '',
			questionCount: null,
			status: 'PUBLISHED',
		},
		questionCount: parsed.questions.length,
		sampleStems: parsed.questions.slice(0, 5).map((q) => q.stem),
		errors: parsed.errors,
		metaErrors: parsed.metaErrors,
		canImport,
	};
}

export async function previewTestBundleFromFile(file: File): Promise<TestBundlePreview> {
	const parsed = await parseTestBundleCsvFile(file, { requireMeta: true });
	return toBundlePreview(parsed, { requireMeta: true });
}

export async function previewTestBundleFromText(
	text: string,
	opts?: { allowMissingMeta?: boolean },
): Promise<TestBundlePreview> {
	const requireMeta = !opts?.allowMissingMeta;
	const parsed = parseTestBundleCsvText(text, { requireMeta });
	return toBundlePreview(parsed, { requireMeta });
}

export async function importTestBundleFromFile(
	file: File,
): Promise<{ test: SpaceTestDTO; imported: number; preview: TestBundlePreview }> {
	const parsed = await parseTestBundleCsvFile(file, { requireMeta: true });
	const preview = toBundlePreview(parsed, { requireMeta: true });
	if (!preview.canImport || !parsed.meta) {
		const detail =
			parsed.metaErrors[0] ??
			parsed.errors[0]?.message ??
			'File CSV không hợp lệ';
		throw new AppError(detail, 422);
	}

	let subject = await repo.findSubjectByName(parsed.meta.subject);
	if (!subject) {
		subject = await createSubject({ name: parsed.meta.subject });
	}

	const slug = await uniqueSlug(parsed.meta.slug ?? parsed.meta.title);
	const questionCount = parsed.meta.questionCount ?? parsed.questions.length;

	const test = await repo.createSpaceTestWithQuestions({
		slug,
		title: parsed.meta.title,
		description: parsed.meta.description,
		subjectId: subject.id,
		questionCount,
		status: parsed.meta.status,
		questions: parsed.questions,
	});

	return { test, imported: parsed.questions.length, preview };
}

export async function importTestBundleWithMeta(input: {
	text: string;
	meta: ImportTestMetaInput;
}): Promise<{ test: SpaceTestDTO; imported: number; preview: TestBundlePreview }> {
	const subject = await repo.findSubjectById(input.meta.subjectId);
	if (!subject) throw new AppError('Không tìm thấy môn học', 404);

	const parsed = parseTestBundleCsvText(input.text, { requireMeta: false });
	const preview = toBundlePreview(parsed, { requireMeta: false });
	if (!preview.canImport || parsed.questions.length === 0) {
		const detail =
			parsed.metaErrors[0] ??
			parsed.errors[0]?.message ??
			'CSV câu hỏi không hợp lệ';
		throw new AppError(detail, 422);
	}

	const questionCount = input.meta.questionCount ?? parsed.questions.length;
	if (questionCount > parsed.questions.length) {
		throw new AppError(
			`Số câu mỗi lần (${questionCount}) lớn hơn số câu hợp lệ (${parsed.questions.length})`,
			422,
		);
	}

	const slug = await uniqueSlug(input.meta.slug ?? input.meta.title);
	const status = input.meta.status ?? 'PUBLISHED';

	const test = await repo.createSpaceTestWithQuestions({
		slug,
		title: input.meta.title,
		description: input.meta.description?.trim() ?? '',
		subjectId: subject.id,
		questionCount,
		status,
		questions: parsed.questions,
	});

	return { test, imported: parsed.questions.length, preview };
}

// ─── Questions ──────────────────────────────────────────────────────────────

export async function listQuestions(params?: Parameters<typeof repo.listQuestions>[0]) {
	return repo.listQuestions(params);
}

export async function getQuestion(id: string): Promise<McqQuestionDTO> {
	const q = await repo.findQuestionById(id);
	if (!q) throw new AppError('Không tìm thấy câu hỏi', 404);
	return q;
}

export async function updateQuestion(
	id: string,
	input: UpdateMcqQuestionInput,
): Promise<McqQuestionDTO> {
	const updated = await repo.updateQuestion(id, input);
	if (!updated) throw new AppError('Không tìm thấy câu hỏi', 404);
	return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
	const existing = await repo.findQuestionById(id);
	if (!existing) throw new AppError('Không tìm thấy câu hỏi', 404);
	if (await repo.isQuestionInAnySession(id)) {
		throw new AppError(
			'Không thể xóa câu hỏi đang thuộc phiên làm bài. Hãy ẩn câu hỏi thay vì xóa.',
			409,
		);
	}
	const ok = await repo.deleteQuestion(id);
	if (!ok) throw new AppError('Không tìm thấy câu hỏi', 404);
}

export async function getFilterMeta(): Promise<QuestionFilterMeta> {
	return repo.getFilterMeta();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

export async function listAdminTests(): Promise<SpaceTestDTO[]> {
	return repo.listSpaceTests();
}

export async function listAdminTestsWithCounts(): Promise<SpaceTestWithQuestionCount[]> {
	return repo.listSpaceTestsWithQuestionCounts();
}

export async function getAnalyticsOverview(days = 30) {
	return repo.getAnalyticsOverview(days);
}

export async function getAttemptStatsByTest() {
	return repo.getAttemptStatsByTest();
}

export async function listPublishedTests(): Promise<PublicSpaceTestListItem[]> {
	const [tests, stats] = await Promise.all([
		repo.listSpaceTests('PUBLISHED'),
		repo.getAttemptStatsByTest(),
	]);
	const byId = new Map(stats.map((s) => [s.spaceTestId, s]));
	return tests.map((t) => {
		const s = byId.get(t.id);
		return toPublicListItem(
			t,
			s
				? {
						engaged: s.engaged,
						completed: s.completed,
						avgScorePercent: s.avgScorePercent,
						avgDurationMs: s.avgDurationMs,
					}
				: undefined,
		);
	});
}

export async function listPublishedTestsGrouped(): Promise<PublicSubjectGroup[]> {
	const tests = await listPublishedTests();
	const bySubject = new Map<string, { subjectId: string; tests: PublicSpaceTestListItem[] }>();

	for (const t of tests) {
		const entry = bySubject.get(t.subject) ?? { subjectId: t.subjectId, tests: [] };
		entry.tests.push(t);
		bySubject.set(t.subject, entry);
	}

	const subjects = [...bySubject.keys()].sort((a, b) =>
		a.localeCompare(b, undefined, { sensitivity: 'base' }),
	);

	return subjects.map((subject) => {
		const entry = bySubject.get(subject)!;
		return {
			subject,
			subjectId: entry.subjectId,
			tests: entry.tests.sort((a, b) =>
				a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
			),
		};
	});
}

export async function getAdminTest(id: string): Promise<SpaceTestWithQuestionCount> {
	const t = await repo.findSpaceTestById(id);
	if (!t) throw new AppError('Không tìm thấy bài test', 404);
	const attachedQuestionCount = await repo.countQuestionsByTestId(id);
	return { ...t, attachedQuestionCount };
}

export async function getPublishedTestBySlug(slug: string): Promise<SpaceTestDTO> {
	const row = await repo.findSpaceTestBySlug(slug);
	if (!row || row.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy bài test', 404);
	}
	return repo.mapSpaceTest(row);
}

export async function createTest(input: CreateSpaceTestInput): Promise<SpaceTestDTO> {
	const subject = await repo.findSubjectById(input.subjectId);
	if (!subject) throw new AppError('Không tìm thấy môn học', 404);

	const slug = await uniqueSlug(input.slug ?? input.title);
	const attachedHint = await repo.findActivePool({ subjectId: input.subjectId });
	if (attachedHint.length === 0) {
		// Allow creating empty-pool draft; publish path validates
		if ((input.status ?? 'DRAFT') === 'PUBLISHED') {
			throw new AppError('Không có câu hỏi nào khớp môn học này', 422);
		}
	} else if (attachedHint.length < input.questionCount && (input.status ?? 'DRAFT') === 'PUBLISHED') {
		throw new AppError(
			`Pool chỉ có ${attachedHint.length} câu, cần ít nhất ${input.questionCount}`,
			422,
		);
	}
	return repo.createSpaceTest({ ...input, slug });
}

export async function updateTest(id: string, input: UpdateSpaceTestInput): Promise<SpaceTestDTO> {
	const existing = await repo.findSpaceTestById(id);
	if (!existing) throw new AppError('Không tìm thấy bài test', 404);

	if (input.subjectId) {
		const subject = await repo.findSubjectById(input.subjectId);
		if (!subject) throw new AppError('Không tìm thấy môn học', 404);
	}

	let slug = input.slug;
	if (input.slug !== undefined || input.title !== undefined) {
		slug = await uniqueSlug(input.slug ?? input.title ?? existing.title, id);
	}

	const subjectId = input.subjectId ?? existing.subjectId;
	const topics = input.topics ?? existing.topics;
	const difficulties = input.difficulties ?? existing.difficulties;
	const classifications = input.classifications ?? existing.classifications;
	const questionCount = input.questionCount ?? existing.questionCount;

	if (
		input.subjectId !== undefined ||
		input.topics !== undefined ||
		input.difficulties !== undefined ||
		input.classifications !== undefined ||
		input.questionCount !== undefined ||
		input.status === 'PUBLISHED'
	) {
		const attached = await repo.findActivePoolByTestId(id);
		const pool =
			attached.length > 0
				? attached
				: await repo.findActivePool({
						subjectId,
						topics,
						difficulties,
						classifications,
					});
		if (pool.length < questionCount) {
			throw new AppError(
				`Pool chỉ có ${pool.length} câu, cần ít nhất ${questionCount}`,
				422,
			);
		}
	}

	const updated = await repo.updateSpaceTest(id, { ...input, slug });
	if (!updated) throw new AppError('Không tìm thấy bài test', 404);
	return updated;
}

export async function deleteTest(id: string): Promise<void> {
	const ok = await repo.deleteSpaceTest(id);
	if (!ok) throw new AppError('Không tìm thấy bài test', 404);
}

export async function previewSample(filters: {
	subjectId: string;
	topics?: string[];
	difficulties?: number[];
	classifications?: string[];
	questionCount: number;
}): Promise<{ poolSize: number; sample: PublicQuizQuestion[] }> {
	const pool = await repo.findActivePool(filters);
	const sampled = sampleBalancedQuestions(pool, filters.questionCount);
	return {
		poolSize: pool.length,
		sample: sampled.map(toPublicQuestion),
	};
}

type PublishedTest = NonNullable<Awaited<ReturnType<typeof repo.findSpaceTestBySlug>>>;

type PoolFilters = {
	difficulties?: number[];
	learningObjectives?: string[];
};

function intersectFilters(base: number[], selected?: number[]): number[] | undefined {
	if (!selected?.length) return base.length > 0 ? base : undefined;
	if (base.length === 0) return selected;
	return selected.filter((value) => base.includes(value));
}

async function resolveBasePool(test: PublishedTest, filters?: PoolFilters) {
	const attachedBase = await repo.findActivePoolByTestId(test.id);
	if (attachedBase.length > 0) {
		const hasUserFilters = Boolean(
			filters?.difficulties?.length || filters?.learningObjectives?.length,
		);
		if (!hasUserFilters) return { pool: attachedBase, source: 'attached' as const };
		const filtered = await repo.findActivePoolByTestId(test.id, filters);
		return { pool: filtered, source: 'attached' as const };
	}

	return {
		pool: await repo.findActivePool({
			subjectId: test.subjectId,
			topics: test.topics.length > 0 ? test.topics : undefined,
			difficulties: intersectFilters(test.difficulties, filters?.difficulties),
			learningObjectives: filters?.learningObjectives,
			classifications: test.classifications.length > 0 ? test.classifications : undefined,
		}),
		source: 'bank' as const,
	};
}

async function resolvePoolMeta(test: PublishedTest) {
	const attachedMeta = await repo.findPoolMetaByTestId(test.id);
	if (attachedMeta.length > 0) return attachedMeta;
	return repo.findPoolMetaByBank({
		subjectId: test.subjectId,
		topics: test.topics.length > 0 ? test.topics : undefined,
		difficulties: test.difficulties.length > 0 ? test.difficulties : undefined,
		classifications: test.classifications.length > 0 ? test.classifications : undefined,
	});
}

function countByString(values: string[]): Array<{ value: string; count: number }> {
	const map = new Map<string, number>();
	for (const v of values) {
		if (!v.trim()) continue;
		map.set(v, (map.get(v) ?? 0) + 1);
	}
	return [...map.entries()]
		.map(([value, count]) => ({ value, count }))
		.sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' }));
}

function countByNumber(values: number[]): Array<{ value: number; count: number }> {
	const map = new Map<number, number>();
	for (const v of values) {
		map.set(v, (map.get(v) ?? 0) + 1);
	}
	return [...map.entries()]
		.map(([value, count]) => ({ value, count }))
		.sort((a, b) => a.value - b.value);
}

async function requirePublishedTest(slug: string): Promise<PublishedTest> {
	const test = await repo.findSpaceTestBySlug(slug);
	if (!test || test.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy bài test', 404);
	}
	return test;
}

export async function getPlayOptions(slug: string): Promise<TestPlayOptions> {
	const test = await requirePublishedTest(slug);
	const meta = await resolvePoolMeta(test);
	if (meta.length === 0) {
		throw new AppError('Ngân hàng câu hỏi trống cho bài test này', 422);
	}

	return {
		title: test.title,
		subject: test.subject.name,
		defaultQuestionCount: test.questionCount,
		poolSize: meta.length,
		difficulties: countByNumber(meta.map((m) => m.difficulty)),
		learningObjectives: countByString(meta.map((m) => m.learningObjective)),
	};
}

export async function countPlayPool(
	slug: string,
	filters: PlayPoolFiltersInput,
): Promise<PlayPoolCountResult> {
	const test = await requirePublishedTest(slug);
	const { pool } = await resolveBasePool(test, filters);
	return { count: pool.length };
}

export async function startSession(
	slug: string,
	input?: StartSessionInput,
): Promise<SessionStartResult> {
	const test = await requirePublishedTest(slug);
	const mode = input?.mode ?? 'default';
	const persist = input?.persist ?? true;
	const engage = input?.engage ?? false;

	let questionIds = input?.questionIds;
	let sampled: Awaited<ReturnType<typeof resolveBasePool>>['pool'] = [];

	if (questionIds && questionIds.length > 0) {
		const questions = await repo.findQuestionsByIds(questionIds);
		if (questions.length !== questionIds.length) {
			throw new AppError('Danh sách câu hỏi không hợp lệ', 400);
		}
		const allowed = new Set(
			(await resolveBasePool(test)).pool.map((q) => q.id),
		);
		if (questionIds.some((id) => !allowed.has(id))) {
			throw new AppError('Câu hỏi không thuộc bài test này', 400);
		}
		sampled = questions.map((q) => ({
			id: q.id,
			topic: q.topic,
			difficulty: q.difficulty,
			stem: q.stem,
			optionA: q.optionA,
			optionB: q.optionB,
			optionC: q.optionC,
			optionD: q.optionD,
			correctOption: q.correctOption,
		}));
	} else {
		const userFilters: PoolFilters | undefined =
			mode === 'custom'
				? {
						difficulties: input?.difficulties,
						learningObjectives: input?.learningObjectives,
					}
				: undefined;

		const resolved = await resolveBasePool(test, userFilters);
		sampled = resolved.pool;

		if (sampled.length === 0) {
			throw new AppError(
				mode === 'custom'
					? 'Không có câu hỏi phù hợp với bộ lọc đã chọn'
					: 'Ngân hàng câu hỏi trống cho bài test này',
				422,
			);
		}

		const questionCount =
			mode === 'custom' && input?.questionCount !== undefined
				? input.questionCount
				: test.questionCount;

		if (mode === 'custom' && questionCount > sampled.length) {
			throw new AppError(
				`Chỉ có ${sampled.length} câu phù hợp với bộ lọc đã chọn`,
				422,
			);
		}

		sampled = sampleBalancedQuestions(sampled, questionCount);
		questionIds = sampled.map((q) => q.id);
	}

	if (!persist) {
		return {
			sessionId: null,
			title: test.title,
			subject: test.subject.name,
			questions: sampled.map(toPublicQuestion),
		};
	}

	const session = await repo.createSession(test.id, questionIds!, {
		engaged: engage,
	});

	return {
		sessionId: session.id,
		title: test.title,
		subject: test.subject.name,
		questions: sampled.map(toPublicQuestion),
	};
}

/** Load a playable question set without writing a session row. */
export async function preparePlay(slug: string): Promise<SessionStartResult> {
	return startSession(slug, { mode: 'default', persist: false, engage: false });
}

export async function checkAnswer(
	slug: string,
	sessionId: string,
	input: CheckAnswerInput,
): Promise<CheckAnswerResult> {
	const session = await repo.findSessionById(sessionId);
	if (!session || session.spaceTest.slug !== slug) {
		throw new AppError('Không tìm thấy phiên làm bài', 404);
	}
	if (session.submittedAt) {
		throw new AppError('Phiên này đã nộp bài', 409);
	}
	if (!session.questionIds.includes(input.questionId)) {
		throw new AppError('Câu hỏi không thuộc phiên này', 400);
	}

	const questions = await repo.findQuestionsByIds([input.questionId]);
	const q = questions[0];
	if (!q) throw new AppError('Không tìm thấy câu hỏi', 404);

	if (!session.engagedAt) {
		await repo.markSessionEngaged(sessionId);
	}

	return {
		questionId: q.id,
		chosen: input.chosen,
		correctOption: q.correctOption,
		isCorrect: input.chosen === q.correctOption,
	};
}

export async function submitSession(
	slug: string,
	sessionId: string,
	input: SubmitSessionInput,
): Promise<SessionSubmitResult> {
	const session = await repo.findSessionById(sessionId);
	if (!session || session.spaceTest.slug !== slug) {
		throw new AppError('Không tìm thấy phiên làm bài', 404);
	}
	if (session.submittedAt) {
		throw new AppError('Phiên này đã nộp bài', 409);
	}

	const answerMap = new Map(input.answers.map((a) => [a.questionId, a.chosen]));
	for (const id of session.questionIds) {
		if (!answerMap.has(id)) {
			throw new AppError('Thiếu đáp án cho một số câu hỏi', 400);
		}
	}

	const questions = await repo.findQuestionsByIds(session.questionIds);
	let score = 0;
	const review: SessionSubmitResult['review'] = [];

	for (const q of questions) {
		const chosen = answerMap.get(q.id) as McqCorrectOption;
		const isCorrect = chosen === q.correctOption;
		if (isCorrect) score += 1;
		review.push({
			questionId: q.id,
			stem: q.stem,
			chosen,
			correctOption: q.correctOption,
			isCorrect,
			options: toPublicQuestion(q).options,
		});
	}

	await repo.submitSession(sessionId, score, questions.length);

	return { score, total: questions.length, review };
}
