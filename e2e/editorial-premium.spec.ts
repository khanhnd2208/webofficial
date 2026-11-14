import { expect, test } from '@playwright/test';

const viewports = [
	{ width: 320, height: 720 },
	{ width: 390, height: 844 },
	{ width: 768, height: 900 },
	{ width: 1024, height: 900 },
	{ width: 1440, height: 900 },
];

test.describe('Editorial premium public experience', () => {
	for (const viewport of viewports) {
		test(`has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await page.goto('/');
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
			);
			expect(overflow).toBe(false);
		});
	}

	test('keeps the intro cover centered without contact chrome on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const intro = page.getByTestId('intro-home');
		await expect(intro).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await expect(page.getByTestId('site-header')).toHaveCount(0);
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
		const introBox = await intro.boundingBox();
		expect(introBox).not.toBeNull();
		expect(introBox!.x + introBox!.width / 2).toBeGreaterThan(140);
		expect(introBox!.x + introBox!.width / 2).toBeLessThan(250);
	});

	test('routes visitors from intro through My Space to Courses', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await page.locator('a[href="/muc-luc"]').last().click();
		await expect(page).toHaveURL(/\/muc-luc/);
		await expect(page.getByTestId('gate-item-about')).toHaveAttribute('href', '/lien-he');
		await expect(page.locator('[data-testid^="gate-item-"]')).toHaveCount(2);
		await page.getByTestId('gate-item-learning').click();
		await expect(page).toHaveURL(/\/khoa-hoc$/);
	});

	test('Về tôi lists collaboration as three plain lines', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/dich-vu');
		await expect(page).toHaveURL(/\/lien-he$/);
		const collaboration = page.locator('#dich-vu');
		await expect(collaboration.locator('dt')).toHaveText([
			'Đào tạo quản trị',
			'Ứng dụng AI vào công việc',
			'Học tập và tiếng Anh',
		]);
		await expect(collaboration.locator('details, button')).toHaveCount(0);
	});

	test('contact form starts empty for guests and exposes clear fields', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(page.getByRole('heading', { level: 2, name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(page.getByLabel('Tên')).toHaveValue('');
		await expect(page.getByLabel('Email')).toHaveValue('');
		await expect(page.getByLabel('Chủ đề')).toBeVisible();
		await expect(page.getByLabel('Lời nhắn', { exact: true })).toBeVisible();
		await expect(page.getByLabel(/Thời gian dự kiến/)).toHaveCount(0);
		await expect(page.getByText(/Đang kiểm tra thông tin tài khoản/i)).toHaveCount(0);
	});
});
