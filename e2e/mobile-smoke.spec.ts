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
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
				),
			).toBe(true);
		}
	});

	test('Cheese Thief forms stay readable and easy to tap on phones', async ({ page }) => {
		await page.goto('/my-space/board-game/cheese-thief');
		await expect(page.getByRole('heading', { level: 1, name: 'Cheese Thief' })).toBeVisible();
		await expect
			.poll(() =>
				page
					.locator('.game-theme-hero img.game-theme-hero-image')
					.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
			)
			.toBe(true);

		const create = page.getByRole('button', { name: 'Tạo phòng' });
		const join = page.getByRole('button', { name: 'Vào bằng mã' });
		expect(
			await create.evaluate((button) => button.getBoundingClientRect().height),
		).toBeGreaterThanOrEqual(44);
		expect(
			await join.evaluate((button) => button.getBoundingClientRect().height),
		).toBeGreaterThanOrEqual(44);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);

		await create.click();
		await expect(page.getByText('Nhập tên để ngồi vào bàn.')).toBeVisible();
		await page.getByRole('textbox', { name: 'Tên của bạn' }).fill('Lan');
		await create.click();
		await expect(page.getByRole('textbox', { name: 'Tên phòng' })).toBeVisible();
		await expect(page.getByText('Số người')).toBeVisible();
		await expect(page.getByRole('checkbox', { name: /Có Scapegoat/ })).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);

		await page.getByRole('button', { name: 'Quay lại' }).click();
		await page.getByRole('button', { name: 'Vào bằng mã' }).click();
		await expect(page.getByRole('textbox', { name: 'Mã phòng' })).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);
	});
});
