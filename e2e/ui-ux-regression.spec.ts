import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addAdminSession } from './helpers/adminSession';

for (const width of [375, 1440]) {
	test(`public reading surfaces remain legible at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		for (const [name, path, heading] of [
			['toc', '/muc-luc', 'Bạn muốn ghé đâu?'],
			['discovery', '/kham-pha-khoa-hoc', 'Một điều mới bắt đầu từ đây.'],
		]) {
			await page.goto(path);
			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
			const intro = page
				.getByText(
					name === 'toc'
						? 'Một chút về tôi. Một không gian để học và chơi.'
						: 'Xem chương trình trước, chọn điều bạn muốn học. Bạn chỉ cần đăng nhập khi bắt đầu.',
					{ exact: true },
				)
				.filter({ visible: true });
			// Mục lục sets its lead in --type-subhead (public design tokens, #22).
			await expect(intro).toHaveCSS('font-size', name === 'toc' ? '15px' : '17px');
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true,
			);
			if (process.env.UI_UX_SCREENSHOT_DIR) {
				await mkdir(process.env.UI_UX_SCREENSHOT_DIR, { recursive: true });
				await page.screenshot({
					path: join(process.env.UI_UX_SCREENSHOT_DIR, `${name}-${width}.jpg`),
					fullPage: true,
				});
			}
		}
	});

	test(`admin course controls keep their original density at ${width}px`, async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/admin/my-class/courses');
		await expect(page.getByRole('columnheader', { name: 'Khóa học', exact: true })).toBeVisible();
		const create = page.getByRole('link', { name: 'Tạo khóa học', exact: true });
		await expect(create).toBeVisible();
		if (process.env.UI_UX_SCREENSHOT_DIR) {
			await mkdir(process.env.UI_UX_SCREENSHOT_DIR, { recursive: true });
			await page.screenshot({
				path: join(process.env.UI_UX_SCREENSHOT_DIR, `admin-courses-${width}.jpg`),
				fullPage: true,
			});
		}
		await expect(create).toHaveCSS('font-size', '14px');
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true,
		);
	});
}
