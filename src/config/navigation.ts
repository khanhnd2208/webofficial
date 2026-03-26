/**
 * Navigation configuration — single source of truth for nav links.
 *
 * Used by Navbar (desktop + mobile) and potentially breadcrumbs.
 */

export interface NavLink {
	href: string;
	label: string;
}

export const NAV_LINKS: NavLink[] = [
	{ href: '/blog', label: 'Hanoicam Story' },
	{ href: '/vocabulary', label: 'Học tiếng Anh' },
	{ href: '/personality-test', label: 'Personality Test' },
	{ href: '/feedback', label: 'Phản hồi' },
];

export const USER_MENU_LINKS: NavLink[] = [
	{ href: '/dashboard', label: 'Dashboard' },
	{ href: '/profile', label: 'Hồ sơ' },
	{ href: '/vocabulary', label: 'Từ vựng' },
];
