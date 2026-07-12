import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
	test('homepage loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/HANOICAM/i);
	});

	test('bai viet page loads', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page.locator('body')).toBeVisible();
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

	test('giang day page loads', async ({ page }) => {
		await page.goto('/giang-day');
		await expect(page.locator('body')).toContainText(/Giảng dạy|ghi danh/i);
	});

	test('personality test is not a public product route', async ({ page }) => {
		const res = await page.goto('/personality-test');
		expect(res?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Navigation', () => {
	test('public nav links are present on homepage', async ({ page }) => {
		await page.goto('/');
		const nav = page.locator('header nav, header');
		await expect(nav.getByRole('link', { name: 'Trang chủ' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Giảng dạy' })).toBeVisible();
		await expect(nav.getByRole('link', { name: /Vocabulary|Học Tiếng Anh/i })).toHaveCount(0);
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
	test('learner dashboard redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/hoc');
		await expect(page).toHaveURL(/dang-nhap/);
	});

	test('legacy dashboard redirects toward learner area', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/(hoc|dang-nhap)/);
	});

	test('admin redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/dang-nhap/);
	});
});
