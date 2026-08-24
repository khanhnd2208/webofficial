import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

type Deck = {
	id: string;
	title: string;
	updatedAt: string;
	cards: Array<{ id: string; question: string; answer: string }>;
};

test.describe('Active Recall admin API', () => {
	test('creates, previews/imports, publishes, rejects a stale save, and archives a deck', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const slug = `active-recall-e2e-${Date.now().toString(36)}`;
		const created = await page.request.post('/api/admin/active-recall', {
			data: { title: 'Active Recall E2E', slug, status: 'DRAFT' },
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: Deck };
		let deck = createdBody.data;

		try {
			const dryRun = await page.request.post(
				`/api/admin/active-recall/${deck.id}/import?dryRun=1&mode=append`,
				{
					data: { text: 'Q: What is a smoke test?\nA: A fast confidence check.', mode: 'append' },
				},
			);
			expect(dryRun.ok()).toBe(true);
			expect(await dryRun.json()).toMatchObject({ data: { summary: { valid: 1, invalid: 0 } } });

			const imported = await page.request.post(`/api/admin/active-recall/${deck.id}/import`, {
				data: {
					text: 'Q: What is a smoke test?\nA: A fast confidence check.',
					mode: 'append',
					expectedUpdatedAt: deck.updatedAt,
				},
			});
			expect(imported.ok()).toBe(true);
			deck = ((await imported.json()) as { data: { deck: Deck } }).data.deck;

			const published = await page.request.patch(`/api/admin/active-recall/${deck.id}`, {
				data: {
					title: deck.title,
					slug,
					subject: '',
					lessonLabel: '',
					description: '',
					status: 'PUBLISHED',
					expectedUpdatedAt: deck.updatedAt,
					cards: deck.cards,
				},
			});
			expect(published.ok()).toBe(true);
			const publishedDeck = ((await published.json()) as { data: Deck }).data;

			const stale = await page.request.patch(`/api/admin/active-recall/${deck.id}`, {
				data: {
					title: deck.title,
					slug,
					subject: '',
					lessonLabel: '',
					description: '',
					status: 'PUBLISHED',
					expectedUpdatedAt: deck.updatedAt,
					cards: publishedDeck.cards,
				},
			});
			expect(stale.status()).toBe(409);
		} finally {
			await page.request.delete(`/api/admin/active-recall/${deck.id}`);
		}
	});
});
