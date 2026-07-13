/**
 * Site identity & public URL — single source for metadata, brand, and share links.
 * Brand copy that needs owner approval lives in siteProfile (optional fields stay empty).
 */

/** Master brand shown in chrome, metadata, and primary marketing. */
export const SITE_NAME = 'Duy Khánh';

/** Editorial brand for the journal (HANOICAM Journal). Not the site-wide wordmark. */
export const EDITORIAL_NAME = 'HANOICAM';

/** Personal mark / signature — not a product brand. */
export const PERSONAL_MARK = 'NDK';

export const SITE_EYEBROW = 'Giảng viên · Mentor · Cố vấn';

/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when needed. */
export const SITE_ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
	(process.env.NODE_ENV === 'production'
		? 'https://toiladuykhanh.com'
		: 'http://localhost:3000');

export const SITE_DESCRIPTION =
	'Duy Khánh — giảng viên, mentor và cố vấn. Đồng hành cùng cá nhân và tổ chức làm rõ hướng đi, học có lộ trình, và viết để hiểu sâu.';

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
		'Duy Khánh đồng hành cùng sinh viên, young professional và đội ngũ doanh nghiệp trẻ — làm rõ hướng đi, học có lộ trình, và viết để hiểu sâu.',
	portraitSrc: '/brand/hero-journey.jpg',
	// contactEmail / socialLinks: leave empty until owner provides
};

/** Brand hierarchy constants for docs and UI copy. */
export const brandHierarchy = {
	master: SITE_NAME,
	editorial: EDITORIAL_NAME,
	personalMark: PERSONAL_MARK,
	tracks: ['Đồng hành cùng Khánh', 'Học cùng Khánh', 'HANOICAM Journal', 'Góc của Khánh'] as const,
} as const;
