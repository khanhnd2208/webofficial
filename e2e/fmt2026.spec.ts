import { expect, test, type APIRequestContext } from '@playwright/test';

import { createAdminRequest } from './helpers/adminSession';

const PIN = '246810';

type Overview = {
	settings: { totalSpins: number; isOpen: boolean };
	spinsUsed: number;
	prizes: { id: string; remaining: number }[];
};

async function overview(admin: APIRequestContext): Promise<Overview> {
	const response = await admin.get('/api/admin/fmt2026');
	expect(response.ok()).toBe(true);
	return (await response.json()).data as Overview;
}

test.describe('FMT 2026 booth', () => {
	// Both tests share the booth's open switch and stock, so they must not overlap.
	test.describe.configure({ mode: 'serial' });

	let admin: APIRequestContext;
	let before: Overview;

	test.beforeAll(async () => {
		admin = await createAdminRequest();
		before = await overview(admin);
		const opened = await admin.patch('/api/admin/fmt2026/settings', {
			data: { pin: PIN, isOpen: true, totalSpins: before.spinsUsed + 200 },
		});
		expect(opened.ok()).toBe(true);
	});

	test.afterAll(async () => {
		// Put the shared stock and switches back the way the run found them.
		const after = await overview(admin);
		for (let i = after.spinsUsed; i > before.spinsUsed; i -= 1) {
			await admin.post('/api/admin/fmt2026/draws/void');
		}
		await admin.patch('/api/admin/fmt2026/settings', {
			data: { isOpen: before.settings.isOpen, totalSpins: before.settings.totalSpins },
		});
		await admin.dispose();
	});

	test('strangers cannot draw without the booth PIN', async ({ request }) => {
		const response = await request.post('/api/fmt2026/draw');
		expect(response.status()).toBe(401);
		expect(await response.json()).toMatchObject({ ok: false, code: 'LOCKED' });
	});

	test('the booth unlocks with the PIN and a teacher hands out a prize', async ({ page }) => {
		await page.goto('/fmt2026');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			'content',
			'noindex, nofollow',
		);

		const pin = page.getByLabel('Ban tổ chức nhập mã PIN để mở quầy quà');
		await pin.fill('0000');
		await page.getByRole('button', { name: 'Mở quầy' }).click();
		await expect(page.getByText('Mã PIN không đúng')).toBeVisible();

		await pin.fill(PIN);
		await page.getByRole('button', { name: 'Mở quầy' }).click();
		await expect(page.getByRole('heading', { name: 'Nhận quà trở về' })).toBeVisible();
		await expect(page.getByRole('list', { name: 'Kho quà còn lại' })).toBeVisible();

		await page.getByRole('button', { name: 'Bốc quà ngay' }).click();
		await page
			.getByRole('button', { name: /^Nhận quà từ / })
			.first()
			.click();

		const reveal = page.getByRole('dialog', { name: 'Kết quả bốc quà' });
		await expect(reveal).toBeVisible({ timeout: 10_000 });
		await expect(reveal.getByRole('heading')).toBeVisible();

		expect((await overview(admin)).spinsUsed).toBe(before.spinsUsed + 1);

		await page.keyboard.press('Space');
		await expect(reveal).toBeHidden();
		await expect(page.getByRole('button', { name: 'Bốc quà ngay' })).toBeVisible();
	});
});
