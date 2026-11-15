import { test, expect } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('Public pages smoke', () => {
	test('homepage is an intro cover that opens the mục lục', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Duy Khánh — Trở thành/i);
		await expect(page.getByTestId('intro-home')).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await expect(page.getByText('[động từ]').locator('visible=true')).toBeVisible();
		await expect(page.getByText(/Chưa xong/i).locator('visible=true')).toBeVisible();
		await expect(page.locator('a[href="/muc-luc"]').last()).toBeVisible();
		await expect(page.getByTestId('site-header')).toHaveCount(0);
		await expect(page.getByTestId('site-header-contact')).toHaveCount(0);
		await expect(page.getByTestId('gate-home')).toHaveCount(0);
		await expect(page.locator('header nav[aria-label="Chính"]')).toHaveCount(0);
		await expect(page.getByTestId('site-auth-chip').filter({ visible: true })).toBeVisible();
		await expect(page.getByTestId('site-auth-chip').filter({ visible: true })).toHaveJSProperty(
			'tagName',
			'BUTTON',
		);
		await expect(
			page.getByRole('heading', { name: /Tôi làm giáo dục để tiếp tục học/i }),
		).toHaveCount(0);
		await expect(page.getByText('Learn Chinese', { exact: true })).toHaveCount(0);
		await expect(page.getByText('PODCAST', { exact: true })).toHaveCount(0);
	});

	test('mục lục shows the active public doors at once', async ({ page }) => {
		await page.goto('/muc-luc');
		await expect(page.getByTestId('gate-home')).toBeVisible();
		const gate = page.getByRole('navigation', { name: 'Mục lục' });
		await expect(page.getByTestId('gate-item-about')).toHaveAttribute('href', '/lien-he');
		await expect(page.getByTestId('gate-item-about')).toContainText('Về tôi');
		await expect(page.getByTestId('gate-item-learning')).toHaveAttribute('href', '/khoa-hoc');
		await expect(page.getByTestId('gate-item-learning')).toContainText('Học tập');
		await expect(gate.getByRole('link')).toHaveCount(2);
		await expect(gate.getByRole('link', { name: /Trải nghiệm/i })).toHaveCount(0);
		await expect(gate.locator('a[href="/du-an"],a[href="/dich-vu"]')).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Active Recall/i })).toHaveCount(0);
		await expect(page.getByTestId('site-header-contact')).toBeVisible();
		await expect(page.getByTestId('site-header-contact')).toHaveText('Gửi lời nhắn', {
			useInnerText: true,
		});
		await expect(page.getByTestId('site-header-home')).toBeVisible();
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
		// Every door is a plain link, so it still opens with JavaScript off.
		await page.getByTestId('gate-item-learning').click();
		await expect(page).toHaveURL(/\/khoa-hoc$/);
		await context.close();
	});

	test('Mục lục shows visitors exactly the two doors', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/muc-luc');
		const doors = page.getByTestId('gate-home').filter({ visible: true });
		await expect(doors).toBeVisible();
		await expect(page.locator('[data-testid^="gate-item-"]')).toHaveCount(2);
		await page.getByTestId('gate-item-learning').click();
		await expect(page).toHaveURL(/\/khoa-hoc$/);
	});

	test('intro and mục lục stay without horizontal overflow at critical widths', async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });

		for (const path of ['/', '/muc-luc'] as const) {
			await page.goto(path);
			for (const width of [320, 390, 768, 1024, 1440]) {
				await page.setViewportSize({ width, height: 900 });
				if (path === '/') {
					await expect(page.getByTestId('intro-home')).toBeVisible();
				} else {
					await expect(page.getByTestId('gate-home').filter({ visible: true })).toBeVisible();
				}
				const hasOverflow = await page.evaluate(
					() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
				);
				expect(hasOverflow).toBe(false);
			}
		}
	});

	test('a signed-in admin header leaves the wordmark clear on a 320px phone', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.setViewportSize({ width: 320, height: 700 });
		await page.goto('/muc-luc');
		await expect(page.getByTestId('site-auth-chip')).toHaveAttribute('data-auth-state', 'admin');
		const home = await page.getByTestId('site-header-home').boundingBox();
		const contact = await page.getByTestId('site-header-contact').boundingBox();
		const chip = await page.getByTestId('site-auth-chip').boundingBox();
		expect(home && contact && chip).toBeTruthy();
		expect(home!.x + home!.width).toBeLessThanOrEqual(contact!.x);
		expect(chip!.x + chip!.width).toBeLessThanOrEqual(320);
	});

	test('the old introduction lands on Về tôi, with every channel', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/lien-he$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Nguyễn Duy Khánh' })).toBeVisible();
		await expect(page.getByTestId('contact-email')).toHaveAttribute(
			'href',
			'mailto:khanhnd2208@gmail.com',
		);
		await expect(page.getByTestId('contact-linkedin')).toHaveAttribute(
			'href',
			'https://www.linkedin.com/in/khanhnguyenduy/',
		);
		await expect(page.getByTestId('contact-instagram')).toHaveAttribute(
			'href',
			'https://www.instagram.com/turamisi.nk/',
		);
	});

	test('retired service URLs redirect to Về tôi', async ({ page }) => {
		for (const path of ['/dong-hanh', '/dong-hanh/mentoring', '/case-study', '/du-an/moonie']) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/lien-he$/);
		}
	});

	test('lab and public learn hubs redirect home', async ({ page }) => {
		await page.goto('/goc-cua-khanh');
		await expect(page).toHaveURL(/\/lien-he$/);
		await page.goto('/hoc');
		await expect(page).toHaveURL(/\/muc-luc$/);
		await page.goto('/archive');
		await expect(page).toHaveURL(/\/muc-luc$/);
	});

	test('contact page offers a quiet single message flow', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(page.getByRole('heading', { level: 2, name: 'Gửi lời nhắn' })).toBeVisible();
		const typeSelect = page.getByLabel('Chủ đề');
		await expect(typeSelect).toBeVisible();
		await expect(typeSelect.locator('option[value="training"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="ai"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="learning-design"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="business"]')).toHaveCount(1);
		await expect(page.getByLabel('Tên')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Lời nhắn', { exact: true })).toBeVisible();
		await expect(page.getByLabel(/Thời gian dự kiến/)).toHaveCount(0);
		await expect(page.getByTestId('site-header-contact')).toHaveCount(0);
		await expect(page.getByTestId('site-header')).toBeVisible();
	});

	test('privacy policy loads', async ({ page }) => {
		await page.goto('/chinh-sach/bao-mat');
		await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
	});

	test('retired writing, growth and blog links land on mục lục', async ({ page }) => {
		for (const path of ['/bai-viet', '/phat-trien-ban-than', '/blog']) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/muc-luc$/);
		}
	});

	test('the course catalog is readable before signing in, under the old address too', async ({
		page,
	}) => {
		for (const path of ['/khoa-hoc', '/kham-pha-khoa-hoc']) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/khoa-hoc$/);
			await expect(
				page.getByRole('heading', { name: 'Một điều mới bắt đầu từ đây.' }),
			).toBeVisible();
			await expect(page).not.toHaveURL(/dang-nhap/);
		}
	});

	test('unknown pages identify the error in the browser title', async ({ page }) => {
		await page.goto('/this-page-does-not-exist');
		await expect(page).toHaveTitle(/Không tìm thấy trang/);
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
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
		await expect(page).toHaveURL(/\/lien-he/);
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
		await expect(page.getByTestId('gate-item-about')).toHaveAttribute('href', '/lien-he');
		await expect(page.getByTestId('site-header-contact')).toBeVisible();
	});

	test('contact rail opens a quick message panel', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/muc-luc');
		const trigger = page.getByTestId('site-header-contact');
		await expect(trigger).toHaveText('Gửi lời nhắn', { useInnerText: true });
		await trigger.click();
		await expect(page.getByRole('dialog', { name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(page.getByLabel('Tên')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Lời nhắn' })).toBeVisible();
		await expect(page.getByRole('link', { name: /Mở trang liên hệ đầy đủ/i })).toBeVisible();
		await expect(page).toHaveURL(/\/muc-luc/);
	});

	test('mobile header keeps one contact action, except on the contact page', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/muc-luc');
		await expect(page.getByTestId('site-header-contact')).toBeVisible();
		await expect(page.getByTestId('site-header-contact')).toHaveText('Nhắn tin', {
			useInnerText: true,
		});
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
		await page.goto('/lien-he');
		await expect(page.getByRole('heading', { level: 1, name: 'Nguyễn Duy Khánh' })).toBeVisible();
		await expect(page.getByTestId('site-header-contact')).toHaveCount(0);
	});

	test('the wordmark returns to the mục lục', async ({ page }) => {
		await page.goto('/lien-he');
		await page.getByTestId('site-header-home').click();
		await expect(page).toHaveURL(/\/muc-luc/);
		await expect(page.getByTestId('gate-home').filter({ visible: true })).toBeVisible();
	});

	test('mục lục wordmark stays on the mục lục', async ({ page }) => {
		await page.goto('/muc-luc');
		await expect(page.getByTestId('site-header-home')).toHaveAttribute('href', '/muc-luc');
		await expect(page.getByTestId('intro-back')).toHaveCount(0);
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
