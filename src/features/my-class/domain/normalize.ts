import { slugify } from '@/utils/slugify';

export function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}

export function normalizeSlug(value: string, fallback = 'item'): string {
	return slugify(value) || fallback;
}

export function hasHtmlContent(html: string | null | undefined): boolean {
	if (!html) return false;
	return (
		html
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.trim().length > 0
	);
}

export function htmlLevels(revision: {
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
}): Array<'FOUNDATION' | 'ACADEMIC' | 'EXPERT'> {
	const levels: Array<'FOUNDATION' | 'ACADEMIC' | 'EXPERT'> = [];
	if (hasHtmlContent(revision.foundationHtml)) levels.push('FOUNDATION');
	if (hasHtmlContent(revision.academicHtml)) levels.push('ACADEMIC');
	if (hasHtmlContent(revision.expertHtml)) levels.push('EXPERT');
	return levels;
}

export function activeCourseUserKey(courseId: string, userId: string): string {
	return `${courseId}:${userId}`;
}
