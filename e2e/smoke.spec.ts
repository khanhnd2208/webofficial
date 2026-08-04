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
		await expect(page).toHaveTitle(/Duy Khánh — Giảng viên và người thiết kế trải nghiệm học tập/i);
		await expect(
			page.getByRole('heading', {
				name: /Tôi làm giáo dục để tiếp tục học\./i,
			}),
		).toBeVisible();
		await expect(page.getByText('Educator · Explorer', { exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: /Tìm hiểu về tôi/i }).first()).toBeVisible();
		await expect(
			page.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i }),
		).toBeAttached();
		await expect(page.getByText(/Quan niệm giảng dạy/i)).toHaveCount(0);
		await expect(
			page.getByRole('heading', {
				name: /Những chương trình và thử nghiệm giáo dục đang được thực hiện/i,
			}),
		).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tôi muốn đào tạo một đội ngũ' })).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'My Hanoicam' })).toHaveCount(0);
		await expect(page.getByText('Learn Chinese', { exact: true })).toHaveCount(0);
		await expect(page.getByText('AI Knowledge Systems', { exact: true })).toHaveCount(0);
		await expect(page.getByText('PODCAST', { exact: true })).toHaveCount(0);
		await expect(page.getByText(/tạm thời|sẽ thay|đang chờ|Hồ sơ đang hoàn thiện/i)).toHaveCount(0);
	});

	test('homepage core story remains readable without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto('/');

		await expect(
			page.getByRole('heading', {
				name: /Tôi làm giáo dục để tiếp tục học\./i,
			}),
		).toBeVisible();
		await expect(
			page.getByRole('heading', {
				name: /Những chương trình và thử nghiệm giáo dục đang được thực hiện/i,
			}),
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
			name: /Tôi làm giáo dục để tiếp tục học\./i,
		});
		const eyebrow = page.getByText('Educator · Explorer', { exact: true });
		const sectionTitle = page.getByRole('heading', {
			level: 2,
			name: /Những chương trình và thử nghiệm giáo dục đang được thực hiện/i,
		});
		const heroSection = page.locator('main section').first();

		expect(await renderedLineCount(heroTitle)).toBeLessThanOrEqual(3);
		expect(await renderedLineCount(eyebrow)).toBe(1);
		expect(await renderedLineCount(sectionTitle)).toBeLessThanOrEqual(4);

		for (const width of [320, 390, 768, 1024, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			const maxHeroLines = width < 768 ? 3 : 2;
			expect(await renderedLineCount(heroTitle)).toBeLessThanOrEqual(maxHeroLines);
			expect(await renderedLineCount(sectionTitle)).toBeLessThanOrEqual(width <= 768 ? 5 : 3);
			const [heroFontSize, sectionFontSize, heroHeight] = await Promise.all([
				heroTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
				page
					.getByRole('heading', {
						level: 2,
						name: /Những chương trình và thử nghiệm giáo dục đang được thực hiện/i,
					})
					.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
				heroSection.evaluate((element) => element.getBoundingClientRect().height),
			]);
			const minHero = width <= 639 ? 30 : width < 1024 ? 34 : 40;
			const minSection = width <= 639 ? 24 : 28;
			expect(heroFontSize).toBeGreaterThanOrEqual(minHero);
			expect(heroFontSize).toBeLessThanOrEqual(width < 768 ? 60 : 84);
			expect(sectionFontSize).toBeGreaterThanOrEqual(minSection);
			expect(sectionFontSize).toBeLessThanOrEqual(56);
			expect(heroFontSize).toBeGreaterThan(sectionFontSize);
			expect(heroHeight).toBeLessThanOrEqual(width < 768 ? 1300 : 1100);
			const hasOverflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
			);
			expect(hasOverflow).toBe(false);
		}
	});

	test('about page tells the becoming story without repeating the homepage hero', async ({
		page,
	}) => {
		await page.goto('/gioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu/);
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: /Con đường của tôi luôn quay trở lại lớp học/i,
			}),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: /Tôi làm giáo dục để tiếp tục học/i }),
		).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Con đường đưa tôi trở lại lớp học/i }),
		).toBeVisible();
		await expect(page.getByText(/Hình minh họa hiện tại|sẽ thay bằng chân dung/i)).toHaveCount(0);
		await expect(page.getByText('Aa', { exact: true })).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Lớp học, thiết kế và những thử nghiệm mới/i }),
		).toBeVisible();
		await expect(page.getByRole('link', { name: 'Những lớp học đang diễn ra' })).toBeVisible();
		await expect(page.getByText(/My Hanoicam/i)).toHaveCount(0);
		await expect(page.getByText(/Một vài thông tin chính thức/i)).toBeVisible();
		await expect(
			page.getByRole('link', { name: /Gửi tôi một lời nhắn/i }),
		).toBeVisible();
		await expect(page.getByRole('link', { name: /Xem các hình thức cộng tác/i })).toHaveCount(0);
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
		await expect(
			page.getByLabel(/Bối cảnh hoặc điều đang khiến bạn băn khoăn/i),
		).toBeVisible();
		await expect(page.getByRole('dialog', { name: 'Gửi tôi một lời nhắn' })).toHaveCount(0);
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
	test('public nav follows the educator-first information architecture', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		const header = page.locator('header');
		await expect(header.getByRole('link', { name: 'Duy Khánh — trang chủ' })).toBeVisible();
		const nav = page.locator('header nav[aria-label="Chính"]');
		await expect(nav.getByRole('link', { name: 'Trang chủ' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Giới thiệu' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Dự án' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Dịch vụ' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Ghi chép' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Liên hệ' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toHaveCount(0);
		await expect(header.getByRole('link', { name: 'Gửi lời nhắn' })).toBeVisible();
	});

	test('mobile menu supports keyboard escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Mở menu' }).click();
		const dialog = page.getByRole('dialog', { name: 'Menu điều hướng' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Gửi lời nhắn' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: 'Menu điều hướng' })).toHaveCount(0);
	});

	test('contact CTA leads to the contact page without a modal', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/gioi-thieu');
		const trigger = page.locator('header').getByRole('link', { name: 'Gửi lời nhắn' });
		await expect(trigger).toHaveAttribute('href', /\/lien-he/);
		await trigger.click();
		await expect(page).toHaveURL(/\/lien-he/);
		await expect(page.getByRole('dialog', { name: 'Gửi tôi một lời nhắn' })).toHaveCount(0);
		await expect(
			page.getByRole('heading', { level: 1, name: /Gửi tôi một lời nhắn/i }),
		).toBeVisible();
	});

	test('footer stays compact with personal positioning', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('footer');
		await expect(footer.getByText('Duy Khánh').first()).toBeVisible();
		await expect(footer.getByText('Tôi dạy, học và viết từ Hà Nội.')).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Giới thiệu' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Dự án' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Dịch vụ' })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'Liên hệ' })).toBeVisible();
		await expect(footer.getByText(/năng lực, chương trình và quy trình/i)).toHaveCount(0);
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
});
