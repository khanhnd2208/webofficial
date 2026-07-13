import type { CourseVisibility, EnrollmentStatus, PublishStatus } from '@prisma/client';

export type { CourseVisibility, EnrollmentStatus, PublishStatus };

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
	visibility: CourseVisibility;
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
	visibility: CourseVisibility;
	audience: string;
	learningOutcomes: string;
	format: string;
	durationText: string;
	prerequisites: string;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	modules: ModuleDTO[];
}

export interface PublicLessonOutline {
	id: string;
	slug: string;
	title: string;
	position: number;
}

export interface PublicModuleOutline {
	id: string;
	title: string;
	description: string;
	position: number;
	lessons: PublicLessonOutline[];
}

/** Public course intro — outline titles only, no lesson content. */
export interface PublicCourseIntro {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	publishedAt: string | null;
	audience: string;
	learningOutcomes: string;
	format: string;
	durationText: string;
	prerequisites: string;
	modules: PublicModuleOutline[];
}

export interface LessonAttachmentSummary {
	id: string;
	fileName: string;
	mimeType: string;
	size: number;
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
