import { expect, test } from '@playwright/test';

test.describe('Active Recall', () => {
	test('a learner can open the HRM deck from My Space, flip a card, and continue', async ({
		page,
	}) => {
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
		const questionSize = await card
			.locator('.recall-text')
			.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
		expect(questionSize).toBeGreaterThanOrEqual(16);
		expect(questionSize).toBeLessThanOrEqual(32);
		await page.screenshot({
			path: 'test-results/active-recall-myspace-study.png',
			fullPage: true,
		});
		await page.getByRole('button', { name: 'Hiện đáp án', exact: true }).click();
		await expect(card).toHaveAttribute('data-side', 'answer');
		const answer = (await card.locator('.recall-text').textContent())?.trim();
		expect(answer).toBeTruthy();
		expect(answer).not.toBe(question);

		await page.getByRole('button', { name: 'Tiếp →' }).click();
		await expect(card).toHaveAttribute('data-side', 'question');
		await expect(card.locator('.recall-text')).not.toHaveText(question!);
		await expect(page.getByRole('button', { name: 'Hiện đáp án', exact: true })).toBeVisible();
	});

	test('a learner can open a class deck, flip a card, and continue', async ({ page }) => {
		await page.goto('/lop/hrm-fall-2026?tab=recall', { waitUntil: 'networkidle' });
		const deckLink = page.getByRole('link', { name: /HRM · Lesson 1/i }).first();
		if ((await deckLink.count()) === 0) {
			test.skip(true, 'The class-linked HRM sample deck is not published on this public page.');
			return;
		}
		await expect(deckLink).toBeVisible();
		await deckLink.click();
		await expect(
			page.getByRole('heading', { name: 'HRM · Lesson 1 — Introduction to HRM' }),
		).toBeVisible();
		const card = page.locator('article.recall-card');
		const question = (await card.locator('.recall-text').textContent())?.trim();
		expect(question).toBeTruthy();
		const questionSize = await card
			.locator('.recall-text')
			.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
		expect(questionSize).toBeGreaterThanOrEqual(16);
		expect(questionSize).toBeLessThanOrEqual(32);
		await page.screenshot({
			path: 'test-results/active-recall-class-study.png',
			fullPage: true,
		});
		await page.getByRole('button', { name: 'Hiện đáp án', exact: true }).click();
		await expect(card).toHaveAttribute('data-side', 'answer');
		const answer = (await card.locator('.recall-text').textContent())?.trim();
		expect(answer).toBeTruthy();
		expect(answer).not.toBe(question);

		await page.getByRole('button', { name: 'Tiếp →' }).click();
		await expect(card).toHaveAttribute('data-side', 'question');
		await expect(card.locator('.recall-text')).not.toHaveText(question!);
		await expect(page.getByRole('button', { name: 'Hiện đáp án', exact: true })).toBeVisible();
	});

	test('unknown My Space deck slugs return 404', async ({ page }) => {
		const missing = await page.request.get('/my-space/active-recall/no-such-deck-ever', {
			maxRedirects: 0,
		});
		expect(missing.status()).toBe(404);
	});
});
