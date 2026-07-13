import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
	test('homepage loads as boutique overview', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/HANOICAM/i);
		await expect(page.getByRole('heading', { name: 'HANOICAM', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Đọc bài viết' }).first()).toBeVisible();
		await expect(page.locator('#gioi-thieu')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
	});

	test('bai viet library shows cards with media and title', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
		const cards = page.locator('main article');
		const count = await cards.count();
		if (count > 0) {
			const first = cards.first();
			await expect(first.getByRole('heading')).toBeVisible();
			await expect(first.locator('[style*="aspect-ratio"], [class*="aspect"]').first()).toBeVisible();
		}
	});

	test('blog redirects to bai-viet', async ({ page }) => {
		await page.goto('/blog');
		await expect(page).toHaveURL(/\/bai-viet/);
	});

	test('login page loads', async ({ page }) => {
		await page.goto('/dang-nhap');
		await expect(page.locator('body')).toContainText(/Google|Đăng nhập/i);
	});

	test('legacy login redirects', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveURL(/\/dang-nhap/);
	});

	test('giang day temporarily redirects home', async ({ page }) => {
		await page.goto('/giang-day');
		await expect(page).toHaveURL(/\/$/);
	});

	test('gioi thieu redirects to homepage about anchor', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/#gioi-thieu/);
	});

	test('personality test is not a public product route', async ({ page }) => {
		const res = await page.goto('/personality-test');
		expect(res?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Navigation', () => {
	test('public nav has home and posts only', async ({ page }) => {
		await page.goto('/');
		const nav = page.locator('header nav[aria-label="Chính"]');
		await expect(nav.getByRole('link', { name: 'Trang chủ' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: /Vocabulary|Học Tiếng Anh|Học tập/i })).toHaveCount(0);
	});

	test('footer omits teaching and learning', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer.getByRole('link', { name: 'Bài viết' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
		await expect(footer.getByRole('link', { name: 'Học tập' })).toHaveCount(0);
	});
});

test.describe('API health', () => {
	test('GET /api/posts returns ok envelope', async ({ request }) => {
		const res = await request.get('/api/posts');
		expect(res.ok()).toBeTruthy();
		const json = await res.json();
		expect(json.ok).toBe(true);
	});

	test('GET /api/posts/categories returns ok envelope', async ({ request }) => {
		const res = await request.get('/api/posts/categories');
		expect(res.ok()).toBeTruthy();
		const json = await res.json();
		expect(json.ok).toBe(true);
	});
	test('vocabulary store requires auth after tool isolation', async ({ request }) => {
		const res = await request.get('/api/vocab-sets/store');
		expect([401, 403]).toContain(res.status());
	});
});

test.describe('Auth redirects', () => {
	test('learner area redirects home while closed', async ({ page }) => {
		await page.goto('/hoc');
		await expect(page).toHaveURL(/\/$/);
	});

	test('learner nested routes redirect home while closed', async ({ page }) => {
		await page.goto('/hoc/khoa-hoc/example');
		await expect(page).toHaveURL(/\/$/);
	});

	test('legacy dashboard redirects home while learning is closed', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/$/);
	});

	test('admin redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/dang-nhap/);
	});
});
