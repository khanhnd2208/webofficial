import { expect, test } from '@playwright/test';

test.describe('Archived public My Class', () => {
	test('learner surfaces are not reachable as an active product', async ({ request }) => {
		for (const path of [
			'/my-space/my-class',
			'/my-space/my-class/hrm-toi-gian',
			'/my-space/my-class/hrm-toi-gian/hrm-la-gi/hrm-sample-l01-s01-k01',
			'/my-space/my-class/missing-course/tests/missing-test',
		]) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(404);
			expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
		}
	});
});
