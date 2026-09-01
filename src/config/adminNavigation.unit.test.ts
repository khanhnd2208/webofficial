import { describe, expect, it } from 'vitest';

import { ADMIN_NAV_GROUPS, isAdminNavActive, resolveAdminRoute } from './adminNavigation';
import { routes } from './routes';

describe('admin navigation', () => {
	it('keeps Teaching, My Class, vocabulary and messages inside /admin', () => {
		const hrefs = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
		expect(hrefs).toContain(routes.admin.teaching);
		expect(hrefs).toContain(routes.admin.myClass);
		expect(hrefs).toContain(routes.admin.vocabulary);
		expect(hrefs).toContain(routes.admin.messages);
		expect(hrefs.every((href) => href.startsWith('/admin'))).toBe(true);
	});

	it('uses Vietnamese labels instead of mixed English chrome', () => {
		const labels = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label));
		expect(labels).toContain('Từ vựng');
		expect(labels).toContain('Lớp học');
		expect(labels).toContain('Khóa học Chương–Bài');
		expect(labels).not.toContain('Vocabulary');
		expect(labels).not.toContain('Blog Manager');
	});

	it('resolves My Class to a wide workspace with local navigation', () => {
		const meta = resolveAdminRoute('/admin/my-class/courses/abc/content');
		expect(meta.width).toBe('wide');
		expect(meta.localNav?.length).toBeGreaterThan(3);
		expect(isAdminNavActive('/admin/my-class/courses', routes.admin.myClassCourses)).toBe(true);
	});

	it('resolves Teaching to a full workspace without a second sidebar', () => {
		const meta = resolveAdminRoute('/admin/teaching/class-1');
		expect(meta.width).toBe('full-workspace');
		expect(meta.localNav).toBeUndefined();
	});
});
