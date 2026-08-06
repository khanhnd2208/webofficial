/**
 * Navigation configuration — single source of truth for public chrome.
 *
 * Public marketing: intro cover (`/`) → mục lục gate (`/muc-luc` via
 * `GATE_NAV_ITEMS`) plus a fixed contact rail on destinations. Classic
 * header/footer stay in this file for gradual migration and tests, but are
 * no longer mounted on marketing surfaces. Ghi chép visibility is gated by
 * published note count at runtime.
 */

import { areNotesPublic } from '@/content/notes';
import { SITE_NAME } from './site';
import { routes } from './routes';

export type PublishState = 'draft' | 'published';

/** Gate item readiness — locked items render but do not navigate. */
export type GateItemStatus = 'published' | 'locked';

export interface NavLink {
	href: string;
	label: string;
}

export interface GateNavItem {
	id: string;
	label: string;
	status: GateItemStatus;
	/** Present when status is published */
	href?: string;
	/** Soft teaser shown on hover — personal brand, not sales copy */
	blurb?: string;
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
 * Mục lục gate — four centered destinations. Locked items stay visible but inert.
 */
export const GATE_NAV_ITEMS: GateNavItem[] = [
	{
		id: 'about',
		label: 'Giới thiệu',
		status: 'locked',
		blurb: 'Con đường đến với lớp học',
	},
	{
		id: 'projects',
		label: 'Dự án',
		status: 'locked',
		blurb: 'Lớp học, chương trình và thử nghiệm',
	},
	{
		id: 'services',
		label: 'Dịch vụ',
		status: 'locked',
		blurb: 'Ba hướng làm việc cùng tôi',
	},
	{
		id: 'my-space',
		href: routes.mySpace,
		label: 'My Space',
		status: 'published',
		blurb: 'Không gian cá nhân và những thử nghiệm',
	},
];

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

export function isGateItemLocked(item: GateNavItem): boolean {
	return item.status === 'locked';
}

export function getGateNavItems(): GateNavItem[] {
	return GATE_NAV_ITEMS;
}

/** Prefixes where marketing chrome (gate back, contact rail) must not appear. */
export const INTERNAL_CHROME_PREFIXES = [
	'/admin',
	'/m/',
	'/messages',
	'/vocabulary',
	'/tai-khoan',
	'/dang-nhap',
	'/hoc/',
] as const;

export function isInternalChromePath(pathname: string): boolean {
	return INTERNAL_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Public marketing / utility surfaces that use minimal chrome instead of Navbar. */
export function isMinimalChromePath(pathname: string): boolean {
	return !isInternalChromePath(pathname);
}

/** Intro cover — no gate-back, no contact chrome. */
export function isIntroPath(pathname: string): boolean {
	return pathname === routes.home;
}

/** Mục lục destination menu. */
export function isTocPath(pathname: string): boolean {
	return pathname === routes.toc;
}

/** My Space hub and nested personal surfaces (tests, …). */
export function isMySpacePath(pathname: string): boolean {
	return pathname === routes.mySpace || pathname.startsWith(`${routes.mySpace}/`);
}

/** My Space hub only (2×2 grid) — not nested test pages. */
export function isMySpaceHubPath(pathname: string): boolean {
	return pathname === routes.mySpace;
}

/** Quiz play surface — owns its own back chrome; hide site GateBack chip. */
export function isMySpaceQuizPlayPath(pathname: string): boolean {
	return /^\/my-space\/tests\/[^/]+\/play\/?$/.test(pathname);
}

/** Full-bleed public shells (intro + mục lục + My Space) — no GateBack top inset. */
export function isFullBleedPublicPath(pathname: string): boolean {
	return isIntroPath(pathname) || isTocPath(pathname) || isMySpacePath(pathname);
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
			{ href: routes.admin.myspaceTests, label: 'My Space Tests' },
			{ href: routes.admin.myspaceSubjects, label: 'Môn học (Tests)' },
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
