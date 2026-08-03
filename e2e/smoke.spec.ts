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
	test('homepage communicates a clear learning philosophy and only verified content', async ({
		page,
	}) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Duy Khánh/i);
		await expect(
			page.getByRole('heading', {
				name: /Learning changes how we see — and how we act\./i,
			}),
		).toBeVisible();
		await expect(page.getByRole('link', { name: /Tìm hiểu về Khánh/i }).first()).toBeVisible();
		await expect(
			page.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i }),
		).toBeAttached();
		await expect(page.getByText(/Quan niệm giảng dạy/i)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Những điều tôi đang xây dựng' })).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Những cách chúng ta có thể học cùng nhau' }),
		).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Những ghi chép mới' })).toHaveCount(0);
		await expect(page.getByText('Learn Chinese', { exact: true })).toHaveCount(0);
		await expect(page.getByText('AI Knowledge Systems', { exact: true })).toHaveCount(0);
		await expect(page.getByText('PODCAST', { exact: true })).toHaveCount(0);
	});

	test('homepage core story remains readable without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto('/');

		await expect(
			page.getByRole('heading', {
				name: /Learning changes how we see — and how we act\./i,
			}),
		).toBeVisible();
		await expect(page.getByText(/Quan niệm giảng dạy/i)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: /Những điều tôi đang xây dựng/i })).toBeVisible();
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

	test('desktop hero artwork fills its frame and preserves the subject', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');
		const frame = page.getByTestId('home-hero-artwork');
		const image = frame.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i });
		const [frameBox, imageBox, objectPosition] = await Promise.all([
			frame.boundingBox(),
			image.boundingBox(),
			image.evaluate((element) => getComputedStyle(element).objectPosition),
		]);

		expect(frameBox).not.toBeNull();
		expect(imageBox).not.toBeNull();
		expect(Math.abs(frameBox!.width - imageBox!.width)).toBeLessThanOrEqual(1);
		expect(Math.abs(frameBox!.height - imageBox!.height)).toBeLessThanOrEqual(1);
		expect(objectPosition).toBe('15% 50%');
	});

	test('homepage typography remains compact at critical viewport widths', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.evaluate(async () => {
			await document.fonts.ready;
		});

		const heroTitle = page.getByRole('heading', {
			level: 1,
			name: /Learning changes how we see — and how we act\./i,
		});
		const eyebrow = page.getByText('Duy Khánh · Giảng viên', { exact: true });
		const sectionTitle = page.getByRole('heading', {
			level: 2,
			name: /Những điều tôi đang xây dựng/i,
		});
		const heroSection = page.locator('main section').first();

		expect(await renderedLineCount(heroTitle)).toBeLessThanOrEqual(4);
		expect(await renderedLineCount(eyebrow)).toBe(1);
		expect(await renderedLineCount(sectionTitle)).toBeLessThanOrEqual(4);

		for (const width of [320, 390, 768, 1024, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			const maxHeroLines = width < 768 ? 4 : 3;
			expect(await renderedLineCount(heroTitle)).toBeLessThanOrEqual(maxHeroLines);
			expect(await renderedLineCount(sectionTitle)).toBeLessThanOrEqual(width <= 768 ? 4 : 3);
			const [heroFontSize, sectionFontSize, heroHeight] = await Promise.all([
				heroTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
				page
					.getByRole('heading', {
						level: 2,
						name: /Những điều tôi đang xây dựng/i,
					})
					.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
				heroSection.evaluate((element) => element.getBoundingClientRect().height),
			]);
			expect(heroFontSize).toBeGreaterThanOrEqual(width < 768 ? 38 : 54);
			expect(heroFontSize).toBeLessThanOrEqual(width < 768 ? 60 : 84);
			expect(sectionFontSize).toBeGreaterThanOrEqual(28);
			expect(sectionFontSize).toBeLessThanOrEqual(50);
			expect(heroFontSize).toBeGreaterThan(sectionFontSize);
			expect(heroHeight).toBeLessThanOrEqual(width < 768 ? 1100 : 900);
			const hasOverflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
			);
			expect(hasOverflow).toBe(false);
		}

		await page.setViewportSize({ width: 390, height: 844 });
		const heroImage = page.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i });
		const secondaryCta = page.getByRole('link', { name: /Đọc bài viết mới/i }).first();
		const imageBox = await heroImage.boundingBox();
		const secondaryCtaBox = await secondaryCta.boundingBox();
		expect(imageBox).not.toBeNull();
		expect(secondaryCtaBox).not.toBeNull();
		expect(secondaryCtaBox!.height).toBeGreaterThanOrEqual(44);
		expect(imageBox!.height).toBeGreaterThanOrEqual(300);
		expect(imageBox!.height).toBeLessThanOrEqual(520);
		expect(imageBox!.width / imageBox!.height).toBeGreaterThan(0.7);
		expect(imageBox!.width / imageBox!.height).toBeLessThan(0.9);
	});

	test('about page introduces the person before three concise work areas', async ({ page }) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await expect(
			page.getByRole('heading', {
				name: /Tôi là Duy Khánh/i,
			}),
		).toBeVisible();
		await expect(
			page.getByText(/Giảng viên, người thiết kế chương trình học và người viết/i),
		).toBeVisible();
		await page.setViewportSize({ width: 1440, height: 900 });
		const heroContainerWidth = await page
			.getByRole('heading', { level: 1 })
			.locator('..')
			.evaluate((element) => element.getBoundingClientRect().width);
		expect(heroContainerWidth).toBeLessThanOrEqual(900);
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
		await expect(
			page.getByRole('heading', { name: /Những ý tưởng đã bước ra khỏi trang giấy/i }),
		).toBeVisible();
		const robots = await page.locator('meta[name="robots"]').getAttribute('content');
		expect(robots ?? '').toMatch(/noindex/i);
	});

	test('contact page loads with public inquiry options', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { name: /Hãy bắt đầu một cuộc đối thoại/i }).first(),
		).toBeVisible();
		const typeSelect = page.getByLabel('Chủ đề');
		await expect(typeSelect).toBeVisible();
		await expect(typeSelect.locator('option[value="training"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="course"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="learning-design"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="people-organization"]')).toHaveCount(1);
		await expect(typeSelect.locator('option[value="mentoring"]')).toHaveCount(0);
		await page.setViewportSize({ width: 1440, height: 900 });
		const formWidth = await page
			.locator('form')
			.evaluate((element) => element.getBoundingClientRect().width);
		expect(formWidth).toBeLessThanOrEqual(720);
	});

	test('privacy policy loads', async ({ page }) => {
		await page.goto('/chinh-sach/bao-mat');
		await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
	});

	test('bai viet library shows writing index', async ({ page }) => {
		await page.goto('/bai-viet');
		await expect(page.getByRole('heading', { name: /Những ghi chép đang mở/i })).toBeVisible();
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

	test('contact dialog preserves context, focus, draft and scroll state', async ({
		page,
		context,
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/bai-viet?utm_source=kiem-thu');
		const trigger = page.locator('header').getByRole('link', { name: 'Gửi lời nhắn' });

		await expect
			.poll(async () => {
				const href = await trigger.getAttribute('href');
				const url = new URL(href ?? '/lien-he', 'http://localhost:3000');
				return {
					sourcePage: url.searchParams.get('sourcePage'),
					campaign: url.searchParams.get('utm_source'),
				};
			})
			.toEqual({ sourcePage: '/bai-viet', campaign: 'kiem-thu' });

		const fallbackHref = await trigger.getAttribute('href');
		const fallbackPage = await context.newPage();
		await fallbackPage.goto(fallbackHref!);
		await expect(fallbackPage).toHaveURL(/sourcePage=%2Fbai-viet/);
		await expect(fallbackPage).toHaveURL(/utm_source=kiem-thu/);
		await expect(fallbackPage.getByLabel('Chủ đề')).toBeVisible();
		await fallbackPage.close();

		await trigger.click();
		const dialog = page.getByRole('dialog', { name: 'Gửi tôi một lời nhắn' });
		await expect(dialog).toBeVisible();
		expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
		await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

		await page.getByLabel('Họ và tên').fill('Nguyễn An');
		await page.getByLabel('Bạn muốn trao đổi điều gì?').fill('Nội dung bản nháp.');
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');

		await trigger.click();
		await expect(page.getByLabel('Họ và tên')).toHaveValue('Nguyễn An');
		await expect(page.getByLabel('Bạn muốn trao đổi điều gì?')).toHaveValue('Nội dung bản nháp.');
		await page.mouse.click(4, 4);
		await expect(dialog).toBeHidden();
	});

	test('hero paths lead to writing and the personal introduction', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(page.getByRole('link', { name: /Đọc bài viết mới/i }).first()).toHaveAttribute(
			'href',
			'/bai-viet',
		);
		await page
			.getByRole('link', { name: /Tìm hiểu về Khánh/i })
			.first()
			.click();
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
