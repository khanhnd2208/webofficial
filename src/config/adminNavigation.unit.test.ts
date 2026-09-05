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
	it('limits the main sidebar to Website and Active Recall', () => {
		const hrefs = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
		const labels = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label));
		expect(hrefs).toEqual([
			routes.admin.website,
			routes.admin.activeRecall,
		]);
		expect(labels).toEqual(['Website', 'Active Recall']);
		expect(hrefs).not.toContain(routes.admin.myClass);
		expect(hrefs).not.toContain(routes.admin.posts);
		expect(hrefs).not.toContain(routes.admin.users);
		expect(hrefs).not.toContain(routes.admin.teaching);
		expect(hrefs.every((href) => href.startsWith('/admin'))).toBe(true);
	});

	it('keeps paused modules in the archive sidebar instead of the main menu', () => {
		const hrefs = ARCHIVE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
		expect(hrefs).toContain(routes.admin.posts);
		expect(hrefs).toContain(routes.admin.myClass);
		expect(hrefs).toContain(routes.admin.courses);
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

	it('marks Website active on the contact inbox', () => {
		expect(isAdminNavActive(routes.admin.website, routes.admin.website)).toBe(true);
		expect(isAdminNavActive(routes.admin.inquiries, routes.admin.website)).toBe(true);
		expect(isAdminNavActive(`${routes.admin.inquiries}/abc`, routes.admin.website)).toBe(true);
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
