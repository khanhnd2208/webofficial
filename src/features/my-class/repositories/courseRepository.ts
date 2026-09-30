import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import { authoringCourseInclude, publicCourseInclude } from './db';

export async function listPublishedCourses() {
	return prisma.myClassCourse.findMany({
		where: { status: 'PUBLISHED' },
		orderBy: { updatedAt: 'desc' },
	});
}

export async function listPublishedCourseOutlines() {
	return prisma.myClassCourse.findMany({
		where: { status: 'PUBLISHED' },
		orderBy: { updatedAt: 'desc' },
		include: publicCourseInclude,
	});
}

export async function countPublishedCourses() {
	return prisma.myClassCourse.count({ where: { status: 'PUBLISHED' } });
}

export async function findPublishedCourse(slug: string) {
	return prisma.myClassCourse.findFirst({
		where: { slug, status: 'PUBLISHED' },
		include: publicCourseInclude,
	});
}

export async function findAuthoringCourse(slug: string) {
	return prisma.myClassCourse.findFirst({
		where: { slug, status: { not: 'ARCHIVED' } },
		include: authoringCourseInclude,
	});
}

export const COURSE_TABLE_SORTS = ['title', 'status', 'updatedAt', 'createdAt'] as const;
export type CourseTableSort = (typeof COURSE_TABLE_SORTS)[number];

export async function listAdminCourseOptions() {
	return prisma.myClassCourse.findMany({
		select: { id: true, title: true, slug: true, status: true },
		orderBy: { title: 'asc' },
		take: 500,
	});
}

export async function listAdminCourses(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
		sortBy?: CourseTableSort;
		sortDir?: 'asc' | 'desc';
		skip?: number;
		take?: number;
	} = {},
) {
	const q = filter.q?.trim();
	const where: Prisma.MyClassCourseWhereInput = {
		...(filter.status ? { status: filter.status } : {}),
		...(filter.level ? { level: filter.level } : {}),
		...(q
			? {
					OR: [
						{ title: { contains: q, mode: 'insensitive' } },
						{ slug: { contains: q, mode: 'insensitive' } },
						{ tags: { has: q } },
					],
				}
			: {}),
	};
	const sortBy = filter.sortBy ?? 'updatedAt';
	const sortDir = filter.sortDir ?? 'desc';
	const [items, total] = await Promise.all([
		prisma.myClassCourse.findMany({
			where,
			orderBy: { [sortBy]: sortDir },
			skip: filter.skip,
			take: filter.take,
			select: {
				id: true,
				slug: true,
				title: true,
				status: true,
				level: true,
				tags: true,
				updatedAt: true,
				_count: {
					select: {
						lessons: true,
						placements: true,
						cohorts: true,
						memberships: { where: { status: 'ACTIVE' } },
					},
				},
			},
		}),
		prisma.myClassCourse.count({ where }),
	]);
	return { items, total };
}

export async function coursesWithUnpublishedDraft(ids: string[]) {
	if (!ids.length) return new Set<string>();
	const draftCourses = await prisma.myClassCourse.findMany({
		where: { id: { in: ids }, status: 'DRAFT' },
		select: { id: true },
	});
	const draftLessons = await prisma.myClassLesson.findMany({
		where: {
			courseId: { in: ids },
			OR: [
				{ status: 'DRAFT' },
				{
					sections: {
						some: {
							OR: [
								{ status: 'DRAFT' },
								{
									knowledge: {
										some: {
											knowledgeUnit: {
												OR: [
													{ status: 'DRAFT' },
													{ currentPublishedRevisionId: null },
													{ revisions: { some: { status: 'DRAFT' } } },
												],
											},
										},
									},
								},
							],
						},
					},
				},
			],
		},
		select: { courseId: true },
		distinct: ['courseId'],
	});
	return new Set([
		...draftCourses.map((row) => row.id),
		...draftLessons.map((row) => row.courseId),
	]);
}

export async function findAdminCourse(id: string) {
	return prisma.myClassCourse.findUnique({
		where: { id },
		include: {
			lessons: {
				orderBy: { position: 'asc' },
				include: {
					sections: {
						orderBy: { position: 'asc' },
						include: {
							knowledge: {
								orderBy: { position: 'asc' },
								include: {
									knowledgeUnit: {
										include: {
											currentPublishedRevision: true,
											revisions: { orderBy: { version: 'desc' }, take: 1 },
											_count: { select: { mappings: true } },
										},
									},
								},
							},
							_count: { select: { placements: true } },
						},
					},
					_count: { select: { placements: true } },
				},
			},
			placements: {
				orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
				include: { test: { include: { _count: { select: { questions: true, attempts: true } } } } },
			},
			cohorts: {
				orderBy: { createdAt: 'desc' },
				include: { _count: { select: { members: true } } },
			},
		},
	});
}

export async function findAdminCourseOutline(id: string) {
	return prisma.myClassCourse.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			slug: true,
			lessons: {
				where: { status: { not: 'ARCHIVED' } },
				orderBy: { position: 'asc' },
				select: {
					id: true,
					title: true,
					sections: {
						where: { status: { not: 'ARCHIVED' } },
						orderBy: { position: 'asc' },
						select: { id: true, title: true },
					},
				},
			},
		},
	});
}

export async function findCourseBySlug(slug: string) {
	return prisma.myClassCourse.findUnique({ where: { slug } });
}

export async function createCourse(data: {
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl?: string | null;
	level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
	tags?: string[];
	subjectId?: string | null;
}) {
	return prisma.myClassCourse.create({ data });
}

export async function updateCourse(
	id: string,
	data: {
		title?: string;
		slug?: string;
		summary?: string;
		description?: string;
		thumbnailUrl?: string | null;
		level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
		tags?: string[];
		subjectId?: string | null;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		publishedAt?: Date | null;
	},
) {
	return prisma.myClassCourse.update({ where: { id }, data });
}

export async function createLesson(data: {
	courseId: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
	return prisma.myClassLesson.create({ data });
}

export async function updateLesson(
	id: string,
	data: Partial<{
		title: string;
		slug: string;
		summary: string;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		position: number;
	}>,
) {
	return prisma.myClassLesson.update({ where: { id }, data });
}

export async function createSection(data: {
	lessonId: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
	return prisma.myClassSection.create({ data });
}

export async function updateSection(
	id: string,
	data: Partial<{
		title: string;
		slug: string;
		summary: string;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		position: number;
	}>,
) {
	return prisma.myClassSection.update({ where: { id }, data });
}

export async function findLesson(id: string) {
	return prisma.myClassLesson.findUnique({
		where: { id },
		include: { course: true, sections: { orderBy: { position: 'asc' } } },
	});
}

export async function findSection(id: string) {
	return prisma.myClassSection.findUnique({
		where: { id },
		include: { lesson: { include: { course: true } } },
	});
}

export async function maxLessonPosition(courseId: string) {
	const row = await prisma.myClassLesson.aggregate({
		where: { courseId },
		_max: { position: true },
	});
	return row._max.position ?? -1;
}

export async function maxSectionPosition(lessonId: string) {
	const row = await prisma.myClassSection.aggregate({
		where: { lessonId },
		_max: { position: true },
	});
	return row._max.position ?? -1;
}

export async function attachKnowledge(
	sectionId: string,
	knowledgeUnitId: string,
	position: number,
) {
	return prisma.myClassSectionKnowledgeUnit.create({
		data: { sectionId, knowledgeUnitId, position },
	});
}

export async function detachKnowledge(sectionId: string, knowledgeUnitId: string) {
	return prisma.myClassSectionKnowledgeUnit.delete({
		where: { sectionId_knowledgeUnitId: { sectionId, knowledgeUnitId } },
	});
}

export async function maxKnowledgePosition(sectionId: string) {
	const row = await prisma.myClassSectionKnowledgeUnit.aggregate({
		where: { sectionId },
		_max: { position: true },
	});
	return row._max.position ?? -1;
}

export async function reorderLessons(courseId: string, ids: string[]) {
	await prisma.$transaction(
		ids.map((id, position) => prisma.myClassLesson.update({ where: { id }, data: { position } })),
	);
	return findAdminCourse(courseId);
}

export async function reorderSections(lessonId: string, ids: string[]) {
	await prisma.$transaction(
		ids.map((id, position) => prisma.myClassSection.update({ where: { id }, data: { position } })),
	);
	const lesson = await findLesson(lessonId);
	return lesson;
}

export async function reorderSectionKnowledge(sectionId: string, knowledgeUnitIds: string[]) {
	await prisma.$transaction(
		knowledgeUnitIds.map((knowledgeUnitId, position) =>
			prisma.myClassSectionKnowledgeUnit.update({
				where: { sectionId_knowledgeUnitId: { sectionId, knowledgeUnitId } },
				data: { position },
			}),
		),
	);
}

export async function overviewCounts() {
	const now = Date.now();
	const [
		courses,
		lessons,
		sections,
		knowledgeUnits,
		knowledgeUnitsMissingPublished,
		tests,
		cohortsActive,
		memberships,
		attemptsLast7Days,
		attemptsLast30Days,
	] = await Promise.all([
		prisma.myClassCourse.groupBy({ by: ['status'], _count: true }),
		prisma.myClassLesson.count(),
		prisma.myClassSection.count(),
		prisma.knowledgeUnit.count(),
		prisma.knowledgeUnit.count({ where: { currentPublishedRevisionId: null } }),
		prisma.myClassTest.groupBy({ by: ['status'], _count: true }),
		prisma.myClassCohort.count({ where: { status: { not: 'ARCHIVED' } } }),
		prisma.myClassMembership.groupBy({ by: ['status'], _count: true }),
		prisma.myClassTestAttempt.count({
			where: { submittedAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
		}),
		prisma.myClassTestAttempt.count({
			where: { submittedAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
		}),
	]);
	const courseMap = Object.fromEntries(courses.map((row) => [row.status, row._count]));
	const testMap = Object.fromEntries(tests.map((row) => [row.status, row._count]));
	const memberMap = Object.fromEntries(memberships.map((row) => [row.status, row._count]));
	return {
		courses: {
			draft: courseMap.DRAFT ?? 0,
			published: courseMap.PUBLISHED ?? 0,
			archived: courseMap.ARCHIVED ?? 0,
		},
		lessons,
		sections,
		knowledgeUnits,
		knowledgeUnitsMissingPublished,
		tests: { draft: testMap.DRAFT ?? 0, published: testMap.PUBLISHED ?? 0 },
		cohortsActive,
		memberships: { pending: memberMap.PENDING ?? 0, active: memberMap.ACTIVE ?? 0 },
		attemptsLast7Days,
		attemptsLast30Days,
	};
}
