/**
 * Site identity & public URL — single source for metadata and share links.
 * Brand copy that needs owner approval lives in siteProfile (optional fields stay empty).
 */

export const SITE_NAME = 'HANOICAM';

/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when needed. */
export const SITE_ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
	(process.env.NODE_ENV === 'production'
		? 'https://toiladuykhanh.com'
		: 'http://localhost:3000');

export const SITE_DESCRIPTION =
	'HANOICAM — viết để hiểu sâu, dạy để cùng tiến xa.';

export function absoluteUrl(path = '/'): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${SITE_ORIGIN}${normalized}`;
}

/**
 * Public brand profile. Empty optional fields must not render in UI.
 * Do not invent contact or identity — only ship owner-approved values.
 */
export type SiteProfile = {
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
	publicName: SITE_NAME,
	role: 'Viết và giảng dạy',
	shortBio: 'Viết để hiểu sâu. Dạy để cùng tiến xa.',
	teachingThemes: ['Tư duy học tập', 'Kỹ năng học thuật', 'Phát triển bản thân'],
	audiences: ['Học viên được mời tham gia khóa học'],
	// contactEmail / socialLinks / portraitSrc: leave empty until owner provides
};
