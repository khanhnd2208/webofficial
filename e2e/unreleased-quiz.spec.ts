import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('UNRELEASED closure', () => {
	test('quiz, gift, and thank-you pages show the farewell notice', async ({ page }) => {
		for (const path of ['/unreleased', '/unreleasedgift', '/unreleasedgift/thank-you']) {
			await page.goto(path);
			await expect(
				page.getByRole('heading', { name: 'Hẹn gặp mọi người ở event lần sau nhé!' }),
			).toBeVisible();
			await expect(page.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
			await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
				'content',
				'noindex, nofollow',
			);
		}
	});

	test('public quiz and gift APIs stop accepting requests', async ({ request }) => {
		const endpoints = [
			'/api/unreleased-quiz/responses',
			'/api/unreleased-quiz/responses/00000000-0000-0000-0000-000000000000/register',
			'/api/unreleased-gift/responses',
		];
		for (const path of endpoints) {
			const response = await request.post(path, { data: {} });
			expect(response.status()).toBe(410);
			expect(await response.json()).toMatchObject({
				ok: false,
				error: 'Hẹn gặp mọi người ở event lần sau nhé!',
			});
		}
		const download = await request.get('/api/unreleased-gift/download');
		expect(download.status()).toBe(410);
	});

	test('the existing quiz report remains available to admins', async ({ browser }) => {
		const adminContext = await browser.newContext();
		await addAdminSession(adminContext);
		const admin = await adminContext.newPage();
		await admin.goto('/admin/unreleased-quiz');
		await expect(admin.getByRole('heading', { name: 'Quiz UNRELEASED', level: 1 })).toBeVisible();
		await adminContext.close();
	});
});
