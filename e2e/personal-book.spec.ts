import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

import { aboutPagePaused } from '../src/content/about';

test.use({ video: 'on' });

const pages = ['/', '/muc-luc', '/gioi-thieu', '/trai-nghiem', '/du-an', '/dich-vu'];
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
			if (path === '/gioi-thieu') {
				await expect(
					page.locator(aboutPagePaused ? '.contact-profile-item' : '.about-path'),
				).toHaveCount(2);
				await expect(page.locator('details')).toHaveCount(0);
				const words = await page.locator('main').innerText();
				expect(words.split(/\s+/).length).toBeLessThan(150);
				if (width === 390)
					expect(await page.evaluate(() => document.body.scrollHeight)).toBeLessThan(1000);
			}
			if (path === '/trai-nghiem') {
				const columns = page.locator('.about-project-grid > li');
				await expect(columns).toHaveCount(4);
				const bounds = await columns.evaluateAll((els) =>
					els.map((e) => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y })),
				);
				expect(width <= 600 ? bounds[1].y > bounds[0].y : bounds[1].x > bounds[0].x).toBe(true);
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
	await page.goto('/trai-nghiem');
	await page.locator('summary').filter({ hasText: 'Xem nội dung và hình thức' }).first().click();
	await expect(page.locator('details[open]')).toHaveCount(1);
	await page.goto('/');
	await page.getByTestId('intro-open-toc').click();
	await expect(page).toHaveURL(/\/muc-luc$/);
	await page.getByTestId('gate-item-about').click();
	await expect(page).toHaveURL(/\/gioi-thieu$/);
	await context.close();
});

test('projects and collaboration support keyboard navigation and reduced motion', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/muc-luc');
	await page.getByTestId('gate-item-about').focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/gioi-thieu$/);
	if (aboutPagePaused) {
		await page.goto('/trai-nghiem');
	} else {
		await page.getByRole('link', { name: 'Ghé xem trải nghiệm của tôi' }).focus();
		await page.keyboard.press('Enter');
	}
	await expect(page).toHaveURL(/\/trai-nghiem$/);
	await expect(page.locator('.about-project-grid > li')).toHaveCount(4);
	await page.getByTestId('experience-project-strategic-management-learning-experience').focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/du-an\/strategic-management-learning-experience$/);
	await expect(
		page.getByRole('heading', { level: 1, name: 'Strategic Management Learning Experience' }),
	).toBeVisible();
	await page.goBack();
	await expect(page.getByTestId('experience-page')).toBeVisible();
	const summary = page.locator('#management-learning summary');
	await summary.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('#management-learning details')).toHaveAttribute('open', '');
	await expect(page.getByRole('link', { name: /Trao đổi về chương trình quản trị/ })).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.locator('details[open]')).toHaveCount(0);
});

test('old hubs redirect permanently to introduction sections and preserve query parameters', async ({
	page,
	request,
}) => {
	for (const [oldPath, targetPath, anchor] of [
		['/du-an', '/trai-nghiem', 'du-an'],
		['/dich-vu', '/gioi-thieu', 'dich-vu'],
	] as const) {
		const response = await request.get(`${oldPath}?utm_source=bookmark`, { maxRedirects: 0 });
		expect(response.status()).toBe(308);
		const target = new URL(response.headers().location, 'http://localhost:3000');
		expect(target.pathname).toBe(targetPath);
		expect(target.hash).toBe(`#${anchor}`);
		expect(target.searchParams.get('utm_source')).toBe('bookmark');
		await page.goto(oldPath);
		await expect(page).toHaveURL(new RegExp(`${targetPath}#${anchor}$`));
		// The contact card that stands in for the introduction has no #dich-vu section.
		if (aboutPagePaused && targetPath === '/gioi-thieu') continue;
		await expect
			.poll(async () => {
				const bounds = await page.locator(`#${anchor}`).boundingBox();
				return bounds !== null && bounds.y >= 0 && bounds.y < 450;
			})
			.toBe(true);
	}
});

test('all collaboration links preselect the right subject and introduction source', async ({
	page,
}) => {
	for (const [id, subject] of [
		['management-learning', 'training'],
		['applied-ai', 'ai'],
		['learning-programs', 'learning-design'],
	] as const) {
		await page.goto('/trai-nghiem');
		await expect(page.locator('details[open]')).toHaveCount(0);
		await page.locator(`#${id} summary`).click();
		await expect(page.locator(`#${id} details`)).toHaveAttribute('open', '');
		const link = page.locator(`#${id} .about-offer-expanded a`);
		const href = await link.getAttribute('href');
		const destination = new URL(href!, 'http://localhost:3000');
		expect(destination.searchParams.get('type')).toBe(subject);
		expect(destination.searchParams.get('sourcePage')).toBe('/trai-nghiem');
		await link.click();
		await expect(page.getByLabel('Bạn muốn trao đổi về điều gì?')).toHaveValue(subject);
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
		if (path === '/dich-vu' && !aboutPagePaused) {
			await expect(page).toHaveURL(/\/gioi-thieu#dich-vu$/);
			await expect(page.getByRole('link', { name: 'Trao đổi về cố vấn' })).toBeVisible();
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

test('management and adviser links keep their subject and source', async ({ page }) => {
	test.skip(aboutPagePaused, 'The introduction is replaced by a contact card for now.');
	for (const [name, type] of [
		['Trao đổi về việc học', 'training'],
		['Trao đổi về cố vấn', 'business'],
	]) {
		await page.goto('/gioi-thieu');
		const link = page.getByRole('link', { name, exact: true });
		const url = new URL((await link.getAttribute('href'))!, 'http://localhost:3000');
		expect(url.searchParams.get('type')).toBe(type);
		expect(url.searchParams.get('sourcePage')).toBe('/gioi-thieu');
		await link.click();
		await expect(page.getByLabel('Bạn muốn trao đổi về điều gì?')).toHaveValue(type);
	}
});
