import { expect, test } from '@playwright/test';

test.describe('archived public learning surfaces', () => {
	test('returns non-cacheable 404s for Tests, My Class and vocabulary pages', async ({
		request,
	}) => {
		for (const path of [
			'/my-space/tests',
			'/my-space/tests/example/play',
			'/my-space/my-class',
			'/my-space/my-class/example/lesson/unit',
			'/vocabulary',
			'/vocabulary/store',
		]) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(404);
			expect(response.headers()['cache-control'], path).toBe('no-store');
			expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
		}
	});

	test('returns the standard 404 envelope for direct public APIs', async ({ request }) => {
		for (const path of [
			'/api/myspace-tests',
			'/api/myspace-tests/example/sessions',
			'/api/my-class/courses',
			'/api/my-class/progress',
		]) {
			const response = await request.get(path);
			expect(response.status(), path).toBe(404);
			expect(response.headers()['cache-control'], path).toBe('no-store');
			expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
			await expect(response.json()).resolves.toMatchObject({
				ok: false,
				code: 'FEATURE_NOT_AVAILABLE',
			});
		}
	});

	test('keeps a focused My Space hub with Teaching', async ({ page }) => {
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.locator('[data-testid^="myspace-tile-"]')).toHaveCount(3);
		await expect(page.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await expect(page.getByTestId('myspace-tile-courses')).toHaveAttribute('href', '/my-space/courses');
		await expect(page.getByTestId('myspace-tile-board-game')).toHaveAttribute('href', '/my-space/board-game');
		await expect(page.getByTestId('myspace-tile-active-recall')).toHaveCount(0);
		await expect(page.getByTestId('myspace-tile-tests')).toHaveCount(0);
		await expect(page.getByTestId('myspace-tile-my-class')).toHaveCount(0);
	});
});
