/** Editorial covers are assigned explicitly to stable course slugs. */
export type CourseArtworkKey = 'ai' | 'business' | 'growth' | 'project';

export const COURSE_ARTWORK_BY_SLUG: Readonly<Record<string, CourseArtworkKey>> = {
	// Slugs used by the existing Learn seed scripts.
	hrm: 'growth',
	itm: 'business',
};

export const DEFAULT_COURSE_ARTWORK: CourseArtworkKey = 'growth';
