import type { CourseVisibility, PublishStatus } from '@prisma/client';

export type PublicCatalogCourseInput = {
	status: PublishStatus;
	visibility: CourseVisibility;
};

/** True when a course may appear in the public catalog and intro pages. */
export function isPublicCatalogCourse(course: PublicCatalogCourseInput): boolean {
	return course.status === 'PUBLISHED' && course.visibility === 'CATALOG';
}
