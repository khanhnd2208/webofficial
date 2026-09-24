import { Prisma, type LearnSection } from '@prisma/client';
import { cache } from 'react';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/utils/slugify';

import {
	gradeQuiz,
	quizForLearner,
	quizKey,
	readCheckpoint,
	readQuiz,
	readQuizResult,
	sectionMinutes,
} from './content';
import { parseCourseMarkdown, planContentReplace, type ImportedSection } from './lessonImport';
import {
	LEARN_MAX_MARKDOWN,
	type CreateLearnCourseInput,
	type CreateLearnLessonInput,
	type CreateLearnSectionInput,
	type ReorderLearnOutlineInput,
	type UpdateLearnCourseInput,
	type UpdateLearnLessonInput,
	type UpdateLearnProgressInput,
	type UpdateLearnSectionInput,
} from './schemas';
import type {
	LearnCourseListItem,
	LearnCourseMeta,
	LearnCourseOutline,
	LearnQuizReview,
	LearnReaderSection,
	LearnSectionProgressState,
	LearnStudioCourse,
	LearnStudioLesson,
	LearnStudioSection,
} from './types';

/** Who is asking: learners only ever see published courses; the admin also sees drafts. */
export interface LearnViewer {
	userId: string;
	isAdmin: boolean;
}

const visibleStatus = (viewer: Pick<LearnViewer, 'isAdmin'>) =>
	viewer.isAdmin ? { not: 'ARCHIVED' as const } : ('PUBLISHED' as const);

const courseMetaSelect = {
	id: true,
	slug: true,
	title: true,
	subtitle: true,
	description: true,
	category: true,
	level: true,
	status: true,
	updatedAt: true,
} as const;

function mapMeta(row: Prisma.LearnCourseGetPayload<{ select: typeof courseMetaSelect }>): LearnCourseMeta {
	return { ...row, updatedAt: row.updatedAt.toISOString() };
}

function minutesOf(section: Pick<LearnSection, 'type' | 'durationMinutes' | 'markdown' | 'quiz'>) {
	return sectionMinutes({
		type: section.type,
		durationMinutes: section.durationMinutes,
		markdown: section.markdown,
		quiz: readQuiz(section.quiz),
	});
}

function mapStudioSection(section: LearnSection): LearnStudioSection {
	return {
		id: section.id,
		lessonId: section.lessonId,
		type: section.type,
		title: section.title,
		durationMinutes: section.durationMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		quiz: readQuiz(section.quiz),
		updatedAt: section.updatedAt.toISOString(),
	};
}

/** Map Prisma's "record not found" to a 404 and let every other failure surface. */
function notFound(message: string) {
	return (error: unknown): never => {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
			throw new AppError(message, 404);
		}
		throw error;
	};
}

function jsonOrNull(value: unknown) {
	return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

async function uniqueSlug(source: string, excludeId?: string) {
	const base = slugify(source) || 'khoa-hoc';
	let candidate = base;
	let index = 2;
	while (
		await prisma.learnCourse.findFirst({
			where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
			select: { id: true },
		})
	) {
		candidate = `${base}-${index}`;
		index += 1;
	}
	return candidate;
}

const orderedOutline = {
	lessons: {
		orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
		include: { sections: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
	},
} satisfies Prisma.LearnCourseInclude;

// ─── Learner ─────────────────────────────────────────────────────────────────

export async function listLearnCourses(viewer: LearnViewer): Promise<LearnCourseListItem[]> {
	const rows = await prisma.learnCourse.findMany({
		where: { status: visibleStatus(viewer) },
		orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
		select: {
			...courseMetaSelect,
			lessons: {
				orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
				select: {
					sections: {
						orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
						select: { id: true, type: true, durationMinutes: true, markdown: true, quiz: true },
					},
				},
			},
		},
	});
	const progress = await prisma.learnSectionProgress.findMany({
		where: { userId: viewer.userId },
		select: { courseId: true, sectionId: true, completedAt: true, updatedAt: true },
	});
	const completedSections = new Set(progress.filter((row) => row.completedAt).map((row) => row.sectionId));
	const lastActivity = new Map<string, Date>();
	for (const row of progress) {
		const seen = lastActivity.get(row.courseId);
		if (!seen || row.updatedAt > seen) lastActivity.set(row.courseId, row.updatedAt);
	}

	return rows.map(({ lessons, ...row }) => {
		const sections = lessons.flatMap((lesson) => lesson.sections);
		return {
			...mapMeta(row),
			lessonCount: lessons.length,
			sectionCount: sections.length,
			totalMinutes: sections.reduce((sum, section) => sum + minutesOf(section), 0),
			completedCount: sections.filter((section) => completedSections.has(section.id)).length,
			quizCount: sections.filter((section) => section.type === 'QUIZ').length,
			nextSectionId: sections.find((section) => !completedSections.has(section.id))?.id ?? null,
			lastActivityAt: lastActivity.get(row.id)?.toISOString() ?? null,
		};
	});
}

const loadLearnCourseOutline = cache(async function loadLearnCourseOutline(
	slug: string,
	isAdmin: boolean,
): Promise<LearnCourseOutline | null> {
	const row = await prisma.learnCourse.findFirst({
		where: { slug, status: visibleStatus({ isAdmin }) },
		select: { ...courseMetaSelect, ...orderedOutline },
	});
	if (!row) return null;
	const { lessons, ...meta } = row;
	return {
		...mapMeta(meta),
		lessons: lessons.map((lesson) => ({
			id: lesson.id,
			title: lesson.title,
			description: lesson.description,
			sections: lesson.sections.map((section) => ({
				id: section.id,
				title: section.title,
				type: section.type,
				minutes: minutesOf(section),
			})),
		})),
	};
});

export function getLearnCourseOutline(
	slug: string,
	viewer: Pick<LearnViewer, 'isAdmin'>,
): Promise<LearnCourseOutline | null> {
	return loadLearnCourseOutline(slug, viewer.isAdmin);
}

export async function getLearnProgress(
	userId: string,
	courseId: string,
): Promise<Record<string, LearnSectionProgressState>> {
	const rows = await prisma.learnSectionProgress.findMany({ where: { userId, courseId } });
	return Object.fromEntries(
		rows.map((row) => [
			row.sectionId,
			{
				completed: Boolean(row.completedAt),
				note: row.note,
				quizResult: readQuizResult(row.quizResult),
			},
		]),
	);
}

function reviewFor(section: LearnSection, result: unknown): LearnQuizReview | null {
	const quiz = readQuiz(section.quiz);
	const parsed = readQuizResult(result);
	return quiz && parsed ? { result: parsed, key: quizKey(quiz) } : null;
}

export async function getLearnReaderSection(
	courseId: string,
	sectionId: string,
	userId: string,
): Promise<LearnReaderSection | null> {
	const section = await prisma.learnSection.findFirst({
		where: { id: sectionId, lesson: { courseId } },
		include: { progress: { where: { userId }, select: { quizResult: true } } },
	});
	if (!section) return null;
	const quiz = readQuiz(section.quiz);
	return {
		id: section.id,
		lessonId: section.lessonId,
		type: section.type,
		title: section.title,
		minutes: minutesOf(section),
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		quiz: section.type === 'QUIZ' && quiz ? quizForLearner(quiz) : null,
		review: section.type === 'QUIZ' ? reviewFor(section, section.progress[0]?.quizResult) : null,
	};
}

async function sectionForViewer(sectionId: string, viewer: LearnViewer) {
	if (!viewer.userId) throw new AppError('Phiên đăng nhập không hợp lệ', 401);
	const section = await prisma.learnSection.findFirst({
		where: { id: sectionId, lesson: { course: { status: visibleStatus(viewer) } } },
		include: { lesson: { select: { courseId: true } } },
	});
	if (!section) throw new AppError('Không tìm thấy mục học', 404);
	return section;
}

export async function updateLearnProgress(
	sectionId: string,
	viewer: LearnViewer,
	input: UpdateLearnProgressInput,
): Promise<LearnSectionProgressState> {
	const section = await sectionForViewer(sectionId, viewer);
	const data: Prisma.LearnSectionProgressUpdateInput = {};
	if (input.completed !== undefined) data.completedAt = input.completed ? new Date() : null;
	if (input.note !== undefined) data.note = input.note;

	const row = await prisma.learnSectionProgress.upsert({
		where: { userId_sectionId: { userId: viewer.userId, sectionId } },
		create: {
			userId: viewer.userId,
			sectionId,
			courseId: section.lesson.courseId,
			completedAt: input.completed ? new Date() : null,
			note: input.note ?? '',
		},
		update: data,
	});
	return { completed: Boolean(row.completedAt), note: row.note, quizResult: readQuizResult(row.quizResult) };
}

export async function submitLearnQuiz(
	sectionId: string,
	viewer: LearnViewer,
	answers: Record<string, number>,
): Promise<LearnQuizReview> {
	const section = await sectionForViewer(sectionId, viewer);
	const quiz = readQuiz(section.quiz);
	if (section.type !== 'QUIZ' || !quiz || !quiz.questions.length) {
		throw new AppError('Mục này không có bài kiểm tra', 400);
	}
	const result = gradeQuiz(quiz, answers);
	// A passed quiz completes the section; a failed retry never un-completes it.
	const completedAt = result.passed ? new Date() : undefined;
	await prisma.learnSectionProgress.upsert({
		where: { userId_sectionId: { userId: viewer.userId, sectionId } },
		create: {
			userId: viewer.userId,
			sectionId,
			courseId: section.lesson.courseId,
			quizResult: result as unknown as Prisma.InputJsonValue,
			completedAt: completedAt ?? null,
		},
		update: {
			quizResult: result as unknown as Prisma.InputJsonValue,
			...(completedAt ? { completedAt } : {}),
		},
	});
	return { result, key: quizKey(quiz) };
}

// ─── Studio (admin) ──────────────────────────────────────────────────────────

function mapStudioLesson(
	lesson: Prisma.LearnLessonGetPayload<{ include: { sections: true } }>,
): LearnStudioLesson {
	return {
		id: lesson.id,
		title: lesson.title,
		description: lesson.description,
		sections: lesson.sections.map(mapStudioSection),
	};
}

export async function getLearnStudioCourse(slug: string): Promise<LearnStudioCourse | null> {
	const row = await prisma.learnCourse.findUnique({
		where: { slug },
		select: { ...courseMetaSelect, ...orderedOutline },
	});
	if (!row) return null;
	const { lessons, ...meta } = row;
	return { ...mapMeta(meta), lessons: lessons.map(mapStudioLesson) };
}

export async function createLearnCourse(input: CreateLearnCourseInput): Promise<LearnCourseMeta> {
	const last = await prisma.learnCourse.aggregate({ _max: { position: true } });
	const row = await prisma.learnCourse.create({
		data: {
			...input,
			slug: await uniqueSlug(input.title),
			position: (last._max.position ?? -1) + 1,
			lessons: { create: { title: 'Bài 1', sections: { create: { title: 'Mục đầu tiên' } } } },
		},
		select: courseMetaSelect,
	});
	return mapMeta(row);
}

export async function updateLearnCourse(id: string, input: UpdateLearnCourseInput): Promise<LearnCourseMeta> {
	const current = await prisma.learnCourse.findUnique({ where: { id }, select: { status: true } });
	if (!current) throw new AppError('Không tìm thấy khóa học', 404);
	const { slug, ...rest } = input;
	const row = await prisma.learnCourse.update({
		where: { id },
		data: {
			...rest,
			...(slug !== undefined ? { slug: await uniqueSlug(slug || rest.title || 'khoa-hoc', id) } : {}),
			...(input.status === 'PUBLISHED' && current.status !== 'PUBLISHED' ? { publishedAt: new Date() } : {}),
		},
		select: courseMetaSelect,
	});
	return mapMeta(row);
}

export async function deleteLearnCourse(id: string): Promise<{ id: string }> {
	await prisma.learnCourse.delete({ where: { id } }).catch(notFound('Không tìm thấy khóa học'));
	return { id };
}

async function nextLessonPosition(courseId: string) {
	const course = await prisma.learnCourse.findUnique({ where: { id: courseId }, select: { id: true } });
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const last = await prisma.learnLesson.aggregate({ where: { courseId }, _max: { position: true } });
	return (last._max.position ?? -1) + 1;
}

export async function createLearnLesson(
	courseId: string,
	input: CreateLearnLessonInput,
): Promise<LearnStudioLesson> {
	const position = await nextLessonPosition(courseId);
	const lesson = await prisma.learnLesson.create({
		data: {
			courseId,
			title: input.title,
			description: input.description,
			position,
			sections: { create: { title: 'Mục mới' } },
		},
		include: { sections: true },
	});
	return mapStudioLesson(lesson);
}

function assertSectionsFit(sections: ImportedSection[]) {
	const oversized = sections.find((section) => section.markdown.length > LEARN_MAX_MARKDOWN);
	if (oversized) {
		throw new AppError(`Mục "${oversized.title}" quá dài để lưu. Hãy tách nhỏ mục này rồi nhập lại.`, 400);
	}
}

function sectionData(section: ImportedSection, position: number) {
	const isQuiz = section.type === 'QUIZ';
	return {
		type: section.type,
		title: section.title.slice(0, 200),
		summary: section.summary.slice(0, 2_000),
		markdown: isQuiz ? '' : section.markdown,
		durationMinutes: section.durationMinutes,
		keyTakeaways: section.keyTakeaways,
		checkpoint: jsonOrNull(section.checkpoint),
		quiz: jsonOrNull(section.quiz),
		position,
	};
}

export async function importLearnLesson(courseId: string, markdown: string): Promise<LearnStudioLesson> {
	const parsed = parseCourseMarkdown(markdown);
	const lesson = parsed.lessons[0];
	if (!lesson?.sections.length) throw new AppError('Không tìm thấy mục nào để nhập', 400);
	assertSectionsFit(lesson.sections);
	const position = await nextLessonPosition(courseId);
	const created = await prisma.learnLesson.create({
		data: {
			courseId,
			title: lesson.lessonTitle.slice(0, 200),
			description: lesson.lessonDescription.slice(0, 4_000),
			position,
			sections: { create: lesson.sections.map((section, index) => sectionData(section, index)) },
		},
		include: { sections: { orderBy: { position: 'asc' } } },
	});
	return mapStudioLesson(created);
}

export async function updateLearnLesson(id: string, input: UpdateLearnLessonInput): Promise<{ id: string }> {
	await prisma.learnLesson.update({ where: { id }, data: input }).catch(notFound('Không tìm thấy bài học'));
	return { id };
}

export async function deleteLearnLesson(id: string): Promise<{ id: string }> {
	await prisma.learnLesson.delete({ where: { id } }).catch(notFound('Không tìm thấy bài học'));
	return { id };
}

export async function createLearnSection(
	lessonId: string,
	input: CreateLearnSectionInput,
): Promise<LearnStudioSection> {
	const lesson = await prisma.learnLesson.findUnique({ where: { id: lessonId }, select: { id: true } });
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	const last = await prisma.learnSection.aggregate({ where: { lessonId }, _max: { position: true } });
	const isQuiz = input.type === 'QUIZ';
	const section = await prisma.learnSection.create({
		data: {
			lessonId,
			type: input.type,
			title: input.title ?? (isQuiz ? 'Bài kiểm tra' : 'Mục mới'),
			position: (last._max.position ?? -1) + 1,
			...(isQuiz
				? { quiz: { passingScorePercent: 70, timeLimitMinutes: null, questions: [] } }
				: {}),
		},
	});
	return mapStudioSection(section);
}

const REVISION_GAP_MS = 10 * 60 * 1000;
const REVISION_KEEP = 50;

async function snapshotSection(sectionId: string, reason: 'autosave' | 'import' | 'restore', force: boolean) {
	const current = await prisma.learnSection.findUnique({ where: { id: sectionId } });
	if (!current) return;
	if (!force) {
		const latest = await prisma.learnSectionRevision.findFirst({
			where: { sectionId },
			orderBy: { createdAt: 'desc' },
			select: { createdAt: true },
		});
		const lastAt = latest?.createdAt ?? current.createdAt;
		if (Date.now() - lastAt.getTime() < REVISION_GAP_MS) return;
	}
	await prisma.learnSectionRevision.create({
		data: {
			sectionId,
			title: current.title,
			summary: current.summary,
			markdown: current.markdown,
			keyTakeaways: current.keyTakeaways,
			checkpoint: current.checkpoint === null ? Prisma.DbNull : (current.checkpoint as Prisma.InputJsonValue),
			quiz: current.quiz === null ? Prisma.DbNull : (current.quiz as Prisma.InputJsonValue),
			reason,
		},
	});
	const stale = await prisma.learnSectionRevision.findMany({
		where: { sectionId },
		orderBy: { createdAt: 'desc' },
		skip: REVISION_KEEP,
		select: { id: true },
	});
	if (stale.length) {
		await prisma.learnSectionRevision.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
	}
}

export async function updateLearnSection(
	id: string,
	input: UpdateLearnSectionInput,
): Promise<LearnStudioSection> {
	const contentTouched = ['markdown', 'title', 'summary', 'keyTakeaways', 'checkpoint', 'quiz'].some(
		(key) => key in input,
	);
	if (contentTouched) await snapshotSection(id, 'autosave', false);
	const { checkpoint, quiz, ...rest } = input;
	const section = await prisma.learnSection
		.update({
			where: { id },
			data: {
				...rest,
				...(checkpoint !== undefined ? { checkpoint: jsonOrNull(checkpoint) } : {}),
				...(quiz !== undefined ? { quiz: jsonOrNull(quiz) } : {}),
			},
		})
		.catch(notFound('Không tìm thấy mục học'));
	return mapStudioSection(section);
}

export async function deleteLearnSection(id: string): Promise<{ id: string }> {
	await prisma.learnSection.delete({ where: { id } }).catch(notFound('Không tìm thấy mục học'));
	return { id };
}

/** Persist the full outline order in one go, including sections moved between lessons. */
export async function reorderLearnOutline(
	courseId: string,
	input: ReorderLearnOutlineInput,
): Promise<{ ok: true }> {
	const lessons = await prisma.learnLesson.findMany({
		where: { courseId },
		select: { id: true, sections: { select: { id: true } } },
	});
	const lessonIds = new Set(lessons.map((lesson) => lesson.id));
	const sectionIds = new Set(lessons.flatMap((lesson) => lesson.sections.map((section) => section.id)));
	const incomingSections = input.lessons.flatMap((lesson) => lesson.sectionIds);
	if (
		input.lessons.length !== lessonIds.size ||
		input.lessons.some((lesson) => !lessonIds.has(lesson.id)) ||
		incomingSections.length !== sectionIds.size ||
		incomingSections.some((id) => !sectionIds.has(id))
	) {
		throw new AppError('Mục lục đã thay đổi ở nơi khác. Hãy tải lại trang.', 409);
	}

	await prisma.$transaction([
		...input.lessons.map((lesson, position) =>
			prisma.learnLesson.update({ where: { id: lesson.id }, data: { position } }),
		),
		...input.lessons.flatMap((lesson) =>
			lesson.sectionIds.map((sectionId, position) =>
				prisma.learnSection.update({ where: { id: sectionId }, data: { lessonId: lesson.id, position } }),
			),
		),
	]);
	return { ok: true };
}

async function lessonInCourse(courseId: string, lessonId: string) {
	const lesson = await prisma.learnLesson.findFirst({
		where: { id: lessonId, courseId },
		include: { sections: { orderBy: { position: 'asc' } } },
	});
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	return lesson;
}

export async function importLearnMarkdown(
	courseId: string,
	input: { markdown: string; mode: 'create' | 'append' | 'replace'; lessonId?: string },
): Promise<LearnStudioLesson[]> {
	const parsed = parseCourseMarkdown(input.markdown);
	const withSections = parsed.lessons.filter((lesson) => lesson.sections.length);
	if (!withSections.length) throw new AppError('Không tìm thấy mục nào để nhập', 400);
	for (const lesson of withSections) assertSectionsFit(lesson.sections);

	if (input.mode === 'create') {
		const created: LearnStudioLesson[] = [];
		for (const lesson of withSections) {
			const position = await nextLessonPosition(courseId);
			const row = await prisma.learnLesson.create({
				data: {
					courseId,
					title: lesson.lessonTitle.slice(0, 200),
					description: lesson.lessonDescription.slice(0, 4_000),
					position,
					sections: { create: lesson.sections.map((section, index) => sectionData(section, index)) },
				},
				include: { sections: { orderBy: { position: 'asc' } } },
			});
			created.push(mapStudioLesson(row));
		}
		return created;
	}

	if (!input.lessonId) throw new AppError('Chọn bài để nhập vào', 400);
	const target = await lessonInCourse(courseId, input.lessonId);
	const incoming = withSections.flatMap((lesson) => lesson.sections);

	if (input.mode === 'append') {
		const start = target.sections.length;
		await prisma.$transaction(
			incoming.map((section, index) =>
				prisma.learnSection.create({ data: { lessonId: target.id, ...sectionData(section, start + index) } }),
			),
		);
	} else {
		const plan = planContentReplace(
			target.sections.map((section) => ({ id: section.id, title: section.title })),
			incoming,
		);
		const bySection = new Map(plan.updates.map((item) => [item.section, item.id]));
		await prisma.$transaction(async (tx) => {
			for (const [index, section] of incoming.entries()) {
				const existingId = bySection.get(section);
				const data = sectionData(section, index);
				if (existingId) {
					await snapshotSection(existingId, 'import', true);
					await tx.learnSection.update({
						where: { id: existingId },
						data: {
							type: data.type,
							title: data.title,
							summary: data.summary,
							markdown: data.markdown,
							durationMinutes: data.durationMinutes,
							keyTakeaways: data.keyTakeaways,
							checkpoint: data.checkpoint,
							quiz: data.quiz,
							position: index,
						},
					});
				} else {
					await tx.learnSection.create({ data: { lessonId: target.id, ...data } });
				}
			}
			if (plan.deletes.length) {
				await tx.learnSection.deleteMany({ where: { id: { in: plan.deletes.map((item) => item.id) } } });
			}
		});
	}

	const saved = await lessonInCourse(courseId, target.id);
	return [mapStudioLesson(saved)];
}

export async function listSectionRevisions(sectionId: string) {
	const rows = await prisma.learnSectionRevision.findMany({
		where: { sectionId },
		orderBy: { createdAt: 'desc' },
		take: REVISION_KEEP,
		select: { id: true, title: true, reason: true, createdAt: true, markdown: true },
	});
	return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function restoreSectionRevision(sectionId: string, revisionId: string): Promise<LearnStudioSection> {
	const revision = await prisma.learnSectionRevision.findFirst({ where: { id: revisionId, sectionId } });
	if (!revision) throw new AppError('Không tìm thấy bản lưu', 404);
	await snapshotSection(sectionId, 'restore', true);
	const section = await prisma.learnSection
		.update({
			where: { id: sectionId },
			data: {
				title: revision.title,
				summary: revision.summary,
				markdown: revision.markdown,
				keyTakeaways: revision.keyTakeaways,
				checkpoint: revision.checkpoint === null ? Prisma.DbNull : (revision.checkpoint as Prisma.InputJsonValue),
				quiz: revision.quiz === null ? Prisma.DbNull : (revision.quiz as Prisma.InputJsonValue),
			},
		})
		.catch(notFound('Không tìm thấy mục học'));
	return mapStudioSection(section);
}
