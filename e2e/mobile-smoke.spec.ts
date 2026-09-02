import { expect, test } from '@playwright/test';

test.describe('Mobile public smoke', () => {
	test('homepage remains usable and exposes the primary heading', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('intro-home')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Mở mục lục/i }).first()).toBeVisible();
	});

	test('table of contents keeps touch navigation available', async ({ page }) => {
		await page.goto('/muc-luc');
		await expect(page.getByTestId('gate-home')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: 'Mục lục' })).toBeVisible();
		const gate = page.getByRole('navigation', { name: 'Cổng trang' });
		await expect(gate.getByRole('link')).toHaveCount(4);
		await expect(gate.getByTestId('gate-item-locked')).toHaveCount(0);
	});

	test('public surfaces do not overflow horizontally', async ({ page }) => {
		for (const path of ['/', '/muc-luc', '/gioi-thieu']) {
			await page.goto(path);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
		}
	});
});
