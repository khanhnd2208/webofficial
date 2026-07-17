/**
 * Site identity & public URL — single source for metadata, brand, and share links.
 * Brand copy that needs owner approval lives in siteProfile (optional fields stay empty).
 */

/** Master brand shown in chrome, metadata, and primary marketing. */
export const SITE_NAME = 'Duy Khánh';

/** Public positioning line — the central idea of the personal education space. */
export const SITE_POSITIONING = 'Việc học thay đổi cách ta nhìn và cách ta làm.';

/** Editorial brand for the journal. Not the site-wide wordmark. */
export const EDITORIAL_NAME = 'HANOICAM';

/** Personal mark / signature — not a product brand. */
export const PERSONAL_MARK = 'NDK';

export const SITE_EYEBROW = 'Duy Khánh · Giảng viên';

/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when needed. */
export const SITE_ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
	(process.env.NODE_ENV === 'production' ? 'https://toiladuykhanh.com' : 'http://localhost:3000');

export const SITE_DESCRIPTION =
	'Duy Khánh giảng dạy, thiết kế chương trình học và viết về cách con người học, làm việc và trưởng thành.';

export const SITE_CREATOR = SITE_NAME;

export function absoluteUrl(path = '/'): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${SITE_ORIGIN}${normalized}`;
}

/**
 * Public brand profile. Empty optional fields must not render in UI.
 * Do not invent contact or identity — only ship owner-approved values.
 */
export type SiteProfile = {
	/** Personal mark shown beside the site brand */
	personalMark: string;
	publicName: string;
	role?: string;
	specialties?: string[];
	shortBio?: string;
	longBio?: string;
	teachingThemes?: string[];
	audiences?: string[];
	learnerOutcomes?: string[];
	contactEmail?: string;
	socialLinks?: { label: string; href: string }[];
	portraitSrc?: string;
};

export const siteProfile: SiteProfile = {
	personalMark: PERSONAL_MARK,
	publicName: SITE_NAME,
	role: SITE_EYEBROW,
	shortBio:
		'I want to make learning an experience that feels both artistic and deeply enjoyable.',
	portraitSrc: '/brand/learning-as-becoming-mobile.jpg',
	// contactEmail / socialLinks: leave empty until owner provides
};

/** Brand hierarchy constants for docs and UI copy. */
export const brandHierarchy = {
	master: SITE_NAME,
	positioning: SITE_POSITIONING,
	editorial: EDITORIAL_NAME,
	personalMark: PERSONAL_MARK,
	tracks: ['Trải nghiệm học tập', 'Bài viết', 'Podcast'] as const,
} as const;
