import type { EnrollmentStatus, PublishStatus } from '@prisma/client';

export type { EnrollmentStatus, PublishStatus };

/** Safe public teaser — no lesson content, no enrollment data. */
export interface PublicCourseTeaser {
	id: string;
	slug: string;
	title: string;
	summary: string;
	thumbnailUrl: string | null;
	publishedAt: string | null;
}

export interface CourseListItem {
	id: string;
	slug: string;
	title: string;
	summary: string;
	thumbnailUrl: string | null;
	status: PublishStatus;
	publishedAt: string | null;
	updatedAt: string;
	moduleCount: number;
	lessonCount: number;
	enrollmentCount: number;
}

export interface LessonDTO {
	id: string;
	moduleId: string;
	slug: string;
	title: string;
	contentHtml: string;
	videoUrl: string | null;
	position: number;
	status: PublishStatus;
	updatedAt: string;
}

export interface ModuleDTO {
	id: string;
	courseId: string;
	title: string;
	description: string;
	position: number;
	lessons: LessonDTO[];
}

export interface CourseDetail {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	status: PublishStatus;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	modules: ModuleDTO[];
}

export interface EnrollmentDTO {
	id: string;
	courseId: string;
	userId: string;
	status: EnrollmentStatus;
	enrolledAt: string;
	revokedAt: string | null;
	courseTitle?: string;
	courseSlug?: string;
}

/** Admin-facing enrollment DTO — includes hydrated user object (batch-fetched, no N+1). */
export interface EnrollmentAdminDTO extends EnrollmentDTO {
	user: { id: string; name: string; email: string; image: string | null } | null;
}
