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
		await expect(page.getByTestId('myspace-tile-board-game')).toBeVisible();
		await expect(page.getByTestId('gate-item-about')).toBeVisible();
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

	test('the board-game tile names the new address without overflowing a phone', async ({
		page,
	}) => {
		await page.goto('/my-space');
		await expect(page.getByTestId('myspace-note-board-game')).toHaveText(
			'Đã chuyển vĩnh viễn sang fun.toiladuykhanh.com',
		);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);
	});
});
