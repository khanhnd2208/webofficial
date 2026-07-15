import { test, expect, type Locator } from '@playwright/test';

async function renderedLineCount(locator: Locator): Promise<number> {
	return locator.evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const range = document.createRange();
		const lineTops: number[] = [];
		let node: Node | null;

		while ((node = walker.nextNode())) {
			const text = node.textContent ?? '';
			for (let index = 0; index < text.length; index += 1) {
				if (/\s/.test(text[index])) continue;
				range.setStart(node, index);
				range.setEnd(node, index + 1);
				for (const rect of range.getClientRects()) {
					const top = Math.round(rect.top);
					if (!lineTops.some((value) => Math.abs(value - top) <= 2)) lineTops.push(top);
				}
			}
		}

		return lineTops.length;
	});
}

test.describe('Public pages smoke', () => {
	test('homepage communicates Learning as Becoming and only verified content', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Duy Khánh/i);
		await expect(
			page.getByRole('heading', { name: /Không chỉ học để biết\. Học để trở thành\./i }),
		).toBeVisible();
		await expect(
			page.getByRole('link', { name: /Đọc những ghi chép mới/i }).first(),
		).toBeVisible();
		await expect(page.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i })).toBeAttached();
		await expect(page.getByText(/Emotion leads us/i)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Những điều tôi đang viết' })).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Những cách chúng ta có thể học cùng nhau' }),
		).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Những điều tôi đang xây dựng' })).toHaveCount(
			0,
		);
		await expect(page.getByText('Learn Chinese', { exact: true })).toHaveCount(0);
		await expect(page.getByText('AI Knowledge Systems', { exact: true })).toHaveCount(0);
		await expect(page.getByText('PODCAST', { exact: true })).toHaveCount(0);
	});

	test('homepage core story remains readable without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto('/');

		await expect(
			page.getByRole('heading', { name: /Không chỉ học để biết\. Học để trở thành\./i }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: /Một bài học tốt cần đi được vào đời sống/i }),
		).toBeVisible();
		await expect(page.getByText(/Emotion leads us/i)).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Nếu những điều tôi viết khiến bạn nghĩ thêm/i }),
		).toBeVisible();
		await context.close();
	});

	test('loads only one art-directed hero asset on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i }).waitFor();

		const heroAssets = await page.evaluate(() =>
			performance
				.getEntriesByType('resource')
				.map((entry) => entry.name)
				.filter((name) => name.includes('learning-as-becoming-mobile')),
		);
		expect(heroAssets).toHaveLength(1);
	});

	test('homepage typography remains compact at critical viewport widths', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		await page.evaluate(async () => {
			await document.fonts.ready;
		});

		const heroTitle = page.getByRole('heading', {
			level: 1,
			name: /Không chỉ học để biết\. Học để trở thành\./i,
		});
		const eyebrow = page.getByText('Duy Khánh · Giảng viên', { exact: true });
		const closingTitle = page.getByRole('heading', {
			level: 2,
			name: /Nếu những điều tôi viết khiến bạn nghĩ thêm/i,
		});

		expect(await renderedLineCount(heroTitle)).toBeLessThanOrEqual(3);
		expect(await renderedLineCount(eyebrow)).toBe(1);
		expect(await renderedLineCount(closingTitle)).toBeLessThanOrEqual(5);
		const artworkTop = await page
			.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i })
			.evaluate((element) => element.getBoundingClientRect().top);
		expect(artworkTop).toBeLessThan(667);

		for (const width of [768, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			expect(await renderedLineCount(heroTitle)).toBe(2);
			expect(await renderedLineCount(closingTitle)).toBeLessThanOrEqual(width === 768 ? 4 : 3);
			const hasOverflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
			);
			expect(hasOverflow).toBe(false);
		}
	});

	test('about page introduces the person before three concise work areas', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await expect(
			page.getByRole('heading', { name: /Tôi là Duy Khánh, một giảng viên/i }),
		).toBeVisible();
		await expect(page.locator('#dich-vu')).toBeVisible();
		await expect(page.locator('#giang-day-workshop')).toBeVisible();
		await expect(page.locator('#tu-van-phat-trien')).toBeVisible();
	});

	test('retired service URLs redirect to about sections', async ({ page }) => {
		await page.goto('/dong-hanh');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await page.goto('/dong-hanh/mentoring');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await page.goto('/case-study');
		await expect(page).toHaveURL(/\/gioi-thieu/);
	});

	test('lab and public learn hubs redirect to archive', async ({ page }) => {
		await page.goto('/goc-cua-khanh');
		await expect(page).toHaveURL(/\/archive/);
		await page.goto('/hoc');
		await expect(page).toHaveURL(/\/archive/);
	});

	test('archive is noindex', async ({ page }) => {
		await page.goto('/archive');
		await expect(page.getByRole('heading', { name: 'Lưu trữ' })).toBeVisible();
		const robots = await page.locator('meta[name="robots"]').getAttribute('content');
		expect(robots ?? '').toMatch(/noindex/i);
	});

	test('contact page loads with public inquiry options', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { name: /Gửi Khánh một lời nhắn/i }).first(),
		).toBeVisible();
		const typeSelect = page.locator('#inquiryType');
		if (await typeSelect.count()) {
			await expect(typeSelect.locator('option[value="training"]')).toHaveCount(1);
			await expect(typeSelect.locator('option[value="learning-design"]')).toHaveCount(1);
			await expect(typeSelect.locator('option[value="people-organization"]')).toHaveCount(1);
			await expect(typeSelect.locator('option[value="mentoring"]')).toHaveCount(0);
		}
	});

	test('privacy policy loads', async ({ page }) => {
		await page.goto('/chinh-sach/bao-mat');
		await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
	});

	test('bai viet library shows writing index', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page.getByRole('heading', { name: 'Bài viết' })).toBeVisible();
		const cards = page.locator('main article');
		const count = await cards.count();
		if (count > 0) {
			await expect(cards.first().getByRole('heading')).toBeVisible();
		}
	});

	test('growth page is gated when no episodes', async ({ page }) => {
		await page.goto('/phat-trien-ban-than');
		await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
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

	test('giang day redirects to teaching about section', async ({ page }) => {
		await page.goto('/giang-day');
		await expect(page).toHaveURL(/\/gioi-thieu/);
	});

	test('personality test is not a public product route', async ({ page }) => {
		const res = await page.goto('/personality-test');
		expect(res?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Navigation', () => {
	test('public nav follows the educator-first information architecture', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		const header = page.locator('header');
		await expect(header.getByRole('link', { name: 'Duy Khánh — trang chủ' })).toBeVisible();
		const nav = page.locator('header nav[aria-label="Chính"]');
		await expect(nav.getByRole('link', { name: 'Trang chủ' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Giới thiệu' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Trải nghiệm học tập' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Podcast' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Đồng hành' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Học', exact: true })).toHaveCount(0);
	});

	test('mobile menu supports keyboard escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Mở menu' }).click();
		const dialog = page.getByRole('dialog', { name: 'Menu điều hướng' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Đăng nhập' })).toHaveCount(0);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: 'Menu điều hướng' })).toHaveCount(0);
	});

	test('hero paths lead to writing and the personal introduction', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(page.getByRole('link', { name: /Đọc những ghi chép mới/i }).first()).toHaveAttribute('href', '/bai-viet');
		await page.getByRole('link', { name: /Tìm hiểu thêm về Khánh/i }).click();
		await expect(page).toHaveURL(/\/gioi-thieu$/);
	});

	test('footer stays compact with utility links', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer.getByText('Duy Khánh').first()).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Gửi lời nhắn' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Bảo mật' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Lưu trữ' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Khu học tập' })).toBeVisible();
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
	test('legacy dashboard redirects to learner account', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/tai-khoan\/hoc/);
	});

	test('admin redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/dang-nhap/);
	});
});
