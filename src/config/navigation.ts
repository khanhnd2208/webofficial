/**
 * Navigation configuration for the public chrome: the site header (wordmark, trail, contact
 * button, account menu) and the rules for which paths show it or require sign-in.
 *
 * The public IA is intro (`/`) → Mục lục (`/muc-luc`) with two doors, Về tôi and Học tập.
 * The doors themselves live in `src/app/muc-luc/TocDoors.tsx`.
 */

import { routes } from './routes';

export interface NavLink {
	href: string;
	label: string;
}

/** The header's contact button; leads to /lien-he (no modal). */
export const CONTACT_CTA: NavLink = {
	href: routes.contact,
	label: 'Gửi lời nhắn',
};

/** Prefixes that keep the page's own chrome and skip the route entrance animation. */
const INTERNAL_CHROME_PREFIXES = [
	'/admin',
	'/m/',
	'/messages',
	'/vocabulary',
	'/tai-khoan',
	'/dang-nhap',
	'/my-space/my-class',
	'/my-space/teaching',
	'/my-space/courses',
	'/khoa-hoc',
] as const;

export function isInternalChromePath(pathname: string): boolean {
	if (pathname === routes.learnCourses) return false;
	return INTERNAL_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Pages that send a signed-out visitor to the login page: every `redirect(...login...)` in
 * src/app. Keep in step when a page starts requiring an account.
 */
const SIGN_IN_REQUIRED_PREFIXES = [
	'/admin',
	'/messages',
	'/tai-khoan',
	'/vocabulary',
	'/my-space/teaching',
	'/my-space/courses',
	'/my-space/my-class',
	'/khoa-hoc',
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
	if (pathname === routes.learnCourses) return false;
	return SIGN_IN_REQUIRED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/** Mục lục destination menu. */
export function isTocPath(pathname: string): boolean {
	return pathname === routes.toc;
}

/** Quiz play surface — owns its own back chrome. */
function isMySpaceQuizPlayPath(pathname: string): boolean {
	return /^\/my-space\/tests\/[^/]+\/play\/?$/.test(pathname);
}

/** Public teaching class pages, including the Lớp học tab itself. */
function isLopPath(pathname: string): boolean {
	return pathname === '/lop' || pathname.startsWith('/lop/');
}

/** Authenticated user menu */
export const USER_MENU_LINKS: NavLink[] = [
	{ href: routes.myCourses, label: 'Khóa học của tôi' },
	{ href: routes.account, label: 'Tài khoản' },
];

/** Workspaces only an admin can open; listed above USER_MENU_LINKS in the account menu. */
export const ADMIN_MENU_LINKS: NavLink[] = [
	{ href: routes.mySpaceTeaching, label: 'Lớp & môn học' },
	{ href: routes.myCoursesManage, label: 'Quản lý khóa học' },
	{ href: routes.admin.home, label: 'Quản trị' },
];

export type SiteCrumb = { label: string; href?: string };

function barePath(pathname: string): string {
	return pathname.split(/[?#]/)[0] || routes.home;
}

/**
 * Breadcrumb after the "Duy Khánh" wordmark. Detail pages name their parent only,
 * because the header does not know the page title.
 */
export function getSiteTrail(pathname: string): SiteCrumb[] {
	const path = barePath(pathname);
	if (path === routes.toc) return [];
	if (path === routes.learnCourses || path === routes.classes) {
		return [{ label: 'Học tập' }];
	}
	if (path === routes.contact) return [{ label: 'Về tôi' }];
	if (path === routes.login) return [{ label: 'Đăng nhập' }];
	if (path === routes.account) return [{ label: 'Tài khoản' }];
	if (path.startsWith(`${routes.account}/`)) {
		return [{ label: 'Tài khoản', href: routes.account }];
	}
	if (path === '/chinh-sach' || path.startsWith('/chinh-sach/')) {
		return [{ label: 'Chính sách' }];
	}
	if (path === routes.activeRecall || path.startsWith(`${routes.activeRecall}/`)) {
		return [{ label: 'Ôn tập' }];
	}
	if (isMySpaceQuizPlayPath(path)) return [];
	if (path === routes.mySpaceTests || path.startsWith(`${routes.mySpaceTests}/`)) {
		return [{ label: 'Bài kiểm tra' }];
	}
	return [];
}

/**
 * Sticky public header. Absent on intro, teaching, admin, course readers, game rooms, quiz play
 * and the UNRELEASED event pages.
 */
export function isSiteHeaderPath(pathname: string): boolean {
	const path = barePath(pathname);
	if (path === routes.home) return false;
	// A class page wears its own chrome; the Lớp học tab itself (/lop) is part of Học tập.
	if (path !== routes.classes && isLopPath(path)) return false;
	if (matchesPrefix(path, routes.publicCourseRecallRoot)) return false;
	if (path.startsWith('/admin')) return false;
	if (path.startsWith('/my-space/my-class')) return false;
	if (path.startsWith('/my-space/teaching')) return false;
	if (path.startsWith('/my-space/courses')) return false;
	// The catalog alias rewrites to the public discovery page; only readers hide this header.
	if (path.startsWith(`${routes.learnCourses}/`)) return false;
	if (isMySpaceQuizPlayPath(path)) return false;
	if (path.startsWith('/messages')) return false;
	if (path.startsWith('/vocabulary')) return false;
	if (path.startsWith('/m/')) return false;
	if (path.startsWith('/progress')) return false;
	// UNRELEASED pages wear the workshop's own brand and top bar.
	if (path === routes.unreleased || path.startsWith(routes.unreleasedGift)) return false;
	// The FMT 2026 booth runs full-screen on the event laptop.
	if (matchesPrefix(path, routes.fmt2026)) return false;
	return true;
}
