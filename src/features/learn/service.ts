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
	readDiscussion,
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
	LearnSectionWriteResult,
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

function storedMinutes(section: {
	type: LearnSection['type'];
	durationMinutes: number | null;
	markdown: string;
	quiz: unknown;
	discussion: unknown;
}) {
	return sectionMinutes({
		type: section.type,
		durationMinutes: section.durationMinutes,
		markdown: section.markdown,
		quiz: readQuiz(section.quiz),
		discussion: readDiscussion(section.discussion),
	});
}

function mapStudioSection(section: {
	id: string;
	lessonId: string;
	type: LearnSection['type'];
	title: string;
	durationMinutes: number | null;
	estimatedMinutes: number;
	summary: string;
	keyTakeaways: string[];
	markdown: string;
	checkpoint: Prisma.JsonValue;
	quiz: Prisma.JsonValue;
	discussion: Prisma.JsonValue;
	updatedAt: Date;
}): LearnStudioSection {
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
		discussion: readDiscussion(section.discussion),
		estimatedMinutes: section.estimatedMinutes,
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

const outlineOrder = [{ position: 'asc' as const }, { createdAt: 'asc' as const }];

/** Learner outline: titles and stored minutes only. Markdown stays on the open section. */
const learnerOutlineSelect = {
	lessons: {
		orderBy: outlineOrder,
		select: {
			id: true,
			title: true,
			description: true,
			sections: {
				orderBy: outlineOrder,
				select: { id: true, title: true, type: true, estimatedMinutes: true },
			},
		},
	},
} satisfies Prisma.LearnCourseSelect;

const studioSectionSelect = {
	id: true,
	lessonId: true,
	type: true,
	title: true,
	durationMinutes: true,
	estimatedMinutes: true,
	summary: true,
	keyTakeaways: true,
	markdown: true,
	checkpoint: true,
	quiz: true,
	discussion: true,
	updatedAt: true,
} as const;

/** Studio still loads every column of every section so the editor can open any item. */
const studioOutlineSelect = {
	lessons: {
		orderBy: outlineOrder,
		select: {
			id: true,
			title: true,
			description: true,
			sections: { orderBy: outlineOrder, select: studioSectionSelect },
		},
	},
} satisfies Prisma.LearnCourseSelect;

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
						select: { id: true, type: true, estimatedMinutes: true },
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
			totalMinutes: sections.reduce((sum, section) => sum + section.estimatedMinutes, 0),
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
		select: { ...courseMetaSelect, ...learnerOutlineSelect },
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
				minutes: section.estimatedMinutes,
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

export const getLearnProgress = cache(async function getLearnProgress(
	userId: string,
	courseId: string,
): Promise<Record<string, LearnSectionProgressState>> {
	const rows = await prisma.learnSectionProgress.findMany({
		where: { userId, courseId },
		select: { sectionId: true, completedAt: true, note: true, quizResult: true },
	});
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
});

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
		minutes: section.estimatedMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		quiz: section.type === 'QUIZ' && quiz ? quizForLearner(quiz) : null,
		review: section.type === 'QUIZ' ? reviewFor(section, section.progress[0]?.quizResult) : null,
		practice: section.type === 'PRACTICE' && quiz ? quiz.questions : null,
		discussion: section.type === 'DISCUSSION' ? readDiscussion(section.discussion) : null,
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

function mapStudioLesson(lesson: {
	id: string;
	title: string;
	description: string;
	sections: Parameters<typeof mapStudioSection>[0][];
}): LearnStudioLesson {
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
		select: { ...courseMetaSelect, ...studioOutlineSelect },
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
	const markdown = section.type === 'READING' ? section.markdown : '';
	return {
		type: section.type,
		title: section.title.slice(0, 200),
		summary: section.summary.slice(0, 2_000),
		markdown,
		durationMinutes: section.durationMinutes,
		keyTakeaways: section.keyTakeaways,
		checkpoint: jsonOrNull(section.checkpoint),
		quiz: jsonOrNull(section.quiz),
		discussion: jsonOrNull(section.discussion),
		position,
		estimatedMinutes: storedMinutes({
			type: section.type,
			durationMinutes: section.durationMinutes,
			markdown,
			quiz: section.quiz,
			discussion: section.discussion,
		}),
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
	const title =
		input.title ??
		(input.type === 'QUIZ'
			? 'Bài kiểm tra'
			: input.type === 'PRACTICE'
				? 'Luyện tập'
				: input.type === 'DISCUSSION'
					? 'Câu hỏi phản biện'
					: 'Mục mới');
	const quiz =
		input.type === 'QUIZ' || input.type === 'PRACTICE'
			? { passingScorePercent: 70, timeLimitMinutes: null, questions: [] }
			: null;
	const discussion = input.type === 'DISCUSSION' ? { questions: [] } : null;
	const section = await prisma.learnSection.create({
		data: {
			lessonId,
			type: input.type,
			title,
			position: (last._max.position ?? -1) + 1,
			...(quiz ? { quiz } : {}),
			...(discussion ? { discussion } : {}),
			estimatedMinutes: storedMinutes({
				type: input.type,
				durationMinutes: null,
				markdown: '',
				quiz,
				discussion,
			}),
		},
	});
	return mapStudioSection(section);
}

const REVISION_GAP_MS = 10 * 60 * 1000;
const REVISION_KEEP = 50;

async function snapshotSection(
	sectionId: string,
	reason: 'autosave' | 'import' | 'restore' | 'manual',
	force: boolean,
) {
	if (!force) {
		const latest = await prisma.learnSectionRevision.findFirst({
			where: { sectionId },
			orderBy: { createdAt: 'desc' },
			select: { createdAt: true },
		});
		const created = latest
			? null
			: await prisma.learnSection.findUnique({ where: { id: sectionId }, select: { createdAt: true } });
		if (!latest && !created) return;
		const lastAt = latest?.createdAt ?? created!.createdAt;
		if (Date.now() - lastAt.getTime() < REVISION_GAP_MS) return;
	}
	const current = await prisma.learnSection.findUnique({ where: { id: sectionId } });
	if (!current) return;
	await prisma.$transaction(async (tx) => {
		await tx.learnSectionRevision.create({
			data: {
				sectionId,
				title: current.title,
				summary: current.summary,
				markdown: current.markdown,
				keyTakeaways: current.keyTakeaways,
				checkpoint: current.checkpoint === null ? Prisma.DbNull : (current.checkpoint as Prisma.InputJsonValue),
				quiz: current.quiz === null ? Prisma.DbNull : (current.quiz as Prisma.InputJsonValue),
				discussion: current.discussion === null ? Prisma.DbNull : (current.discussion as Prisma.InputJsonValue),
				reason,
			},
		});
		const stale = await tx.learnSectionRevision.findMany({
			where: { sectionId },
			orderBy: { createdAt: 'desc' },
			skip: REVISION_KEEP,
			select: { id: true },
		});
		if (stale.length) {
			await tx.learnSectionRevision.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
		}
	});
}

const MINUTES_FIELDS = ['markdown', 'quiz', 'discussion', 'type', 'durationMinutes'] as const;

export async function updateLearnSection(
	id: string,
	input: UpdateLearnSectionInput,
	options?: { full?: boolean },
): Promise<LearnStudioSection | LearnSectionWriteResult> {
	const contentTouched = ['markdown', 'title', 'summary', 'keyTakeaways', 'checkpoint', 'quiz', 'discussion'].some(
		(key) => key in input,
	);
	if (contentTouched) await snapshotSection(id, 'autosave', false);
	const minutesTouched = MINUTES_FIELDS.some((key) => key in input);
	let estimatedMinutes: number | undefined;
	if (minutesTouched) {
		const current = await prisma.learnSection.findUnique({
			where: { id },
			select: { type: true, durationMinutes: true, markdown: true, quiz: true, discussion: true },
		});
		if (!current) throw new AppError('Không tìm thấy mục học', 404);
		estimatedMinutes = storedMinutes({
			type: input.type ?? current.type,
			durationMinutes: 'durationMinutes' in input ? (input.durationMinutes ?? null) : current.durationMinutes,
			markdown: input.markdown ?? current.markdown,
			quiz: 'quiz' in input ? input.quiz : current.quiz,
			discussion: 'discussion' in input ? input.discussion : current.discussion,
		});
	}
	const { checkpoint, quiz, discussion, ...rest } = input;
	const data = {
		...rest,
		...(checkpoint !== undefined ? { checkpoint: jsonOrNull(checkpoint) } : {}),
		...(quiz !== undefined ? { quiz: jsonOrNull(quiz) } : {}),
		...(discussion !== undefined ? { discussion: jsonOrNull(discussion) } : {}),
		...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
	};
	if (options?.full) {
		const section = await prisma.learnSection
			.update({ where: { id }, data })
			.catch(notFound('Không tìm thấy mục học'));
		return mapStudioSection(section);
	}
	const section = await prisma.learnSection
		.update({
			where: { id },
			data,
			select: { id: true, updatedAt: true, estimatedMinutes: true },
		})
		.catch(notFound('Không tìm thấy mục học'));
	return {
		id: section.id,
		updatedAt: section.updatedAt.toISOString(),
		estimatedMinutes: section.estimatedMinutes,
	};
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
		for (const section of incoming) {
			const existingId = bySection.get(section);
			if (existingId) await snapshotSection(existingId, 'import', true);
		}
		await prisma.$transaction(async (tx) => {
			for (const [index, section] of incoming.entries()) {
				const existingId = bySection.get(section);
				const data = sectionData(section, index);
				if (existingId) {
					await tx.learnSection.update({
						where: { id: existingId },
						data: {
							type: data.type,
							title: data.title,
							summary: data.summary,
							markdown: data.markdown,
							durationMinutes: data.durationMinutes,
							estimatedMinutes: data.estimatedMinutes,
							keyTakeaways: data.keyTakeaways,
							checkpoint: data.checkpoint,
							quiz: data.quiz,
							discussion: data.discussion,
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

export async function createSectionRevision(sectionId: string) {
	const current = await prisma.learnSection.findUnique({ where: { id: sectionId }, select: { id: true } });
	if (!current) throw new AppError('Không tìm thấy mục học', 404);
	await snapshotSection(sectionId, 'manual', true);
	return listSectionRevisions(sectionId);
}

export async function listSectionRevisions(sectionId: string) {
	const rows = await prisma.learnSectionRevision.findMany({
		where: { sectionId },
		orderBy: { createdAt: 'desc' },
		take: REVISION_KEEP,
		select: { id: true, title: true, reason: true, createdAt: true },
	});
	return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function restoreSectionRevision(sectionId: string, revisionId: string): Promise<LearnStudioSection> {
	const revision = await prisma.learnSectionRevision.findFirst({ where: { id: revisionId, sectionId } });
	if (!revision) throw new AppError('Không tìm thấy bản lưu', 404);
	await snapshotSection(sectionId, 'restore', true);
	const current = await prisma.learnSection.findUnique({
		where: { id: sectionId },
		select: { type: true, durationMinutes: true },
	});
	if (!current) throw new AppError('Không tìm thấy mục học', 404);
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
				discussion: revision.discussion === null ? Prisma.DbNull : (revision.discussion as Prisma.InputJsonValue),
				estimatedMinutes: storedMinutes({
					type: current.type,
					durationMinutes: current.durationMinutes,
					markdown: revision.markdown,
					quiz: revision.quiz,
					discussion: revision.discussion,
				}),
			},
		})
		.catch(notFound('Không tìm thấy mục học'));
	return mapStudioSection(section);
}
