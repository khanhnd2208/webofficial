import { expect, test } from '@playwright/test';

import { addAdminSession, addStudentSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

/** Học tập: two tabs (Khóa học at /khoa-hoc, Lớp học at /lop) under the same site header. */
test.describe('Học tập', () => {
	test('a guest switches between the two tabs under one header', async ({ page }) => {
		await page.goto('/khoa-hoc');
		await expect(page.getByTestId('site-header')).toBeVisible();
		await expect(page.getByTestId('learning-tab-courses')).toHaveAttribute('aria-current', 'page');
		await page.getByTestId('learning-tab-classes').click();
		await expect(page).toHaveURL(/\/lop$/);
		await expect(page.getByTestId('site-header')).toBeVisible();
		await expect(page.getByTestId('learning-tab-classes')).toHaveAttribute('aria-current', 'page');
		await expect(page.getByTestId('classes-empty')).toBeVisible();
		await expect(page.getByTestId('teaching-classes')).toHaveCount(0);
		await page.getByTestId('learning-tab-courses').click();
		await expect(page).toHaveURL(/\/khoa-hoc$/);
	});

	test('a signed-in learner stays on /khoa-hoc, and the old list address lands there', async ({
		page,
		context,
	}) => {
		await addStudentSession(context);
		await page.goto('/khoa-hoc');
		await expect(page).toHaveURL(/\/khoa-hoc$/);
		await expect(page.getByTestId('learning-hub-header').filter({ visible: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Quản lý' })).toHaveCount(0);
		await page.goto('/my-space/courses');
		await expect(page).toHaveURL(/\/khoa-hoc$/);
	});

	test('an admin manages courses from the same page', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/my-space/courses?xem=quan-ly');
		await expect(page).toHaveURL(/\/khoa-hoc\?xem=quan-ly$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Quản lý khóa học' })).toBeVisible();
		await page.getByRole('link', { name: 'Học', exact: true }).click();
		await expect(page).toHaveURL(/\/khoa-hoc$/);
	});

	test('a class opened once shows up in Lớp học, and admins see their classes', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const slug = `e2e-hub-${suffix}`;
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `HUB${suffix}`.slice(0, 10),
				courseName: 'Learning hub E2E',
				groupNo: '96',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;
		try {
			const publicPage = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Learning hub E2E',
					publicSummary: '',
					publicDescription: '',
					publicAnnouncement: '',
					links: [],
				},
			});
			expect(publicPage.ok()).toBe(true);
			const shared = await page.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
				data: { shared: true },
			});
			expect(shared.ok()).toBe(true);

			await page.goto('/lop');
			const teaching = page.getByTestId('teaching-classes');
			await expect(teaching.getByRole('link', { name: 'Chấm điểm' }).first()).toBeVisible();
			await expect(
				teaching.locator(`a[href="/lop/${slug}"]`, { hasText: 'Trang sinh viên' }),
			).toHaveCount(1);

			await context.clearCookies();
			await page.goto('/lop');
			await expect(page.getByTestId('classes-empty')).toBeVisible();
			await page.goto(`/lop/${slug}`);
			await page.goto('/lop');
			const recent = page.getByTestId('recent-classes');
			await expect(recent.getByRole('link', { name: /Learning hub E2E/ })).toHaveAttribute(
				'href',
				`/lop/${slug}`,
			);
			await expect(page.getByTestId('classes-empty')).toHaveCount(0);
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('both tabs fit a 360px phone', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 780 });
		for (const path of ['/khoa-hoc', '/lop']) {
			await page.goto(path);
			await expect(page.getByTestId('learning-hub-header').filter({ visible: true })).toBeVisible();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
				path,
			).toBe(true);
		}
	});
});
