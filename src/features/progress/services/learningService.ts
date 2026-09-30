import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import * as courseRepo from '@/features/courses/repositories/courseRepository';
import { enrollmentService } from '@/features/enrollments';
import * as progressRepo from '@/features/progress/repositories/progressRepository';
import { routes } from '@/config/routes';

export interface LearnerCourseCard {
	id: string;
	slug: string;
	title: string;
	summary: string;
	thumbnailUrl: string | null;
	progressPercent: number;
	completedLessons: number;
	totalLessons: number;
	nextLesson: { slug: string; title: string } | null;
	href: string;
}

export interface LearnerLessonSummary {
	id: string;
	slug: string;
	title: string;
	position: number;
	completed: boolean;
	href: string;
}

export interface LearnerModuleSummary {
	id: string;
	title: string;
	position: number;
	lessons: LearnerLessonSummary[];
}

export interface LearnerCourseDetail {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	progressPercent: number;
	completedLessons: number;
	totalLessons: number;
	nextLesson: { slug: string; title: string } | null;
	modules: LearnerModuleSummary[];
}

export interface LearnerLessonDetail {
	id: string;
	slug: string;
	title: string;
	contentHtml: string;
	videoUrl: string | null;
	completed: boolean;
	attachments: { id: string; fileName: string; mimeType: string; size: number }[];
	course: { id: string; slug: string; title: string };
	module: { id: string; title: string };
	moduleLessons: {
		slug: string;
		title: string;
		position: number;
		completed: boolean;
		href: string;
	}[];
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
}

function publishedLessons(
	course: NonNullable<Awaited<ReturnType<typeof courseRepo.findCourseBySlug>>>,
) {
	return course.modules
		.flatMap((m) =>
			[...m.lessons]
				.filter((l) => l.status === 'PUBLISHED')
				.sort((a, b) => a.position - b.position)
				.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id, modulePosition: m.position })),
		)
		.sort((a, b) => a.modulePosition - b.modulePosition || a.position - b.position);
}

export async function listLearnerCourses(userId: string): Promise<LearnerCourseCard[]> {
	const enrollments = await enrollmentService.listActiveEnrollmentsForUser(userId);
	const cards: LearnerCourseCard[] = [];

	for (const enrollment of enrollments) {
		const course = await courseRepo.findCourseById(enrollment.courseId);
		if (!course || course.status !== 'PUBLISHED') continue;

		const lessons = publishedLessons(course);
		const lessonIds = lessons.map((l) => l.id);
		const completedIds = await progressRepo.listCompletedLessonIds(userId, lessonIds);
		const completedSet = new Set(completedIds);
		const completedLessons = completedIds.length;
		const totalLessons = lessons.length;
		const progressPercent =
			totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
		const next = lessons.find((l) => !completedSet.has(l.id)) ?? null;

		cards.push({
			id: course.id,
			slug: course.slug,
			title: course.title,
			summary: course.summary,
			thumbnailUrl: course.thumbnailUrl,
			progressPercent,
			completedLessons,
			totalLessons,
			nextLesson: next ? { slug: next.slug, title: next.title } : null,
			href: routes.course(course.slug),
		});
	}

	return cards;
}

export async function getLearnerCourse(userId: string, slug: string): Promise<LearnerCourseDetail> {
	const course = await courseRepo.findCourseBySlug(slug);
	if (!course || course.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy khóa học', 404);
	}

	const allowed = await enrollmentService.hasActiveEnrollment(course.id, userId);
	if (!allowed) {
		throw new AppError('Bạn chưa được ghi danh vào khóa học này', 403);
	}

	const lessons = publishedLessons(course);
	const completedIds = new Set(
		await progressRepo.listCompletedLessonIds(
			userId,
			lessons.map((l) => l.id),
		),
	);
	const completedLessons = completedIds.size;
	const totalLessons = lessons.length;
	const progressPercent =
		totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

	const modules: LearnerModuleSummary[] = [...course.modules]
		.sort((a, b) => a.position - b.position)
		.map((mod) => ({
			id: mod.id,
			title: mod.title,
			position: mod.position,
			lessons: [...mod.lessons]
				.filter((l) => l.status === 'PUBLISHED')
				.sort((a, b) => a.position - b.position)
				.map((lesson) => ({
					id: lesson.id,
					slug: lesson.slug,
					title: lesson.title,
					position: lesson.position,
					completed: completedIds.has(lesson.id),
					href: routes.lesson(course.slug, lesson.slug),
				})),
		}))
		.filter((m) => m.lessons.length > 0);

	const next = lessons.find((l) => !completedIds.has(l.id)) ?? null;

	return {
		id: course.id,
		slug: course.slug,
		title: course.title,
		summary: course.summary,
		description: course.description,
		progressPercent,
		completedLessons,
		totalLessons,
		nextLesson: next ? { slug: next.slug, title: next.title } : null,
		modules,
	};
}

export async function getLearnerLesson(
	userId: string,
	courseSlug: string,
	lessonSlug: string,
): Promise<LearnerLessonDetail> {
	const course = await courseRepo.findCourseBySlug(courseSlug);
	if (!course || course.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy khóa học', 404);
	}

	const allowed = await enrollmentService.hasActiveEnrollment(course.id, userId);
	if (!allowed) {
		throw new AppError('Bạn chưa được ghi danh vào khóa học này', 403);
	}

	const lessons = publishedLessons(course);
	const index = lessons.findIndex((l) => l.slug === lessonSlug);
	if (index < 0) {
		throw new AppError('Không tìm thấy bài học', 404);
	}

	const lesson = lessons[index];
	const moduleSiblings = lessons.filter((l) => l.moduleId === lesson.moduleId);
	const completedIds = await progressRepo.listCompletedLessonIds(
		userId,
		moduleSiblings.map((l) => l.id),
	);
	const completedSet = new Set(completedIds);
	const prev = index > 0 ? lessons[index - 1] : null;
	const next = index < lessons.length - 1 ? lessons[index + 1] : null;

	const attachments = await prisma.lessonAttachment.findMany({
		where: { lessonId: lesson.id },
		select: { id: true, fileName: true, mimeType: true, size: true },
		orderBy: { createdAt: 'asc' },
	});

	return {
		id: lesson.id,
		slug: lesson.slug,
		title: lesson.title,
		contentHtml: lesson.contentHtml,
		videoUrl: lesson.videoUrl,
		completed: completedSet.has(lesson.id),
		attachments,
		course: { id: course.id, slug: course.slug, title: course.title },
		module: { id: lesson.moduleId, title: lesson.moduleTitle },
		moduleLessons: moduleSiblings.map((l) => ({
			slug: l.slug,
			title: l.title,
			position: l.position,
			completed: completedSet.has(l.id),
			href: routes.lesson(course.slug, l.slug),
		})),
		prev: prev ? { slug: prev.slug, title: prev.title } : null,
		next: next ? { slug: next.slug, title: next.title } : null,
	};
}

export async function completeLearnerLesson(userId: string, lessonId: string) {
	const lesson = await prisma.lesson.findUnique({
		where: { id: lessonId },
		include: {
			module: { include: { course: true } },
		},
	});
	if (!lesson || lesson.status !== 'PUBLISHED' || lesson.module.course.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy bài học', 404);
	}

	const allowed = await enrollmentService.hasActiveEnrollment(lesson.module.courseId, userId);
	if (!allowed) {
		throw new AppError('Bạn chưa được ghi danh vào khóa học này', 403);
	}

	const progress = await progressRepo.markLessonComplete(lessonId, userId);
	return {
		lessonId: progress.lessonId,
		completedAt: progress.completedAt.toISOString(),
	};
}
