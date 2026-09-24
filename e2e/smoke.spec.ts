import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
	test('homepage is an intro cover that opens the mục lục', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Duy Khánh — Trở thành/i);
		await expect(page.getByTestId('intro-home')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await expect(page.getByText('[động từ]').locator('visible=true')).toBeVisible();
		await expect(page.getByText(/Chưa xong/i).locator('visible=true')).toBeVisible();
		await expect(page.locator('a[href="/muc-luc"]').last()).toBeVisible();
		await expect(page.getByTestId('contact-rail')).toHaveCount(0);
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
		await expect(page.getByTestId('gate-home')).toHaveCount(0);
		await expect(page.locator('header nav[aria-label="Chính"]')).toHaveCount(0);
		await expect(page.getByTestId('site-auth-chip').filter({ visible: true })).toBeVisible();
		await expect(page.getByTestId('site-auth-chip').filter({ visible: true })).toHaveAttribute(
			'href',
			'/dang-nhap?from=%2F',
		);
		await expect(
			page.getByRole('heading', { name: /Tôi làm giáo dục để tiếp tục học/i }),
		).toHaveCount(0);
		await expect(page.getByText('Learn Chinese', { exact: true })).toHaveCount(0);
		await expect(page.getByText('PODCAST', { exact: true })).toHaveCount(0);
	});

	test('mục lục opens brand destinations and My Space', async ({ page }) => {
		await page.goto('/muc-luc');
		await expect(page.getByTestId('gate-home')).toBeVisible();
		const gate = page.getByRole('navigation', { name: 'Cổng trang' });
		await expect(gate.getByRole('link')).toHaveCount(4);
		await expect(gate.getByTestId('gate-item-locked')).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Giới thiệu/i })).toHaveAttribute(
			'href',
			'/gioi-thieu',
		);
		await expect(gate.getByRole('link', { name: /Dự án/i })).toHaveAttribute('href', '/du-an');
		await expect(gate.getByRole('link', { name: /Dịch vụ/i })).toHaveAttribute('href', '/dich-vu');
		await expect(gate.getByRole('link', { name: /My Space/i })).toHaveAttribute(
			'href',
			'/my-space',
		);
		await expect(gate.getByRole('link', { name: /Active Recall/i })).toHaveCount(0);
		await expect(page.getByTestId('contact-rail')).toBeVisible();
		await expect(page.getByTestId('contact-rail')).toHaveText('Gửi lời nhắn');
		await expect(page.getByTestId('intro-back')).toBeVisible();
		await expect(page.getByTestId('site-auth-chip')).toBeVisible();
		await expect(page.locator('header nav[aria-label="Chính"]')).toHaveCount(0);
	});

	test('intro opens the mục lục without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto('/');

		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await page
			.getByRole('link', { name: /Mở mục lục/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/muc-luc/);
		await expect(page.getByTestId('gate-item-locked')).toHaveCount(0);
		await expect(page.getByRole('link', { name: /My Space/i })).toBeVisible();
		await context.close();
	});

	test('My Space hub contains Teaching and Courses', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.getByTestId('my-space')).toBeVisible();
		await expect(page.locator('[data-testid^="myspace-tile-"]')).toHaveCount(2);
		await expect(page.getByTestId('myspace-tile-teaching')).toBeVisible();
		await expect(page.getByTestId('myspace-tile-courses')).toBeVisible();
		await page.getByTestId('myspace-tile-teaching').click();
		await expect(page).toHaveURL(/\/dang-nhap|\/my-space\/teaching/);
	});

	test('intro and mục lục stay without horizontal overflow at critical widths', async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });

		for (const path of ['/', '/muc-luc', '/my-space'] as const) {
			await page.goto(path);
			for (const width of [320, 390, 768, 1024, 1440]) {
				await page.setViewportSize({ width, height: 900 });
				if (path === '/') {
					await expect(page.getByTestId('intro-home')).toBeVisible();
				} else if (path === '/muc-luc') {
					await expect(page.getByTestId('gate-home')).toBeVisible();
				} else {
					await expect(page.getByTestId('my-space')).toBeVisible();
				}
				const hasOverflow = await page.evaluate(
					() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
				);
				expect(hasOverflow).toBe(false);
			}
		}
	});

	test('about page introduces Khánh and leads to programmes', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await expect(
			page.getByRole('heading', { level: 1, name: /^Nguyễn Duy Khánh$/i }),
		).toBeVisible();
		await expect(page.getByText(/Giảng viên Quản trị · Trường Đại học Hà Nội/i)).toBeVisible();
		await expect(page.getByRole('link', { name: /Xem chương trình/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Chương trình tôi đang triển khai/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Dự án tiêu biểu/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /^Nền tảng$/i })).toBeVisible();
		await expect(page.getByText(/Hiểu đúng vấn đề trước khi tìm giải pháp/i)).toBeVisible();
		await expect(page.getByText(/My Hanoicam/i)).toHaveCount(0);
		await expect(page.getByTestId('gate-back')).toBeVisible();
		await expect(page.getByTestId('contact-rail')).toBeVisible();
	});

	test('retired service URLs redirect to the current architecture', async ({ page }) => {
		await page.goto('/dong-hanh');
		await expect(page).toHaveURL(/\/dich-vu/);
		await page.goto('/dong-hanh/mentoring');
		await expect(page).toHaveURL(/\/dich-vu/);
		await page.goto('/case-study');
		await expect(page).toHaveURL(/\/du-an/);
		await page.goto('/du-an/moonie-cafe-business-development');
		await expect(page).toHaveURL(/\/du-an\/learning-at-moonie-cafe/);
	});

	test('lab and public learn hubs redirect home', async ({ page }) => {
		await page.goto('/goc-cua-khanh');
		await expect(page).toHaveURL(/\/du-an/);
		await page.goto('/hoc');
		await expect(page).toHaveURL(/\/$/);
		await page.goto('/archive');
		await expect(page).toHaveURL(/\/$/);
	});

	test('contact page offers a quiet single message flow', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { level: 1, name: /Gửi tôi một lời nhắn/i }),
		).toBeVisible();
		const typeSelect = page.getByLabel('Bạn muốn trao đổi về điều gì?');
		await expect(typeSelect).toBeVisible();
		await expect(typeSelect.locator('option[value="training"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="ai"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="learning-design"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="business"]')).toHaveCount(1);
		await expect(page.getByLabel('Tên')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel(/Bối cảnh hoặc điều đang khiến bạn băn khoăn/i)).toBeVisible();
		await expect(page.getByTestId('contact-rail')).toHaveCount(0);
		await expect(page.getByTestId('gate-back')).toBeVisible();
	});

	test('privacy policy loads', async ({ page }) => {
		await page.goto('/chinh-sach/bao-mat');
		await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
	});

	test('bai viet redirects to ghi chep gate', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page).toHaveURL(/\/ghi-chep/);
		await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
	});

	test('growth page redirects home when unpublished', async ({ page }) => {
		await page.goto('/phat-trien-ban-than');
		await expect(page).toHaveURL(/\/$/);
	});

	test('blog redirects home', async ({ page }) => {
		await page.goto('/blog');
		await expect(page).toHaveURL(/\/$/);
	});

	test('login page loads', async ({ page }) => {
		await page.goto('/dang-nhap');
		await expect(page.locator('body')).toContainText(/Google|Đăng nhập/i);
	});

	test('legacy login redirects', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveURL(/\/dang-nhap/);
	});

	test('giang day redirects to services', async ({ page }) => {
		await page.goto('/giang-day');
		await expect(page).toHaveURL(/\/dich-vu/);
	});

	test('personality test is not a public product route', async ({ page }) => {
		const res = await page.goto('/personality-test');
		expect(res?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Navigation', () => {
	test('intro opens mục lục, which replaces classic header navigation', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(page.locator('header nav[aria-label="Chính"]')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Mở menu' })).toHaveCount(0);
		await page.locator('a[href="/muc-luc"]').last().click();
		await expect(page).toHaveURL(/\/muc-luc/);
		const gate = page.getByRole('navigation', { name: 'Cổng trang' });
		await expect(gate.getByRole('link')).toHaveCount(4);
		await expect(gate.getByTestId('gate-item-locked')).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /My Space/i })).toBeVisible();
		await expect(page.getByTestId('contact-rail')).toBeVisible();
	});

	test('contact rail opens a quick message panel', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/gioi-thieu');
		const trigger = page.getByTestId('contact-rail');
		await expect(trigger).toHaveText('Gửi lời nhắn');
		await trigger.click();
		await expect(page.getByRole('dialog', { name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(page.getByLabel('Tên')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Lời nhắn' })).toBeVisible();
		await expect(page.getByRole('link', { name: /Mở trang liên hệ đầy đủ/i })).toBeVisible();
		await expect(page).toHaveURL(/\/gioi-thieu/);
	});

	test('mobile contact FAB stays off book pages and remains available from contact', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/muc-luc');
		await expect(page.getByTestId('contact-rail')).toBeHidden();
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { level: 1, name: /Gửi tôi một lời nhắn/i }),
		).toBeVisible();
	});

	test('gate back returns to the mục lục', async ({ page }) => {
		await page.goto('/dich-vu');
		await page.getByTestId('gate-back').click();
		await expect(page).toHaveURL(/\/muc-luc/);
		await expect(page.getByTestId('gate-home')).toBeVisible();
	});

	test('mục lục can return to the intro cover', async ({ page }) => {
		await page.goto('/muc-luc');
		await page.getByTestId('intro-back').click();
		await expect(page).toHaveURL(/\/$/);
		await expect(page.getByTestId('intro-home')).toBeVisible();
	});
});

test.describe('API health', () => {
	test('liveness and readiness expose safe health envelopes with request ids', async ({
		request,
	}) => {
		for (const path of ['/api/health/live', '/api/health/ready']) {
			const res = await request.get(path);
			expect(res.ok()).toBeTruthy();
			expect(res.headers()['x-request-id']).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
			const json = await res.json();
			expect(json).toMatchObject({
				ok: true,
				data: { status: expect.stringMatching(/^(live|ready)$/) },
			});
		}
	});

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
});
