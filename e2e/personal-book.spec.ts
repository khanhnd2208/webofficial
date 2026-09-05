import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

const pages = ['/', '/muc-luc', '/gioi-thieu', '/du-an', '/dich-vu'];
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
			if (path === '/du-an') {
				const columns = page.locator('.book-project-column');
				await expect(columns).toHaveCount(4);
				const bounds = await columns.evaluateAll((els) =>
					els.map((e) => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y })),
				);
				expect(width < 1024 ? bounds[1].y > bounds[0].y : bounds[1].x > bounds[0].x).toBe(true);
				await expect(page.getByText('Minh họa ý tưởng dự án', { exact: true })).toHaveCount(4);
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
	await page
		.locator('summary')
		.filter({ hasText: 'Chương trình có được thiết kế riêng không?' })
		.click();
	await expect(page.locator('details[open]')).toHaveCount(1);
	await page.goto('/');
	await page.getByTestId('intro-open-toc').click();
	await expect(page).toHaveURL(/\/muc-luc$/);
	await page.getByTestId('gate-item-about').click();
	await expect(page).toHaveURL(/\/gioi-thieu$/);
	await context.close();
});

test('desktop projects support click, drag, keyboard, and reduced motion', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/du-an');
	const scroller = page.locator('.book-project-scroller');
	await page.getByRole('button', { name: 'Xem dự án tiếp' }).click();
	await expect.poll(() => scroller.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
	await scroller.focus();
	await page.keyboard.press('ArrowLeft');
	await expect.poll(() => scroller.evaluate((e) => e.scrollLeft)).toBe(0);
	const first = page.locator('.book-project-link').first();
	const box = (await first.boundingBox())!;
	await page.mouse.move(box.x + box.width - 20, box.y + 100);
	await page.mouse.down();
	await page.mouse.move(box.x + 80, box.y + 100, { steps: 12 });
	await page.mouse.up();
	await expect(page).toHaveURL(/\/du-an$/);
	await expect.poll(() => scroller.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
	await scroller.evaluate((e) => e.scrollTo({ left: 0, behavior: 'instant' }));
	await first.click();
	await expect(page).toHaveURL(/\/du-an\/strategic-management-learning-experience$/);
	await page.goBack();
	await page.goto('/muc-luc');
	await page.getByTestId('gate-item-services').focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/dich-vu$/);
	await expect(page.locator('h1')).toHaveText(
		'Chúng ta có thể bắt đầu từ một việc bạn muốn làm tốt hơn.',
	);
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
						return !img.getBoundingClientRect().width || (img.complete && img.naturalWidth > 0);
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
		if (path === '/dich-vu') {
			await page.getByRole('link', { name: 'Xem các hướng làm việc' }).click();
			await page.locator('summary').first().click();
			await expect(page.locator('details[open]')).toHaveCount(1);
		}
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
