import { describe, expect, it } from 'vitest';

import {
	ADMIN_NAV_GROUPS,
	ARCHIVE_NAV_GROUPS,
	getAdminNavGroupsForPath,
	isAdminNavActive,
	resolveAdminRoute,
} from './adminNavigation';
import { routes } from './routes';

describe('admin navigation', () => {
	it('groups the main sidebar by area of work', () => {
		const hrefs = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
		const labels = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label));
		expect(ADMIN_NAV_GROUPS.map((group) => group.group)).toEqual(['Website', 'Giảng dạy']);
		expect(hrefs).toEqual([
			routes.admin.inquiries,
			routes.admin.website,
			routes.mySpaceTeaching,
			routes.admin.learnAnalytics,
		]);
		expect(labels).toEqual([
			'Hộp thư liên hệ',
			'Trang công khai',
			'Lớp & môn học',
			'Thống kê học tập',
		]);
		expect(hrefs).not.toContain(routes.admin.myClass);
		expect(hrefs).not.toContain(routes.admin.posts);
		expect(hrefs).not.toContain(routes.admin.users);
		expect(hrefs).not.toContain(routes.admin.teaching);
		const outside = ADMIN_NAV_GROUPS.flatMap((group) => group.items).filter(
			(item) => !item.href.startsWith('/admin'),
		);
		expect(outside.map((item) => item.href)).toEqual([routes.mySpaceTeaching]);
		expect(outside.every((item) => item.leavesAdmin)).toBe(true);
	});

	it('keeps paused modules in the archive sidebar instead of the main menu', () => {
		const hrefs = ARCHIVE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
		expect(hrefs).toContain(routes.admin.posts);
		expect(hrefs).toContain(routes.admin.myClass);
		expect(hrefs).toContain(routes.admin.vocabulary);
		expect(hrefs).toContain(routes.admin.messages);
		expect(hrefs).not.toContain(routes.admin.teaching);
		expect(hrefs).not.toContain(routes.admin.activeRecall);
		expect(hrefs).not.toContain(routes.admin.website);
	});

	it('switches nav groups by operating shell', () => {
		expect(getAdminNavGroupsForPath(routes.admin.home)).toBe(ADMIN_NAV_GROUPS);
		expect(getAdminNavGroupsForPath(routes.admin.website)).toBe(ADMIN_NAV_GROUPS);
		expect(getAdminNavGroupsForPath(routes.admin.myClass)).toBe(ARCHIVE_NAV_GROUPS);
		expect(getAdminNavGroupsForPath(routes.admin.archive)).toBe(ARCHIVE_NAV_GROUPS);
	});

	it('marks only the inbox active on contact detail pages', () => {
		expect(isAdminNavActive(routes.admin.website, routes.admin.website)).toBe(true);
		expect(isAdminNavActive(`${routes.admin.inquiries}/abc`, routes.admin.inquiries)).toBe(true);
		expect(isAdminNavActive(routes.admin.inquiries, routes.admin.website)).toBe(false);
		expect(isAdminNavActive(`${routes.admin.inquiries}/abc`, routes.admin.website)).toBe(false);
	});

	it('does not highlight the archived tools hub on Active Recall', () => {
		expect(isAdminNavActive(routes.admin.activeRecall, routes.admin.tools)).toBe(false);
		expect(isAdminNavActive(routes.admin.tools, routes.admin.tools)).toBe(true);
		expect(isAdminNavActive(routes.admin.activeRecall, routes.admin.activeRecall)).toBe(true);
	});

	it('resolves My Class to a wide workspace with local navigation', () => {
		const meta = resolveAdminRoute('/admin/my-class/courses/abc/content');
		expect(meta.width).toBe('wide');
		expect(meta.localNav?.length).toBeGreaterThan(3);
		expect(isAdminNavActive('/admin/my-class/courses', routes.admin.myClassCourses)).toBe(true);
	});
});
