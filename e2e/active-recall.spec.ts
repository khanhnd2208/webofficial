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
		const card = page.locator('article.recall-card');
		const question = (await card.locator('.recall-text').textContent())?.trim();
		expect(question).toBeTruthy();
		await page.getByRole('button', { name: 'Hiện đáp án' }).click();
		await expect(card).toHaveAttribute('data-side', 'answer');
		const answer = (await card.locator('.recall-text').textContent())?.trim();
		expect(answer).toBeTruthy();
		expect(answer).not.toBe(question);

		await page.getByRole('button', { name: 'Tiếp →' }).click();
		await expect(card).toHaveAttribute('data-side', 'question');
		await expect(card.locator('.recall-text')).not.toHaveText(question!);
		await expect(page.getByRole('button', { name: 'Hiện đáp án' })).toBeVisible();
	});
});
