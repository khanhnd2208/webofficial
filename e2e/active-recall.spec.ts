import { expect, test } from '@playwright/test';

test.describe('Active Recall', () => {
	test('a learner can open the HRM deck, flip a card, and continue', async ({ page }) => {
		await page.goto('/my-space/active-recall', { waitUntil: 'networkidle' });
		const deck = page.getByRole('link', { name: /HRM · Lesson 1/i });
		if ((await deck.count()) === 0) {
			test.skip(true, 'The idempotent HRM sample deck has not been seeded in this environment.');
			return;
		}

		await deck.click();
		await expect(
			page.getByRole('heading', { name: 'HRM · Lesson 1 — Introduction to HRM' }),
		).toBeVisible();
		await expect(page.getByText('What is human resource management (HRM)?')).toBeVisible();
		await page.getByRole('button', { name: 'Hiện đáp án' }).click();
		await expect(page.getByText(/policies, practices, and systems/i)).toBeVisible();

		await page.getByRole('button', { name: 'Tiếp →' }).click();
		await expect(
			page.getByText('Which three employee outcomes are influenced by HRM?'),
		).toBeVisible();
		await expect(page.getByRole('button', { name: 'Hiện đáp án' })).toBeVisible();
	});
});
