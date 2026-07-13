/**
 * Navigation configuration — single source of truth for nav links.
 *
 * Public header: Trang chủ, Bài viết only (teaching/learning temporarily closed).
 */

import { routes } from './routes';

export interface NavLink {
	href: string;
	label: string;
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

/** Public header — visible to everyone */
export const PUBLIC_NAV_LINKS: NavLink[] = [
	{ href: routes.home, label: 'Trang chủ' },
	{ href: routes.posts, label: 'Bài viết' },
];

/** Authenticated user menu (learner area temporarily closed) */
export const USER_MENU_LINKS: NavLink[] = [{ href: routes.account, label: 'Tài khoản' }];

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
			{ href: routes.admin.users, label: 'Người dùng' },
			// Media & Settings hidden until real functionality ships
		],
	},
];

/** @deprecated Use PUBLIC_NAV_LINKS */
export const NAV_LINKS = PUBLIC_NAV_LINKS;
