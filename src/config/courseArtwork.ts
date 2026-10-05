/** Editorial covers are assigned explicitly to stable course slugs. */
export type CourseArtworkKey = 'ai' | 'business' | 'growth' | 'project';

export const COURSE_ARTWORK_BY_SLUG: Readonly<Record<string, CourseArtworkKey>> = {
	// Slugs used by the existing Learn seed scripts.
	hrm: 'growth',
	itm: 'business',
};

export const DEFAULT_COURSE_ARTWORK: CourseArtworkKey = 'growth';

/** Own keys only, so a slug such as `constructor` falls back instead of resolving to Object.prototype. */
export function courseArtworkKey(slug?: string): CourseArtworkKey {
	return slug && Object.hasOwn(COURSE_ARTWORK_BY_SLUG, slug)
		? COURSE_ARTWORK_BY_SLUG[slug]
		: DEFAULT_COURSE_ARTWORK;
}
