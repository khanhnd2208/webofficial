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
		await expect(controls.getByRole('combobox')).not.toHaveValue(
			game === 'ma-soi' ? 'host' : 'admin',
		);
		await expect(page.getByRole('button', { name: startName })).toHaveCount(0);
		await controls.getByRole('button', { name: 'Một bước', exact: true }).click();
		await expect(controls.getByRole('alert')).toHaveCount(0);
		await page.reload();
		await expect(controls.getByRole('combobox')).not.toHaveValue(
			game === 'ma-soi' ? 'host' : 'admin',
		);
		await expect(controls.getByRole('button', { name: 'Tự chạy', exact: true })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true,
		);
		await controls.getByRole('button', { name: 'Chuyển sang English' }).click();
		await expect(
			page.getByRole('complementary').getByRole('button', { name: 'Auto play', exact: true }),
		).toBeVisible();
		await page.setViewportSize({ width: 390, height: 844 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true,
		);
		await page
			.getByRole('complementary')
			.getByRole('button', { name: 'Close room', exact: true })
			.click();
		await expect(page.getByRole('button', { name: 'Create room', exact: true })).toBeVisible();
	});
}

test('guest and non-admin cannot access the test API', async ({ request, context, page }) => {
	const guest = await request.post('/api/admin/board-game/test-rooms', {
		data: { game: 'spy-fall', hostName: 'Guest' },
	});
	expect(guest.status()).toBe(401);
	await addStudentSession(context);
	await page.goto(base);
	await expect(page).toHaveURL(/\/board-game\/test$/);
	await expect(page.getByText('Chỉ dành cho admin')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Đổi tài khoản' })).toHaveAttribute(
		'href',
		`/dang-nhap?from=${encodeURIComponent(base)}`,
	);
	const nonAdmin = await context.request.post('/api/admin/board-game/test-rooms', {
		data: { game: 'spy-fall', hostName: 'Student' },
	});
	expect(nonAdmin.status()).toBe(403);
});

test('Cheese four-player night goes straight to the secret minute', async ({ page, context }) => {
	await addAdminSession(context);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${base}?game=cheese-thief`);
	await page.getByRole('spinbutton').fill('4');
	await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
	const controls = page.getByRole('complementary');
	await controls.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
	await expect(controls.getByRole('button', { name: 'Tự chạy', exact: true })).toBeEnabled();
	await expect(page.getByText('Đã vào 4/4')).toBeVisible();
	await expect(page.getByRole('radio', { name: /Nhanh/ })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Vừa/ })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('radio', { name: /Chậm/ })).toBeVisible();
	await expect(page.getByText('Không có đồng phạm', { exact: true })).toBeVisible();
	await expect(page.getByText('Tuỳ chỉnh nâng cao')).toHaveCount(0);
	await expect(page.getByRole('switch', { name: /Scapegoat/ })).toBeDisabled();
	await expect(page.getByText('Cần ít nhất 6 người')).toBeVisible();
	const preview = page.getByRole('button', { name: 'Nghe thử một vòng' });
	await preview.click();
	await expect(preview).toBeDisabled();
	await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
	const held = page.getByRole('button', { name: 'Nhấn giữ để xem', exact: true }).first();
	await held.dispatchEvent('pointerdown');
	await held.dispatchEvent('pointerup');
	await expect(page.getByText('Giờ thức của bạn')).toBeVisible();
	await expect(
		page.getByText('Giờ thức của bạn').locator('xpath=following-sibling::p[1]'),
	).toHaveText(/^[1-6]$/);
	await expect(page.getByRole('button', { name: /^[1-6]$/ })).toHaveCount(0);
	await page.getByRole('button', { name: /Đã nhớ/ }).click();
	await expect(page.getByText('Úp máy và chờ chủ phòng bắt đầu đêm.')).toBeVisible();
	for (let i = 0; i < 3; i++)
		await controls.getByRole('button', { name: 'Một bước', exact: true }).click();
	await page.getByRole('button', { name: /Bắt đầu đêm/ }).click();
	await controls.getByRole('button', { name: 'Bỏ qua chờ', exact: true }).click();
	await expect(controls.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Phút bí mật', exact: true })).toBeVisible();
	const code = new URL(page.url()).searchParams.get('code');
	const snapshot = await context.request
		.get(`/api/admin/board-game/test-rooms/cheese-thief/${code}`)
		.then((r) => r.json());
	for (let i = 0; i < snapshot.data.state.choiceCount; i++)
		await page.getByRole('button', { name: new RegExp(`^Bot ${i + 1}$`) }).click();
	await page.getByRole('button', { name: 'Xong', exact: true }).click();
	await expect(page.getByText('Đã ghi lựa chọn. Chờ cả bàn — vẫn đổi được.')).toBeVisible();
	await controls.getByRole('button', { name: 'Đóng phòng', exact: true }).click();
});

test('Cheese lobby keeps follower tuning closed and the short guide matches the table', async ({
	page,
	context,
}) => {
	await addAdminSession(context);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${base}?game=cheese-thief`);
	await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
	const controls = page.getByRole('complementary');
	await controls.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
	await expect(page.getByText('Đã vào 6/6')).toBeVisible();
	await controls.getByRole('combobox', { name: 'Đang chơi là' }).selectOption({ label: 'Bot 1' });
	await expect(page.getByText('6/6 người · Không Scapegoat · Vừa 10s · 1 đồng phạm')).toBeVisible();
	await expect(page.getByText('1 đồng phạm · biết Thief')).toBeVisible();
	await expect(page.getByRole('radio', { name: /Nhanh/ })).toHaveCount(0);
	await page.screenshot({ path: 'test-results/cheese-guest-vi.png', fullPage: true });
	await controls.getByRole('combobox', { name: 'Đang chơi là' }).selectOption({ label: 'Admin' });
	await expect(page.getByRole('switch', { name: /Scapegoat/ })).toBeEnabled();
	await expect(page.getByText(/Đồng phạm: 1/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Bớt một đồng phạm' })).toHaveCount(0);
	await page.getByText('Tuỳ chỉnh nâng cao').click();
	await expect(page.getByRole('button', { name: 'Bớt một đồng phạm' })).toBeVisible();
	await page.screenshot({ path: 'test-results/cheese-lobby-vi.png', fullPage: true });
	await page.getByRole('button', { name: 'Mời Bot 1 rời bàn' }).click();
	await page.getByRole('button', { name: 'Chơi với 5 người' }).click();
	await expect(page.getByText('Đã vào 5/5')).toBeVisible();
	await expect(page.getByText('Cần ít nhất 6 người')).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'Cách chơi', exact: true }).click();
	const guide = page.getByRole('dialog', { name: 'Cách chơi Cheese Thief' });
	await expect(guide.getByRole('heading', { name: 'Nắm luật trong 1 phút' })).toBeVisible();
	await expect(guide.getByText('Mỗi người nhận 1 số từ 1 đến 6')).toBeVisible();
	await expect(guide.getByText(/hai đêm|Đêm 2/)).toHaveCount(0);
	await page.screenshot({ path: 'test-results/cheese-guide-vi.png', fullPage: true });
	await page.keyboard.press('Escape');
	await controls.getByRole('button', { name: 'Chuyển sang English' }).click();
	await expect(page.getByText('Seated 5/5')).toBeVisible();
	await expect(page.getByRole('radio', { name: /Fast/ })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Medium/ })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Slow/ })).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'How to play', exact: true }).click();
	const guideEn = page.getByRole('dialog', { name: 'How to play Cheese Thief' });
	await expect(guideEn.getByRole('heading', { name: 'The rules in one minute' })).toBeVisible();
	await expect(guideEn.getByText(/two nights|Night 2/i)).toHaveCount(0);
	await page.screenshot({ path: 'test-results/cheese-guide-en.png', fullPage: true });
	await controls.getByRole('button', { name: 'Close room', exact: true }).click();
});
