import type { Course, CourseModule, Lesson, PublishStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { CourseDetail, CourseListItem, LessonDTO, ModuleDTO, PublicCourseTeaser } from '../types';

function toIso(d: Date | null | undefined): string | null {
	return d ? d.toISOString() : null;
}

export function mapLesson(lesson: Lesson): LessonDTO {
	return {
		id: lesson.id,
		moduleId: lesson.moduleId,
		slug: lesson.slug,
		title: lesson.title,
		contentHtml: lesson.contentHtml,
		videoUrl: lesson.videoUrl,
		position: lesson.position,
		status: lesson.status,
		updatedAt: lesson.updatedAt.toISOString(),
	};
}

export function mapModule(
	mod: CourseModule & { lessons: Lesson[] },
): ModuleDTO {
	return {
		id: mod.id,
		courseId: mod.courseId,
		title: mod.title,
		description: mod.description,
		position: mod.position,
		lessons: [...mod.lessons].sort((a, b) => a.position - b.position).map(mapLesson),
	};
}

export function mapCourseDetail(
	course: Course & { modules: (CourseModule & { lessons: Lesson[] })[] },
): CourseDetail {
	return {
		id: course.id,
		slug: course.slug,
		title: course.title,
		summary: course.summary,
		description: course.description,
		thumbnailUrl: course.thumbnailUrl,
		status: course.status,
		publishedAt: toIso(course.publishedAt),
		createdAt: course.createdAt.toISOString(),
		updatedAt: course.updatedAt.toISOString(),
		modules: [...course.modules]
			.sort((a, b) => a.position - b.position)
			.map(mapModule),
	};
}

export async function listPublicCourseTeasers(): Promise<PublicCourseTeaser[]> {
	const courses = await prisma.course.findMany({
		where: { status: 'PUBLISHED' },
		orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
		select: {
			id: true,
			slug: true,
			title: true,
			summary: true,
			thumbnailUrl: true,
			publishedAt: true,
		},
	});
	return courses.map((c) => ({
		id: c.id,
		slug: c.slug,
		title: c.title,
		summary: c.summary,
		thumbnailUrl: c.thumbnailUrl,
		publishedAt: toIso(c.publishedAt),
	}));
}

export async function listCourses(): Promise<CourseListItem[]> {
	const courses = await prisma.course.findMany({
		orderBy: { updatedAt: 'desc' },
		include: {
			_count: {
				select: {
					modules: true,
					enrollments: { where: { status: 'ACTIVE' } },
				},
			},
			modules: {
				select: {
					_count: { select: { lessons: true } },
				},
			},
		},
	});

	return courses.map((c) => ({
		id: c.id,
		slug: c.slug,
		title: c.title,
		summary: c.summary,
		thumbnailUrl: c.thumbnailUrl,
		status: c.status,
		publishedAt: toIso(c.publishedAt),
		updatedAt: c.updatedAt.toISOString(),
		moduleCount: c._count.modules,
		lessonCount: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
		enrollmentCount: c._count.enrollments,
	}));
}

export async function findCourseById(id: string) {
	return prisma.course.findUnique({
		where: { id },
		include: {
			modules: {
				include: { lessons: true },
				orderBy: { position: 'asc' },
			},
		},
	});
}

export async function findCourseBySlug(slug: string) {
	return prisma.course.findUnique({
		where: { slug },
		include: {
			modules: {
				include: { lessons: true },
				orderBy: { position: 'asc' },
			},
		},
	});
}

export async function createCourse(data: {
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
}) {
	return prisma.course.create({ data });
}

export async function updateCourse(
	id: string,
	data: {
		title?: string;
		slug?: string;
		summary?: string;
		description?: string;
		thumbnailUrl?: string | null;
		status?: PublishStatus;
		publishedAt?: Date | null;
	},
) {
	return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(id: string) {
	return prisma.course.delete({ where: { id } });
}

export async function slugExists(slug: string, excludeId?: string) {
	const existing = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
	if (!existing) return false;
	return excludeId ? existing.id !== excludeId : true;
}

export async function createModule(data: {
	courseId: string;
	title: string;
	description: string;
	position: number;
}) {
	return prisma.courseModule.create({ data });
}

export async function updateModule(
	id: string,
	data: { title?: string; description?: string },
) {
	return prisma.courseModule.update({ where: { id }, data });
}

export async function deleteModule(id: string) {
	return prisma.courseModule.delete({ where: { id } });
}

export async function findModuleById(id: string) {
	return prisma.courseModule.findUnique({
		where: { id },
		include: { lessons: true, course: true },
	});
}

export async function nextModulePosition(courseId: string) {
	const last = await prisma.courseModule.findFirst({
		where: { courseId },
		orderBy: { position: 'desc' },
		select: { position: true },
	});
	return (last?.position ?? -1) + 1;
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
	await prisma.$transaction(
		orderedIds.map((id, index) =>
			prisma.courseModule.updateMany({
				where: { id, courseId },
				data: { position: index },
			}),
		),
	);
}

export async function createLesson(data: {
	moduleId: string;
	slug: string;
	title: string;
	contentHtml: string;
	videoUrl: string | null;
	position: number;
}) {
	return prisma.lesson.create({ data });
}

export async function updateLesson(
	id: string,
	data: {
		title?: string;
		slug?: string;
		contentHtml?: string;
		videoUrl?: string | null;
		status?: PublishStatus;
	},
) {
	return prisma.lesson.update({ where: { id }, data });
}

export async function deleteLesson(id: string) {
	return prisma.lesson.delete({ where: { id } });
}

export async function findLessonById(id: string) {
	return prisma.lesson.findUnique({
		where: { id },
		include: {
			module: { include: { course: true } },
			attachments: true,
		},
	});
}

export async function nextLessonPosition(moduleId: string) {
	const last = await prisma.lesson.findFirst({
		where: { moduleId },
		orderBy: { position: 'desc' },
		select: { position: true },
	});
	return (last?.position ?? -1) + 1;
}

export async function lessonSlugExists(moduleId: string, slug: string, excludeId?: string) {
	const existing = await prisma.lesson.findUnique({
		where: { moduleId_slug: { moduleId, slug } },
		select: { id: true },
	});
	if (!existing) return false;
	return excludeId ? existing.id !== excludeId : true;
}

export async function reorderLessons(moduleId: string, orderedIds: string[]) {
	await prisma.$transaction(
		orderedIds.map((id, index) =>
			prisma.lesson.updateMany({
				where: { id, moduleId },
				data: { position: index },
			}),
		),
	);
}
