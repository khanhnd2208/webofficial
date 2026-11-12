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
		await expect(page.getByTestId('gate-home').filter({ visible: true })).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: 'Bạn muốn ghé đâu?' })).toBeVisible();
		await expect(page.getByTestId('gate-item-about')).toBeVisible();
		await expect(page.getByTestId('myspace-tile-courses')).toBeVisible();
		await expect(page.getByTestId('myspace-tile-board-game')).toHaveCount(0);
		await expect(page.getByTestId('myspace-tile-experiences')).toHaveCount(0);
	});

	test('public surfaces do not overflow horizontally', async ({ page }) => {
		for (const path of ['/', '/muc-luc', '/gioi-thieu']) {
			await page.goto(path);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
				),
			).toBe(true);
		}
	});

	test('the focused table of contents stays within a phone width', async ({ page }) => {
		await page.goto('/muc-luc');
		await expect(page.locator('[data-testid^="myspace-tile-"]')).toHaveCount(1);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);
	});
});
