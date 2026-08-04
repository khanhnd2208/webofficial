/**
 * Navigation configuration — single source of truth for public chrome.
 *
 * Desktop and mobile share the same items; presentation differs.
 * Only `published` items render in header/footer. Draft routes stay in the
 * map so later phases can flip status without inventing new link lists.
 * Ghi chép visibility is gated by published note count at runtime.
 */

import { areNotesPublic } from '@/content/notes';
import { SITE_NAME } from './site';
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
 * Primary public IA — logo handles Home; the header exposes real destinations.
 * Growth / podcast publishes only when a real episode exists.
 */
export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
	{
		id: 'about',
		href: routes.about,
		label: 'Giới thiệu',
		status: 'published',
		desktop: true,
		mobile: true,
	},
	{
		id: 'projects',
		href: routes.projects,
		label: 'Dự án',
		status: 'published',
		desktop: true,
		mobile: true,
	},
	{
		id: 'notes',
		href: routes.notes,
		label: 'Ghi chép',
		status: 'draft',
		desktop: true,
		mobile: true,
	},
	{
		id: 'services',
		href: routes.services,
		label: 'Dịch vụ',
		status: 'published',
		desktop: true,
		mobile: true,
	},
];

/** Contact CTA — separate from nav links; leads to /lien-he (no modal). */
export const CONTACT_CTA: ContactCta = {
	href: routes.contact,
	label: 'Gửi lời nhắn',
	shortLabel: 'Gửi lời nhắn',
	status: 'published',
};

export const FOOTER_GROUPS: FooterGroup[] = [
	{
		id: 'brand',
		title: SITE_NAME,
		links: [
			{ href: routes.home, label: 'Trang chủ', status: 'published' },
			{ href: routes.about, label: 'Giới thiệu', status: 'published' },
			{ href: routes.projects, label: 'Dự án', status: 'published' },
			{ href: routes.notes, label: 'Ghi chép', status: 'draft' },
			{ href: routes.services, label: 'Dịch vụ', status: 'published' },
			{ href: routes.contact, label: 'Liên hệ', status: 'published' },
		],
	},
];

export function isPublished(status: PublishState): boolean {
	return status === 'published';
}

function isNavItemVisible(item: PublicNavItem): boolean {
	if (item.id === 'notes') return areNotesPublic();
	return isPublished(item.status);
}

function isFooterLinkVisible(link: FooterLink): boolean {
	if (link.href === routes.notes) return areNotesPublic();
	return isPublished(link.status);
}

export function getDesktopNavLinks(): NavLink[] {
	return PUBLIC_NAV_ITEMS.filter((item) => item.desktop && isNavItemVisible(item)).map(
		({ href, label }) => ({ href, label }),
	);
}

export function getMobileNavLinks(): NavLink[] {
	return PUBLIC_NAV_ITEMS.filter((item) => item.mobile && isNavItemVisible(item)).map(
		({ href, label }) => ({ href, label }),
	);
}

/** @deprecated Explore group removed — primary mobile list covers all four items. */
export function getMobileExploreLinks(): NavLink[] {
	return [];
}

export function getPublishedContactCta(): ContactCta | null {
	return isPublished(CONTACT_CTA.status) ? CONTACT_CTA : null;
}

export function getPublishedFooterGroups(): FooterGroup[] {
	return FOOTER_GROUPS.map((group) => ({
		...group,
		links: group.links.filter((link) => isFooterLinkVisible(link)),
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
			{ href: routes.admin.inquiries, label: 'Yêu cầu liên hệ' },
			{ href: routes.admin.users, label: 'Người dùng' },
		],
	},
];

/** @deprecated Use PUBLIC_NAV_LINKS / getDesktopNavLinks() */
export const NAV_LINKS = PUBLIC_NAV_LINKS;
