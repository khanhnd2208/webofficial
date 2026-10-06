import { Prisma } from '@prisma/client';
import { cache } from 'react';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/utils/slugify';

import { readCheckpoint, readDiscussion, sectionMinutes } from './content';
import { isRequiredSection } from './progress';
import { parseCourseMarkdown, planContentReplace, type ImportedSection } from './lessonImport';
import { snapshotSection } from './sectionRevisions';
import { mapStudioSection } from './studioSection';

export {
	createSectionRevision,
	getLearnStudioSection,
	getSectionRevision,
	listSectionRevisions,
	restoreSectionRevision,
} from './sectionRevisions';
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
	LearnReaderSection,
	LearnSectionProgressState,
	LearnSectionWriteResult,
	LearnStudioCourse,
	LearnStudioLesson,
	LearnStudioSection,
} from './types';
import { LEARN_SECTION_KINDS, type LearnSectionKind } from './types';

/** Rows of the retired QUIZ and PRACTICE types stay in the table but never reach a page. */
const liveSection = {
	type: { in: [...LEARN_SECTION_KINDS] },
} satisfies Prisma.LearnSectionWhereInput;

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

function mapMeta(
	row: Prisma.LearnCourseGetPayload<{ select: typeof courseMetaSelect }>,
): LearnCourseMeta {
	return { ...row, updatedAt: row.updatedAt.toISOString() };
}

function storedMinutes(section: {
	type: LearnSectionKind;
	durationMinutes: number | null;
	markdown: string;
	discussion: unknown;
}) {
	return sectionMinutes({
		type: section.type,
		durationMinutes: section.durationMinutes,
		markdown: section.markdown,
		discussion: readDiscussion(section.discussion),
	});
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
				where: liveSection,
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
			sections: { where: liveSection, orderBy: outlineOrder, select: studioSectionSelect },
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
						where: liveSection,
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
	const completedSections = new Set(
		progress.filter((row) => row.completedAt).map((row) => row.sectionId),
	);
	const lastActivity = new Map<string, Date>();
	for (const row of progress) {
		const seen = lastActivity.get(row.courseId);
		if (!seen || row.updatedAt > seen) lastActivity.set(row.courseId, row.updatedAt);
	}

	return rows.map(({ lessons, ...row }) => {
		const sections = lessons
			.flatMap((lesson) => lesson.sections)
			.filter((section) => isRequiredSection(section.type as LearnSectionKind));
		return {
			...mapMeta(row),
			lessonCount: lessons.length,
			sectionCount: sections.length,
			totalMinutes: sections.reduce((sum, section) => sum + section.estimatedMinutes, 0),
			completedCount: sections.filter((section) => completedSections.has(section.id)).length,
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
				type: section.type as LearnSectionKind,
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
		select: { sectionId: true, completedAt: true, note: true },
	});
	return Object.fromEntries(
		rows.map((row) => [row.sectionId, { completed: Boolean(row.completedAt), note: row.note }]),
	);
});

export async function getLearnReaderSection(
	courseId: string,
	sectionId: string,
): Promise<LearnReaderSection | null> {
	const section = await prisma.learnSection.findFirst({
		where: { id: sectionId, lesson: { courseId }, ...liveSection },
	});
	if (!section) return null;
	return {
		id: section.id,
		lessonId: section.lessonId,
		type: section.type as LearnSectionKind,
		title: section.title,
		minutes: section.estimatedMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		discussion: section.type === 'DISCUSSION' ? readDiscussion(section.discussion) : null,
	};
}

async function sectionForViewer(sectionId: string, viewer: LearnViewer) {
	if (!viewer.userId) throw new AppError('Phiên đăng nhập không hợp lệ', 401);
	const section = await prisma.learnSection.findFirst({
		where: {
			id: sectionId,
			lesson: { course: { status: visibleStatus(viewer) } },
			...liveSection,
		},
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
	return { completed: Boolean(row.completedAt), note: row.note };
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

export async function updateLearnCourse(
	id: string,
	input: UpdateLearnCourseInput,
): Promise<LearnCourseMeta> {
	const current = await prisma.learnCourse.findUnique({ where: { id }, select: { status: true } });
	if (!current) throw new AppError('Không tìm thấy khóa học', 404);
	const { slug, ...rest } = input;
	const row = await prisma.learnCourse.update({
		where: { id },
		data: {
			...rest,
			...(slug !== undefined
				? { slug: await uniqueSlug(slug || rest.title || 'khoa-hoc', id) }
				: {}),
			...(input.status === 'PUBLISHED' && current.status !== 'PUBLISHED'
				? { publishedAt: new Date() }
				: {}),
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
	const course = await prisma.learnCourse.findUnique({
		where: { id: courseId },
		select: { id: true },
	});
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const last = await prisma.learnLesson.aggregate({
		where: { courseId },
		_max: { position: true },
	});
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
		throw new AppError(
			`Mục "${oversized.title}" quá dài để lưu. Hãy tách nhỏ mục này rồi nhập lại.`,
			400,
		);
	}
}

function sectionData(section: ImportedSection, position: number) {
	// A discussion keeps its markdown too: it is the "how to use these questions" intro.
	const markdown = section.markdown;
	return {
		type: section.type,
		title: section.title.slice(0, 200),
		summary: section.summary.slice(0, 2_000),
		markdown,
		durationMinutes: section.durationMinutes,
		keyTakeaways: section.keyTakeaways,
		checkpoint: jsonOrNull(section.checkpoint),
		discussion: jsonOrNull(section.discussion),
		position,
		estimatedMinutes: storedMinutes({
			type: section.type,
			durationMinutes: section.durationMinutes,
			markdown,
			discussion: section.discussion,
		}),
	};
}

export async function importLearnLesson(
	courseId: string,
	markdown: string,
): Promise<LearnStudioLesson> {
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

export async function updateLearnLesson(
	id: string,
	input: UpdateLearnLessonInput,
): Promise<{ id: string }> {
	await prisma.learnLesson
		.update({ where: { id }, data: input })
		.catch(notFound('Không tìm thấy bài học'));
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
	const lesson = await prisma.learnLesson.findUnique({
		where: { id: lessonId },
		select: { id: true },
	});
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	const last = await prisma.learnSection.aggregate({
		where: { lessonId },
		_max: { position: true },
	});
	const title = input.title ?? (input.type === 'DISCUSSION' ? 'Câu hỏi phản biện' : 'Mục mới');
	const discussion = input.type === 'DISCUSSION' ? { questions: [] } : null;
	const section = await prisma.learnSection.create({
		data: {
			lessonId,
			type: input.type,
			title,
			position: (last._max.position ?? -1) + 1,
			...(discussion ? { discussion } : {}),
			estimatedMinutes: storedMinutes({
				type: input.type,
				durationMinutes: null,
				markdown: '',
				discussion,
			}),
		},
	});
	return mapStudioSection(section);
}

const MINUTES_FIELDS = ['markdown', 'discussion', 'type', 'durationMinutes'] as const;

export async function updateLearnSection(
	id: string,
	input: UpdateLearnSectionInput,
	options?: { full?: boolean },
): Promise<LearnStudioSection | LearnSectionWriteResult> {
	const contentTouched = [
		'markdown',
		'title',
		'summary',
		'keyTakeaways',
		'checkpoint',
		'discussion',
	].some((key) => key in input);
	if (contentTouched) await snapshotSection(id, 'autosave', false);
	const minutesTouched = MINUTES_FIELDS.some((key) => key in input);
	let estimatedMinutes: number | undefined;
	if (minutesTouched) {
		const current = await prisma.learnSection.findUnique({
			where: { id, ...liveSection },
			select: { type: true, durationMinutes: true, markdown: true, discussion: true },
		});
		if (!current) throw new AppError('Không tìm thấy mục học', 404);
		estimatedMinutes = storedMinutes({
			type: input.type ?? (current.type as LearnSectionKind),
			durationMinutes:
				'durationMinutes' in input ? (input.durationMinutes ?? null) : current.durationMinutes,
			markdown: input.markdown ?? current.markdown,
			discussion: 'discussion' in input ? input.discussion : current.discussion,
		});
	}
	const { checkpoint, discussion, baseUpdatedAt, ...rest } = input;
	const data = {
		...rest,
		...(checkpoint !== undefined ? { checkpoint: jsonOrNull(checkpoint) } : {}),
		...(discussion !== undefined ? { discussion: jsonOrNull(discussion) } : {}),
		...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
	};
	if (baseUpdatedAt) {
		const changed = await prisma.learnSection.updateMany({
			where: { id, updatedAt: new Date(baseUpdatedAt) },
			data,
		});
		if (changed.count === 0) {
			const exists = await prisma.learnSection.findUnique({ where: { id }, select: { id: true } });
			if (!exists) throw new AppError('Không tìm thấy mục học', 404);
			throw new AppError('Mục vừa được sửa ở nơi khác', 409, 'SECTION_CONFLICT');
		}
		const section = await prisma.learnSection.findUnique({ where: { id } });
		if (!section) throw new AppError('Không tìm thấy mục học', 404);
		if (options?.full) return mapStudioSection(section);
		return {
			id: section.id,
			updatedAt: section.updatedAt.toISOString(),
			estimatedMinutes: section.estimatedMinutes,
		};
	}
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
		select: { id: true, sections: { where: liveSection, select: { id: true, updatedAt: true } } },
	});
	const sectionUpdatedAt = new Map(
		lessons.flatMap((lesson) => lesson.sections.map((section) => [section.id, section.updatedAt])),
	);
	const lessonIds = new Set(lessons.map((lesson) => lesson.id));
	const sectionIds = new Set(
		lessons.flatMap((lesson) => lesson.sections.map((section) => section.id)),
	);
	const incomingSections = input.lessons.flatMap((lesson) => lesson.sectionIds);
	if (
		input.lessons.length !== lessonIds.size ||
		input.lessons.some((lesson) => !lessonIds.has(lesson.id)) ||
		incomingSections.length !== sectionIds.size ||
		incomingSections.some((id) => !sectionIds.has(id))
	) {
		throw new AppError(
			'Mục lục đã thay đổi ở nơi khác. Hãy tải lại trang.',
			409,
			'OUTLINE_CONFLICT',
		);
	}

	await prisma.$transaction([
		...input.lessons.map((lesson, position) =>
			prisma.learnLesson.update({ where: { id: lesson.id }, data: { position } }),
		),
		...input.lessons.flatMap((lesson) =>
			lesson.sectionIds.map((sectionId, position) =>
				prisma.learnSection.update({
					where: { id: sectionId },
					data: {
						lessonId: lesson.id,
						position,
						updatedAt: sectionUpdatedAt.get(sectionId) ?? new Date(0),
					},
				}),
			),
		),
	]);
	return { ok: true };
}

async function lessonInCourse(courseId: string, lessonId: string) {
	const lesson = await prisma.learnLesson.findFirst({
		where: { id: lessonId, courseId },
		include: { sections: { where: liveSection, orderBy: { position: 'asc' } } },
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
					sections: {
						create: lesson.sections.map((section, index) => sectionData(section, index)),
					},
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
				prisma.learnSection.create({
					data: { lessonId: target.id, ...sectionData(section, start + index) },
				}),
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
							discussion: data.discussion,
							position: index,
						},
					});
				} else {
					await tx.learnSection.create({ data: { lessonId: target.id, ...data } });
				}
			}
			if (plan.deletes.length) {
				await tx.learnSection.deleteMany({
					where: { id: { in: plan.deletes.map((item) => item.id) } },
				});
			}
		});
	}

	const saved = await lessonInCourse(courseId, target.id);
	return [mapStudioLesson(saved)];
}
