import { expect, test, type APIRequestContext } from '@playwright/test';

import { addAdminSession, createAdminRequest } from './helpers/adminSession';

const PIN = '2468';

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
			data: { pin: PIN, isOpen: false, totalSpins: before.spinsUsed + 200 },
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
		const setup = await request.post('/api/fmt2026/setup', { data: {} });
		expect(setup.status()).toBe(401);
		expect(await (await request.get('/api/fmt2026/setup')).json()).toMatchObject({
			data: { mode: 'unlock' },
		});
	});

	test('the booth unlocks with the PIN and a teacher hands out a prize', async ({ page }) => {
		await page.goto('/fmt2026');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			'content',
			'noindex, nofollow',
		);

		const stage = page.frameLocator('iframe[title="Quầy quà FMT 2026"]');
		await stage.getByRole('button', { name: 'Thiết lập', exact: true }).click();
		const setup = stage.getByRole('dialog', { name: 'Thiết lập quầy' });
		const pin = setup.getByLabel('Mã PIN');
		await pin.fill('0000');
		await setup.getByRole('button', { name: 'Tiếp tục' }).click();
		await expect(setup.getByText('Mã PIN không đúng')).toBeVisible();

		await pin.fill(PIN);
		await setup.getByRole('button', { name: 'Tiếp tục' }).click();
		await expect(setup.getByRole('spinbutton', { name: 'Tổng lượt dự kiến' })).toBeVisible();
		const quantity = setup.getByRole('spinbutton').first();
		const prize = before.prizes[0]!;
		await quantity.fill(String(prize.remaining + 1));
		try {
			await setup.getByRole('button', { name: 'Bắt đầu phiên chơi' }).click();
			await expect(setup).toBeHidden();
			const started = await overview(admin);
			expect(started.settings.isOpen).toBe(true);
			expect(started.prizes[0]?.remaining).toBe(prize.remaining + 1);
			expect((await page.request.post('/api/fmt2026/setup', { data: {} })).status()).toBe(401);
		} finally {
			await admin.patch('/api/admin/fmt2026/prizes/' + prize.id, {
				data: { remaining: prize.remaining },
			});
		}
		await expect(stage.getByRole('heading', { name: 'Nhận quà trở về' })).toBeVisible();
		const stock = stage.getByRole('list', { name: 'Các phần quà' });
		await expect(stock).toBeVisible();
		await expect(stock).not.toContainText(/\d/);

		await stage.getByRole('button', { name: 'Rút quà cùng thầy' }).click();
		const shake = stage.getByRole('button', { name: 'Giữ để lắc túi quà' });
		await expect(shake).toBeFocused();
		await page.keyboard.down('Space');
		await expect(stage.locator('.stage')).toHaveAttribute('data-holding', 'true');
		// Kim quét khoảng 2,35 s mỗi vòng; nhả sau 1,2 s là đủ mạnh để tung.
		await page.waitForTimeout(1200);
		await page.keyboard.up('Space');

		const reveal = stage.locator('.reveal');
		await expect(reveal.getByRole('heading')).toBeVisible({ timeout: 20_000 });
		expect((await overview(admin)).spinsUsed).toBe(before.spinsUsed + 1);

		await reveal.getByRole('button', { name: 'Lượt tiếp theo' }).click();
		await expect(reveal).toBeHidden();
		await expect(stage.getByText('Bạn muốn rút cùng ai?')).toBeVisible();
	});

	test('admin can save the remaining quantity of a prize', async ({ page }) => {
		await addAdminSession(page.context());
		const snapshot = await overview(admin);
		const prize = snapshot.prizes[0]!;
		try {
			await page.goto('/admin/fmt2026');
			const row = page
				.getByRole('row')
				.filter({ has: page.getByRole('spinbutton') })
				.first();
			await row.getByRole('spinbutton').fill(String(prize.remaining + 1));
			await row.getByRole('button', { name: 'Lưu', exact: true }).click();
			await expect(page.getByRole('status')).toContainText('Đã lưu');
			expect((await overview(admin)).prizes[0]?.remaining).toBe(prize.remaining + 1);
		} finally {
			const restored = await admin.patch('/api/admin/fmt2026/prizes/' + prize.id, {
				data: { remaining: prize.remaining },
			});
			expect(restored.ok()).toBe(true);
		}
	});
});
