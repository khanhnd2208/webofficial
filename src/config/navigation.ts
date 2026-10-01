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

export type { AdminNavGroup, AdminNavItem } from './adminNavigation';
export { ADMIN_NAV_GROUPS } from './adminNavigation';

/**
 * Mục lục gate — introduction and experiences. Locked items stay visible but inert.
 */
export const GATE_NAV_ITEMS: GateNavItem[] = [
	{
		id: 'about',
		href: routes.about,
		label: 'Giới thiệu',
		status: 'published',
		blurb: 'Học quản trị và tìm cố vấn.',
	},
	{
		id: 'experiences',
		href: routes.experiences,
		label: 'Trải nghiệm',
		status: 'published',
		blurb: 'Dự án, chuyến đi và những câu chuyện.',
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
		id: 'notes',
		href: routes.notes,
		label: 'Ghi chép',
		status: 'draft',
		desktop: true,
		mobile: true,
	},
	{
		id: 'experiences',
		href: routes.experiences,
		label: 'Trải nghiệm',
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
			{ href: routes.contact, label: 'Liên hệ', status: 'published' },
			{ href: routes.experiences, label: 'Trải nghiệm', status: 'published' },
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
	'/my-space/my-class',
	'/my-space/teaching',
	'/my-space/courses',
	'/khoa-hoc',
	'/my-space/board-game',
] as const;

export function isInternalChromePath(pathname: string): boolean {
	return INTERNAL_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Pages that send a signed-out visitor to the login page. */
const SIGN_IN_REQUIRED_PREFIXES = [
	'/admin',
	'/tai-khoan',
	'/my-space/teaching',
	'/my-space/courses',
	'/khoa-hoc',
	routes.boardGameTest,
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Where "Đăng xuất" lands: the same page when it stays readable signed out, otherwise Mục lục so
 * nobody is bounced straight into the login page they just left.
 */
export function afterSignOutPath(location: string): string {
	return isSignInRequiredPath(location) ? routes.toc : location;
}

/** True when a signed-out visitor opening this path would be sent to the login page. */
export function isSignInRequiredPath(location: string): boolean {
	const pathname = location.split(/[?#]/)[0] || routes.home;
	return SIGN_IN_REQUIRED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
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

/** Active Recall — public operating surface nested under /my-space. */
export function isActiveRecallPath(pathname: string): boolean {
	return pathname === routes.activeRecall || pathname.startsWith(`${routes.activeRecall}/`);
}

/** My Space hub and nested personal surfaces (tests, …). */
export function isMySpacePath(pathname: string): boolean {
	return pathname === routes.mySpace || pathname.startsWith(`${routes.mySpace}/`);
}

/** My Space hub only — not nested test pages. */
export function isMySpaceHubPath(pathname: string): boolean {
	return pathname === routes.mySpace;
}

/** Quiz play surface — owns its own back chrome; hide site GateBack chip. */
export function isMySpaceQuizPlayPath(pathname: string): boolean {
	return /^\/my-space\/tests\/[^/]+\/play\/?$/.test(pathname);
}

/** Public teaching class board — owns its own chrome. */
export function isLopPath(pathname: string): boolean {
	return pathname === '/lop' || pathname.startsWith('/lop/');
}

/** Full-bleed public shells (intro + mục lục + My Space + class board) — no GateBack top inset. */
export function isFullBleedPublicPath(pathname: string): boolean {
	return (
		isIntroPath(pathname) || isTocPath(pathname) || isMySpacePath(pathname) || isLopPath(pathname)
	);
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

/** @deprecated Use PUBLIC_NAV_LINKS / getDesktopNavLinks() */
export const NAV_LINKS = PUBLIC_NAV_LINKS;
