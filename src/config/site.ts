/**
 * Site identity & public URL — single source for metadata and share links.
 * Owner-specific contact details remain optional until explicitly approved.
 */

export const SITE_NAME = 'Duy Khánh';
export const EDITORIAL_NAME = 'HANOICAM Journal';

/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when needed. */
export const SITE_ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
	(process.env.NODE_ENV === 'production'
		? 'https://toiladuykhanh.com'
		: 'http://localhost:3000');

export const SITE_DESCRIPTION =
	'Duy Khánh — giảng viên, mentor và cố vấn về quản trị, con người, marketing và AI ứng dụng.';

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
	personalMark: 'DK',
	publicName: SITE_NAME,
	role: 'Giảng viên · Mentor · Cố vấn quản trị & AI ứng dụng',
	specialties: ['Quản trị và con người', 'Marketing và phát triển doanh nghiệp', 'AI ứng dụng'],
	shortBio:
		'Tôi giúp người trẻ và những tổ chức đang phát triển hiểu rõ vấn đề, xây tư duy có hệ thống và biến kiến thức thành hành động thực tế.',
	longBio:
		'Tôi làm việc ở giao điểm của giảng dạy, mentoring và tư vấn. Mục tiêu không phải là đưa ra thật nhiều lời khuyên, mà là giúp mỗi người hoặc tổ chức nhìn đúng vấn đề, hiểu các lựa chọn và xây được bước đi phù hợp với bối cảnh của mình.',
	teachingThemes: ['Management', 'Human Resource Management', 'Marketing', 'Communication', 'AI for Work'],
	audiences: ['Người trẻ đang phát triển sự nghiệp', 'Nhà quản lý mới', 'Founder và doanh nghiệp trẻ', 'Đội ngũ muốn ứng dụng AI'],
	learnerOutcomes: ['Hiểu đúng vấn đề', 'Tư duy có hệ thống', 'Hành động rõ ràng', 'Tự chủ sau quá trình đồng hành'],
	// contactEmail / socialLinks / portraitSrc: leave empty until owner provides
};
