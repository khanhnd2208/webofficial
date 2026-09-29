import { expect, test } from '@playwright/test';
import { addAdminSession, addStudentSession } from './helpers/adminSession';

// Run only against scripts/board-game-test-server.mjs (ephemeral MongoDB).
test.skip(!process.env.BOARD_GAME_ISOLATED_TEST, 'Requires an isolated board-game test server');
const base = '/my-space/board-game/test';

for (const game of ['spy-fall', 'cheese-thief', 'ma-soi']) {
	test(`${game}: real UI, mobile seat switch, reload and close`, async ({ page, context }) => {
		await addAdminSession(context);
		await page.setViewportSize({ width: 320, height: 850 });
		await page.goto(`${base}?game=${game}`);
		await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
		const controls = page.getByRole('complementary', { name: 'Phòng test với bot' });
		await expect(controls).toBeVisible();
		await controls.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
		await expect(controls.getByRole('button', { name: 'Tự chạy', exact: true })).toBeEnabled();
		const startName = game === 'ma-soi' ? /Chia bài/ : /Bắt đầu/;
		await page.getByRole('button', { name: startName }).first().click();
		await expect(controls).not.toContainText('· lobby ·');
		await expect(controls.getByRole('alert')).toHaveCount(0);
		await controls.getByRole('combobox', { name: 'Đang chơi là' }).selectOption({ label: 'Bot 1' });
		await expect(controls.getByRole('combobox')).not.toHaveValue(game === 'ma-soi' ? 'host' : 'admin');
		await expect(page.getByRole('button', { name: startName })).toHaveCount(0);
		await controls.getByRole('button', { name: 'Một bước', exact: true }).click();
		await expect(controls.getByRole('alert')).toHaveCount(0);
		await page.reload();
		await expect(controls.getByRole('combobox')).not.toHaveValue(game === 'ma-soi' ? 'host' : 'admin');
		await expect(controls.getByRole('button', { name: 'Tự chạy', exact: true })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await controls.getByRole('button', { name: 'Chuyển sang English' }).click();
		await expect(page.getByRole('complementary').getByRole('button', { name: 'Auto play', exact: true })).toBeVisible();
		await page.setViewportSize({ width: 390, height: 844 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await page.getByRole('complementary').getByRole('button', { name: 'Close room', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Create room', exact: true })).toBeVisible();
	});
}

test('guest and non-admin cannot access the test API', async ({ request, context, page }) => {
	const guest = await request.post('/api/admin/board-game/test-rooms', { data: { game: 'spy-fall', hostName: 'Guest' } });
	expect(guest.status()).toBe(401);
	await addStudentSession(context);
	await page.goto(base);
	await expect(page).toHaveURL(/\/board-game$/);
	const nonAdmin = await context.request.post('/api/admin/board-game/test-rooms', { data: { game: 'spy-fall', hostName: 'Student' } });
	expect(nonAdmin.status()).toBe(403);
});

test('Cheese four-player UI sends the chosen hour and controls remain above the night', async ({ page, context }) => {
	await addAdminSession(context);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${base}?game=cheese-thief`);
	await page.getByRole('spinbutton').fill('4');
	await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
	const controls = page.getByRole('complementary');
	await controls.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
	await expect(controls.getByRole('button', { name: 'Tự chạy', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
	const held = page.getByRole('button', { name: 'Nhấn giữ để xem', exact: true }).first();
	await held.dispatchEvent('pointerdown');
	await held.dispatchEvent('pointerup');
	await page.getByRole('button', { name: /^[1-6]$/ }).first().click();
	await page.getByRole('button', { name: /Đã nhớ/ }).click();
	for (let i = 0; i < 3; i++) await controls.getByRole('button', { name: 'Một bước', exact: true }).click();
	await page.getByRole('button', { name: /Bắt đầu đêm/ }).click();
	await controls.getByRole('button', { name: 'Bỏ qua chờ', exact: true }).click();
	await expect(controls.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Phút bí mật', exact: true })).toBeVisible();
	await controls.getByRole('button', { name: 'Đóng phòng', exact: true }).click();
});
