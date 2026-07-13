/**
 * Navigation configuration — single source of truth for public chrome.
 *
 * Desktop and mobile share the same items; presentation differs.
 * Only `published` items render in header/footer. Draft routes stay in the
 * map so later phases can flip status without inventing new link lists.
 */

import { EDITORIAL_NAME } from './site';
import { routes } from './routes';

export type PublishState = 'draft' | 'published';

export interface NavLink {
	href: string;
	label: string;
}

export interface PublicNavItem {
	id: string;
	href: string;
	label: string;
	/** Short label for dense chrome when needed */
	shortLabel?: string;
	status: PublishState;
	/** Show in desktop header primary row */
	desktop: boolean;
	/** Show in mobile primary list */
	mobile: boolean;
	/** Mobile “Khám phá” group (Journal + Lab) */
	mobileExplore?: boolean;
}

export interface ContactCta {
	href: string;
	label: string;
	shortLabel: string;
	status: PublishState;
}

export interface FooterLink {
	href: string;
	label: string;
	status: PublishState;
}

export interface FooterGroup {
	id: string;
	title: string;
	links: FooterLink[];
}

export interface AdminNavItem {
	href: string;
	label: string;
	exact?: boolean;
}

export interface AdminNavGroup {
	group: string;
	items: AdminNavItem[];
}

/**
 * Full public IA. Flip `status` to `published` only when the route has real
 * content and passes the publication gate.
 */
export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
	{
		id: 'accompany',
		href: routes.accompany,
		label: 'Đồng hành',
		status: 'published',
		desktop: true,
		mobile: true,
	},
	{
		id: 'learn',
		href: routes.learn,
		label: 'Học',
		status: 'draft',
		desktop: true,
		mobile: true,
	},
	{
		id: 'journal',
		href: routes.posts,
		label: EDITORIAL_NAME,
		shortLabel: EDITORIAL_NAME,
		status: 'published',
		desktop: true,
		mobile: true,
		mobileExplore: true,
	},
	{
		id: 'lab',
		href: routes.lab,
		label: 'Góc của Khánh',
		status: 'published',
		desktop: true,
		mobile: true,
		mobileExplore: true,
	},
	{
		id: 'about',
		href: routes.about,
		label: 'Về Khánh',
		status: 'published',
		desktop: true,
		mobile: true,
	},
];

/** Contact CTA — separate from nav links so it never competes with login. */
export const CONTACT_CTA: ContactCta = {
	href: routes.contact,
	label: 'Trao đổi cùng Khánh',
	shortLabel: 'Trao đổi',
	status: 'published',
};

export const FOOTER_GROUPS: FooterGroup[] = [
	{
		id: 'brand',
		title: 'Duy Khánh',
		links: [
			{ href: routes.home, label: 'Trang chủ', status: 'published' },
			{ href: routes.about, label: 'Về Khánh', status: 'published' },
			{ href: routes.contact, label: 'Liên hệ', status: 'published' },
		],
	},
	{
		id: 'accompany',
		title: 'Đồng hành',
		links: [
			{ href: routes.accompany, label: 'Tổng quan', status: 'published' },
			{ href: routes.mentoring, label: 'Mentoring', status: 'published' },
			{ href: routes.businessAdvisory, label: 'Cố vấn doanh nghiệp', status: 'published' },
			{ href: routes.trainingWorkshop, label: 'Đào tạo & workshop', status: 'published' },
			{ href: routes.aiApplied, label: 'AI ứng dụng', status: 'published' },
		],
	},
	{
		id: 'explore',
		title: 'Khám phá',
		links: [
			{ href: routes.posts, label: `${EDITORIAL_NAME} Journal`, status: 'published' },
			{ href: routes.lab, label: 'Góc của Khánh', status: 'published' },
			{ href: routes.caseStudies, label: 'Case study', status: 'published' },
			{ href: routes.learn, label: 'Học cùng Khánh', status: 'draft' },
		],
	},
	{
		id: 'system',
		title: 'Hệ thống',
		links: [
			{ href: routes.login, label: 'Đăng nhập', status: 'published' },
			{ href: routes.policyPrivacy, label: 'Bảo mật', status: 'published' },
			{ href: routes.policyTerms, label: 'Điều khoản', status: 'published' },
			{ href: routes.policyCancellation, label: 'Hủy & đổi lịch', status: 'published' },
			{ href: routes.policyAi, label: 'Nguyên tắc AI', status: 'published' },
		],
	},
];

export function isPublished(status: PublishState): boolean {
	return status === 'published';
}

export function getDesktopNavLinks(): NavLink[] {
	return PUBLIC_NAV_ITEMS.filter((item) => item.desktop && isPublished(item.status)).map(
		({ href, label }) => ({ href, label }),
	);
}

export function getMobileNavLinks(): NavLink[] {
	return PUBLIC_NAV_ITEMS.filter(
		(item) => item.mobile && !item.mobileExplore && isPublished(item.status),
	).map(({ href, label }) => ({ href, label }));
}

export function getMobileExploreLinks(): NavLink[] {
	return PUBLIC_NAV_ITEMS.filter(
		(item) => item.mobileExplore && isPublished(item.status),
	).map(({ href, label }) => ({ href, label }));
}

export function getPublishedContactCta(): ContactCta | null {
	return isPublished(CONTACT_CTA.status) ? CONTACT_CTA : null;
}

export function getPublishedFooterGroups(): FooterGroup[] {
	return FOOTER_GROUPS.map((group) => ({
		...group,
		links: group.links.filter((link) => isPublished(link.status)),
	})).filter((group) => group.links.length > 0);
}

/** @deprecated Prefer getDesktopNavLinks() — kept for gradual migration. */
export const PUBLIC_NAV_LINKS: NavLink[] = getDesktopNavLinks();

/** Authenticated user menu */
export const USER_MENU_LINKS: NavLink[] = [
	{ href: routes.accountLearning, label: 'Khu học' },
	{ href: routes.account, label: 'Tài khoản' },
];

/** Admin sidebar — grouped information architecture */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
	{
		group: 'Nội dung',
		items: [
			{ href: routes.admin.posts, label: 'Bài viết' },
			{ href: routes.admin.postCreate, label: 'Tạo bài viết' },
		],
	},
	{
		group: 'Giảng dạy',
		items: [
			{ href: routes.admin.courses, label: 'Khóa học' },
			{ href: routes.admin.enrollments, label: 'Học viên và ghi danh' },
		],
	},
	{
		group: 'Công cụ',
		items: [
			{ href: routes.admin.vocabulary, label: 'Vocabulary' },
			{ href: routes.admin.luckyCard, label: 'Lucky Card' },
			{ href: routes.admin.messages, label: 'Lời nhắn' },
		],
	},
	{
		group: 'Hệ thống',
		items: [
			{ href: routes.admin.inquiries, label: 'Inquiry' },
			{ href: routes.admin.users, label: 'Người dùng' },
			// Media & Settings hidden until real functionality ships
		],
	},
];

/** @deprecated Use PUBLIC_NAV_LINKS / getDesktopNavLinks() */
export const NAV_LINKS = PUBLIC_NAV_LINKS;
