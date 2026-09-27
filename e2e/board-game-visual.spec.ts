import { expect, test } from '@playwright/test';

const gamePaths = [
	'/my-space/board-game/spy-fall',
	'/my-space/board-game/ma-soi',
	'/my-space/board-game/cheese-thief',
	'/my-space/board-game/spy-fall/guide',
] as const;

test('board game gallery loads both covers and links to each game', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/my-space/board-game');
	for (const slug of ['spy-fall', 'ma-soi', 'cheese-thief']) {
		const card = page.locator(`a[href="/my-space/board-game/${slug}"]`);
		await card.scrollIntoViewIfNeeded();
		const cover = card.locator('img');
		await expect
			.poll(() =>
				cover.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
			)
			.toBe(true);
		await expect(card).toBeVisible();
	}
	await expect(page.getByRole('heading', { name: 'Chơi cùng nhau' })).toBeVisible();
});

test('game artwork loads and game pages fit small screens', async ({ page }) => {
	for (const width of [320, 390, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		for (const path of gamePaths) {
			await page.goto(path);
			const artwork = page.locator('.game-theme-hero img.game-theme-hero-image');
			await expect(artwork).toBeVisible();
			await expect
				.poll(
					() =>
						artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
					{ timeout: 15_000, message: `${path} artwork did not load at ${width}px` },
				)
				.toBe(true);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
				),
				`${path} overflows at ${width}px`,
			).toBe(true);
		}
	}
});

test('Spy Fall menu, guide and language controls remain usable', async ({ page }) => {
	await page.goto('/my-space/board-game/spy-fall');
	await page.getByRole('textbox', { name: 'Tên đặc vụ' }).fill('Lan');
	await page.getByRole('button', { name: 'Tạo phòng' }).click();
	await expect(page.getByRole('textbox', { name: 'Tên phòng' })).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('button', { name: 'Tham gia bằng mã' }).click();
	await expect(page.getByRole('textbox', { name: 'Mã nhiệm vụ' })).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('link', { name: 'Hướng dẫn chơi' }).click();
	await expect(page.getByRole('heading', { name: 'Luật danh dự' })).toBeVisible();
	await page.getByRole('button', { name: 'Chuyển sang English' }).click();
	await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
	await page.getByRole('link', { name: 'Back' }).click();
	await expect(page.getByText('No account needed')).toBeVisible();
});

test('Spy Fall room entry keeps its artwork and a route back to the menu', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/my-space/board-game/spy-fall/room/ABCDEF');
	await expect(page.getByRole('heading', { name: 'Phòng ABCDEF' })).toBeVisible();
	const artwork = page.locator('.game-theme-hero img.game-theme-hero-image');
	await expect
		.poll(() =>
			artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
		)
		.toBe(true);
	await page.getByRole('button', { name: 'Quay lại menu' }).click();
	await expect(page).toHaveURL(/\/my-space\/board-game\/spy-fall$/);
});

test('Cheese Thief menu keeps create, join, and translation', async ({ page }) => {
	await page.goto('/my-space/board-game/cheese-thief');
	await page.getByRole('textbox', { name: 'Tên của bạn' }).fill('Khánh');
	await page.getByRole('button', { name: 'Tạo phòng' }).click();
	await expect(page.getByRole('textbox', { name: 'Tên phòng' })).toBeVisible();
	await expect(page.getByText('Có Scapegoat')).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('button', { name: 'Vào bằng mã' }).click();
	await expect(page.getByRole('textbox', { name: 'Mã phòng' })).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('button', { name: 'Chuyển sang English' }).click();
	await expect(page.getByRole('heading', { name: 'Cheese Thief' })).toBeVisible();
	await expect(page.getByText('Late supper')).toBeVisible();
});

test('Ma Sói create and join forms keep their navigation and translation', async ({ page }) => {
	await page.goto('/my-space/board-game/ma-soi');
	await page.getByRole('button', { name: 'Tạo phòng' }).click();
	await expect(page.getByRole('textbox', { name: 'Tên quản trò' })).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('button', { name: 'Vào phòng' }).click();
	await expect(page.getByRole('textbox', { name: 'Mã phòng' })).toBeVisible();
	await page.getByRole('button', { name: 'Quay lại' }).click();
	await page.getByRole('button', { name: 'Chuyển sang English' }).click();
	await expect(page.getByText('A secret night')).toBeVisible();
	await expect(page.getByText('5–20 players')).toBeVisible();
});
