import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

test.describe('Learning Experience mobile access', () => {
	test('supports birth-date and open entry on touch-sized screens', async ({ page, context }) => {
		await addAdminSession(context);
		const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
		const slug = `e2e-mobile-learning-${suffix}`;
		const protectedName = `Mobile Protected ${suffix}`;
		const openName = `Mobile Open ${suffix}`;

		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `MOB${suffix}`.slice(0, 10),
				courseName: 'Mobile Learning Experience E2E',
				groupNo: '98',
				term: `E2E MOBILE ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;

		try {
			const publicPage = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Mobile Learning Experience E2E',
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

			for (const student of [
				{
					studentCode: `24${suffix}`.slice(-10),
					familyName: 'Mobile',
					givenName: protectedName,
					dateOfBirth: '2006-05-09',
				},
				{
					studentCode: `25${suffix}`.slice(-10),
					familyName: 'Mobile',
					givenName: openName,
					dateOfBirth: null,
				},
			]) {
				const enrolled = await page.request.post(
					`/api/admin/teaching/classes/${classId}/enrollments`,
					{ data: student },
				);
				expect(enrolled.ok(), await enrolled.text()).toBe(true);
			}

			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=learning`);
			const picker = page.getByRole('combobox', { name: 'Chọn sinh viên trong lớp' });
			await picker.fill(protectedName);
			await page.getByRole('option', { name: new RegExp(protectedName) }).tap();
			const password = page.getByLabel('Mật khẩu ngày sinh');
			await expect(password).toBeEnabled();
			await password.fill('09052006');
			await expect(page.getByRole('button', { name: 'Enter experience' })).toBeEnabled();
			await page.getByRole('button', { name: 'Enter experience' }).tap();
			await expect(
				page.getByRole('heading', { name: 'Choose your learning style' }),
			).toBeVisible();

			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=learning`);
			await page.getByRole('combobox', { name: 'Chọn sinh viên trong lớp' }).fill(openName);
			await page.getByRole('option', { name: new RegExp(openName) }).tap();
			await expect(page.getByLabel('Mật khẩu ngày sinh')).toHaveCount(0);
			await page.getByRole('button', { name: 'Vào trải nghiệm' }).tap();
			await expect(
				page.getByRole('heading', { name: 'Choose your learning style' }),
			).toBeVisible();
		} finally {
			await context.clearCookies();
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});
});
