import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

const pages = ['/', '/muc-luc', '/lien-he'];
for (const width of [320, 390, 768, 1024, 1440]) {
	test(`personal book remains readable at ${width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
		for (const path of pages) {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			await expect(page.locator('main h1')).toBeVisible();
			await expect
				.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
				.toBe(true);
			if (path === '/') {
				await expect(page.getByText('Nguyễn Duy Khánh', { exact: true })).toBeVisible();
				await expect(page.getByTestId('intro-open-toc')).toBeVisible();
				expect(
					await page.getByTestId('intro-open-toc').evaluate((el) => getComputedStyle(el).position),
				).not.toBe('fixed');
			}
			if (path === '/lien-he') {
				await expect(page.getByTestId('contact-linkedin')).toBeVisible();
				await expect(page.locator('#contact-form form')).toBeVisible();
			}
			if (width === 390 || width === 1440) {
				await page.evaluate(async () => {
					for (let y = 0; y < document.body.scrollHeight; y += 500) {
						window.scrollTo(0, y);
						await new Promise((r) => setTimeout(r, 120));
					}
					window.scrollTo(0, 0);
				});
				await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
				await page.screenshot({
					path: testInfo.outputPath(`${path.replaceAll('/', '') || 'cover'}-${width}.png`),
					fullPage: true,
					animations: 'disabled',
				});
			}
		}
	});
}

test('public reading and native links survive without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({
		baseURL,
		javaScriptEnabled: false,
		viewport: { width: 390, height: 844 },
	});
	const page = await context.newPage();
	for (const path of pages) {
		await page.goto(path);
		await expect(page.locator('main h1')).toBeVisible();
		const hidden = await page.locator('main').evaluate((el) =>
			Array.from(el.querySelectorAll('h1,h2,h3,p,a'))
				.filter((e) => {
					if (e.closest('details:not([open])')) return false;
					for (let n: Element | null = e; n && n !== el; n = n.parentElement) {
						const s = getComputedStyle(n);
						if (s.display === 'none') return false;
						if (Number(s.opacity) === 0) return true;
					}
					return false;
				})
				.map((e) => e.textContent),
		);
		expect(hidden).toEqual([]);
	}
	await page.goto('/');
	await page.getByTestId('intro-open-toc').click();
	await expect(page).toHaveURL(/\/muc-luc$/);
	await page.getByTestId('gate-item-about').click();
	await expect(page).toHaveURL(/\/lien-he$/);
	await context.close();
});

test('Về tôi opens from Mục lục with the keyboard and reduced motion', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/muc-luc');
	await page.getByTestId('gate-item-about').focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/lien-he$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Nguyễn Duy Khánh' })).toBeVisible();
	for (const band of ['Liên hệ trực tiếp', 'Có thể làm cùng nhau', 'Gửi lời nhắn']) {
		await expect(page.getByRole('heading', { level: 2, name: band })).toBeVisible();
	}
	await page.getByTestId('contact-email').focus();
	await expect(page.getByTestId('contact-email')).toBeFocused();
});

test('retired portfolio pages redirect permanently to Về tôi and keep query parameters', async ({
	request,
}) => {
	for (const oldPath of [
		'/gioi-thieu',
		'/trai-nghiem',
		'/trai-nghiem/mot-cau-chuyen',
		'/du-an',
		'/du-an/strategic-management-learning-experience',
		'/dich-vu',
	]) {
		const response = await request.get(`${oldPath}?utm_source=bookmark`, { maxRedirects: 0 });
		expect(response.status(), oldPath).toBe(308);
		const target = new URL(response.headers().location, 'http://localhost:3000');
		expect(target.pathname).toBe('/lien-he');
		expect(target.searchParams.get('utm_source')).toBe('bookmark');
	}
});

test('a contact link with a subject preselects it in the form', async ({ page }) => {
	for (const subject of ['training', 'ai', 'learning-design']) {
		await page.goto(`/lien-he?type=${subject}`);
		await expect(page.getByLabel('Chủ đề')).toHaveValue(subject);
	}
});

test('short desktop and 200-percent-equivalent reflow keep content reachable', async ({ page }) => {
	for (const viewport of [
		{ width: 1440, height: 500 },
		{ width: 720, height: 450 },
	]) {
		await page.setViewportSize(viewport);
		for (const path of pages) {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			await expect(page.locator('main h1')).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true,
			);
			if (path === '/') {
				await page.getByTestId('intro-open-toc').focus();
				await page.keyboard.press('Enter');
				await expect(page).toHaveURL(/\/muc-luc$/);
			}
		}
	}
});

test('record rendering measurements and capture a reading sequence', async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => {
		const metrics = { lcp: 0, cls: 0 };
		Object.assign(window, { bookMetrics: metrics });
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) metrics.lcp = e.startTime;
		}).observe({ type: 'largest-contentful-paint', buffered: true });
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) {
				const entry = e as PerformanceEntry & { hadRecentInput: boolean; value: number };
				if (!entry.hadRecentInput) metrics.cls += entry.value;
			}
		}).observe({ type: 'layout-shift', buffered: true });
	});
	const results = [];
	for (const path of pages) {
		await page.goto(path, { waitUntil: 'networkidle' });
		await page.evaluate(() => document.fonts.ready);
		await expect
			.poll(() =>
				page.locator('main img').evaluateAll((images) =>
					images.every((e) => {
						const img = e as HTMLImageElement;
						const box = img.getBoundingClientRect();
						return (
							!box.width ||
							box.top > innerHeight ||
							box.bottom < 0 ||
							(img.complete && img.naturalWidth > 0)
						);
					}),
				),
			)
			.toBe(true);
		results.push({
			path,
			...(await page.evaluate(() => ({
				...(window as Window & { bookMetrics?: { lcp: number; cls: number } }).bookMetrics,
				domContentLoaded: performance
					.getEntriesByType('navigation')
					.map((e) => (e as PerformanceNavigationTiming).domContentLoadedEventEnd)[0],
				height: document.body.scrollHeight,
			}))),
		});
	}
	await writeFile(
		testInfo.outputPath('rendering-measurements.json'),
		JSON.stringify(
			{
				baseURL: testInfo.project.use.baseURL,
				viewport: '390 × 844, local unthrottled Chromium',
				results,
			},
			null,
			2,
		),
	);
	await testInfo.attach('rendering-measurements', {
		body: JSON.stringify(
			{
				baseURL: testInfo.project.use.baseURL,
				viewport: '390 × 844, local unthrottled Chromium',
				results,
			},
			null,
			2,
		),
		contentType: 'application/json',
	});
});
