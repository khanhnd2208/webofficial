import { expect, test } from '@playwright/test';

test.describe('Archived public My Space Tests', () => {
	test('learner surfaces are not reachable as an active product', async ({ request }) => {
		for (const path of ['/my-space/tests', '/my-space/tests/principles-of-management-sample/play']) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(404);
			expect(response.headers()['cache-control'], path).toBe('no-store');
			expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
		}
	});
});
