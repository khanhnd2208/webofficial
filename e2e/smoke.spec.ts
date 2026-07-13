import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
	test('homepage loads with brand and hero illustration', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Duy Khánh/i);
		await expect(page.getByRole('heading', { name: 'Duy Khánh', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Đồng hành cùng Khánh' }).first()).toBeVisible();
		await expect(page.getByRole('img', { name: /minh họa hành trình/i })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
	});

	test('about page is standalone', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await expect(page.getByRole('heading', { name: /Về Duy Khánh/i })).toBeVisible();
	});

	test('service hub and mentoring page load', async ({ page }) => {
		await page.goto('/dong-hanh');
		await expect(page.getByRole('heading', { name: 'Đồng hành cùng Khánh' })).toBeVisible();
		await page.goto('/dong-hanh/mentoring');
		await expect(page.getByRole('heading', { name: 'Mentoring cá nhân' })).toBeVisible();
		await expect(page.getByText(/Chi phí được đề xuất/i).first()).toBeVisible();
	});

	test('contact page loads', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(page.getByRole('heading', { name: 'Trao đổi cùng Khánh' })).toBeVisible();
	});

	test('lab hub loads', async ({ page }) => {
		await page.goto('/goc-cua-khanh');
		await expect(page.getByRole('heading', { name: 'Góc của Khánh' })).toBeVisible();
	});

	test('privacy policy loads', async ({ page }) => {
		await page.goto('/chinh-sach/bao-mat');
		await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
	});

	test('bai viet library shows cards with media and title', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
		await expect(page.getByText('HANOICAM Journal').first()).toBeVisible();
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

	test('login does not send users back to closed learning area', async ({ page }) => {
		await page.goto('/dang-nhap?callbackUrl=%2Fhoc%2Fkhoa-hoc%2Fexample');
		await expect(page.locator('body')).not.toContainText('khu học tập');
		await expect(page.getByRole('link', { name: '← Về trang chủ' })).toBeVisible();
	});

	test('legacy login redirects', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveURL(/\/dang-nhap/);
	});

	test('giang day permanently redirects to learning hub', async ({ page }) => {
		await page.goto('/giang-day');
		await expect(page).toHaveURL(/\/hoc/);
	});

	test('personality test is not a public product route', async ({ page }) => {
		const res = await page.goto('/personality-test');
		expect(res?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Navigation', () => {
	test('public nav shows published brand links', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		const header = page.locator('header');
		await expect(header.getByRole('link', { name: 'Duy Khánh — trang chủ' })).toBeVisible();
		const nav = page.locator('header nav[aria-label="Chính"]');
		await expect(nav.getByRole('link', { name: 'Đồng hành' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'HANOICAM' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Góc của Khánh' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Về Khánh' })).toBeVisible();
		await expect(nav.getByRole('link', { name: /Trao đổi/i })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Học', exact: true })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
	});

	test('footer shows published groups', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer.getByText('Duy Khánh').first()).toBeVisible();
		await expect(footer.getByRole('link', { name: 'HANOICAM Journal' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Liên hệ' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Bảo mật' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Giảng dạy' })).toHaveCount(0);
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
	test('learner hub is public and dashboard moved', async ({ page }) => {
		await page.goto('/hoc');
		await expect(page).toHaveURL(/\/hoc\/?$/);
		await expect(page.getByRole('heading', { name: /Học cùng Khánh|Học/i }).first()).toBeVisible();
	});

	test('legacy dashboard redirects to learner account', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/tai-khoan\/hoc/);
	});

	test('admin redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/dang-nhap/);
	});
});
