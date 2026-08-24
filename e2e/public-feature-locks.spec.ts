import { expect, test } from '@playwright/test';

const unfinishedFeaturesExplicitlyEnabled =
	process.env.PUBLIC_TESTS_ENABLED === 'true' || process.env.PUBLIC_KNOWLEDGE_ENABLED === 'true';

test.describe('unfinished public learning surfaces', () => {
	test.skip(
		unfinishedFeaturesExplicitlyEnabled,
		'This suite verifies the production fail-closed configuration.',
	);

	test('returns non-cacheable 404s for Tests and Kho kiến thức pages', async ({ request }) => {
		for (const path of [
			'/my-space/tests',
			'/my-space/tests/example/play',
			'/my-space/my-class',
			'/my-space/my-class/example/lesson/unit',
		]) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(404);
			expect(response.headers()['cache-control'], path).toBe('no-store');
			expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
		}
	});

	test('returns the standard 404 envelope for direct APIs', async ({ request }) => {
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

	test('shows locked tiles while keeping Active Recall available', async ({ page }) => {
		await page.goto('/my-space');

		for (const id of ['tests', 'my-class']) {
			const tile = page.getByTestId(`myspace-tile-${id}`);
			await expect(tile).toBeVisible();
			expect(await tile.evaluate((element) => element.tagName)).toBe('BUTTON');
		}
		await expect(page.getByTestId('myspace-tile-active-recall')).toHaveAttribute(
			'href',
			'/my-space/active-recall',
		);
	});
});
