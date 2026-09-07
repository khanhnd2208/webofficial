import { expect, test } from '@playwright/test';

test.describe('Active Recall', () => {
	test('legacy deck URLs redirect into a valid class and orphaned slugs return 404', async ({
		page,
	}) => {
		const redirected = await page.request.get('/my-space/active-recall/hrm-lesson-1', {
			maxRedirects: 0,
		});
		expect(redirected.status()).toBe(308);
		expect(redirected.headers().location).toMatch(
			/\/lop\/[^/]+\/active-recall\/hrm-lesson-1$/,
		);

		const missing = await page.request.get('/my-space/active-recall/no-such-deck-ever', {
			maxRedirects: 0,
		});
		expect(missing.status()).toBe(404);
	});

	test('a learner can open a class deck, flip a card, and continue', async ({ page }) => {
		await page.goto('/lop/hrm-fall-2026?tab=recall', { waitUntil: 'networkidle' });
		const deckLink = page.getByRole('link', { name: /HRM · Lesson 1/i }).first();
		await expect(deckLink).toBeVisible();
		await deckLink.click();
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
