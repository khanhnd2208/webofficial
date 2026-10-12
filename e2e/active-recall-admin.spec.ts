import { expect, test, type APIRequestContext } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

type Deck = {
	id: string;
	title: string;
	updatedAt: string;
	cards: Array<{ id: string; question: string; answer: string }>;
};

async function archiveDeck(request: APIRequestContext, url: string) {
	const current = await request.get(url);
	if (!current.ok()) return;
	const body = (await current.json()) as { data: { updatedAt: string } };
	await request.patch(url, {
		data: { status: 'ARCHIVED', expectedUpdatedAt: body.data.updatedAt },
	});
}

test.describe('Active Recall admin API', () => {
	test('deletes a populated deck after a three-second admin confirmation', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const createdCourse = await page.request.post('/api/admin/teaching/courses', {
			data: {
				courseCode: `DEL${suffix}`.slice(0, 10).toUpperCase(),
				courseName: `Recall deletion E2E ${suffix}`,
			},
		});
		expect(createdCourse.ok()).toBe(true);
		const courseId = ((await createdCourse.json()) as { data: { id: string } }).data.id;
		let deckId: string | undefined;

		try {
			const createdDeck = await page.request.post(
				`/api/admin/teaching/courses/${courseId}/recall`,
				{
					data: {
						title: `Delete me ${suffix}`,
						status: 'DRAFT',
						cards: [{ question: 'Question to delete', answer: 'Answer to delete' }],
					},
				},
			);
			expect(createdDeck.ok()).toBe(true);
			deckId = ((await createdDeck.json()) as { data: { id: string } }).data.id;

			await page.goto(`/my-space/teaching/courses/${courseId}?tab=recall`);
			await page.getByRole('button', { name: `Thao tác bộ thẻ Delete me ${suffix}` }).click();
			await page.getByRole('menuitem', { name: 'Xóa vĩnh viễn' }).click();

			const lockedDelete = page.getByRole('button', { name: 'Xóa vĩnh viễn (3 giây)' });
			await expect(lockedDelete).toBeDisabled();
			await expect(
				page.getByText(
					`Xóa vĩnh viễn “Delete me ${suffix}” cùng 1 thẻ và gỡ bộ thẻ khỏi 0 lớp? Thao tác này không thể hoàn tác.`,
				),
			).toBeVisible();
			if (process.env.ACTIVE_RECALL_DELETE_SCREENSHOT) {
				await page.screenshot({
					path: process.env.ACTIVE_RECALL_DELETE_SCREENSHOT,
					fullPage: true,
				});
			}

			const enabledDelete = page.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true });
			await expect(enabledDelete).toBeEnabled({ timeout: 4_500 });
			await enabledDelete.click();

			await expect(page.getByText(`Delete me ${suffix}`)).toHaveCount(0);
			const deleted = await page.request.get(
				`/api/admin/teaching/courses/${courseId}/recall/${deckId}`,
			);
			expect(deleted.status()).toBe(404);
			deckId = undefined;
		} finally {
			if (deckId) {
				await page.request.delete(`/api/admin/teaching/courses/${courseId}/recall/${deckId}`);
			}
			await page.request.delete(`/api/admin/teaching/courses/${courseId}`);
		}
	});

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
			await archiveDeck(page.request, `/api/admin/active-recall/${deck.id}`);
		}
	});

	test('creates a course-owned deck and lets a class enable it', async ({ page, context }) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const createdClass = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `AR${suffix}`.slice(0, 10),
				courseName: 'Active Recall Course E2E',
				groupNo: '91',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(createdClass.ok()).toBe(true);
		const teachingClass = (await createdClass.json()) as {
			data: { id: string; courseId: string };
		};
		const classId = teachingClass.data.id;
		const courseId = teachingClass.data.courseId;
		let deckId: string | undefined;

		try {
			const createdDeck = await page.request.post(
				`/api/admin/teaching/courses/${courseId}/recall`,
				{
					data: { title: 'Course Recall E2E', slug: `course-recall-${suffix}`, status: 'DRAFT' },
				},
			);
			expect(createdDeck.ok()).toBe(true);
			const deck = ((await createdDeck.json()) as { data: Deck }).data;
			deckId = deck.id;
			const deckApi = `/api/admin/teaching/courses/${courseId}/recall/${deck.id}`;
			const wrongCourse = await page.request.get(
				`/api/admin/teaching/courses/not-this-course/recall/${deck.id}`,
			);
			expect(wrongCourse.status()).toBe(404);

			const imported = await page.request.post(`${deckApi}/import`, {
				data: {
					text: 'Q: What belongs to a course?\nA: Shared Active Recall decks.',
					mode: 'append',
					expectedUpdatedAt: deck.updatedAt,
				},
			});
			expect(imported.ok()).toBe(true);
			const importedDeck = ((await imported.json()) as { data: { deck: Deck } }).data.deck;

			const published = await page.request.patch(deckApi, {
				data: {
					title: importedDeck.title,
					slug: `course-recall-${suffix}`,
					subject: '',
					lessonLabel: '',
					description: '',
					status: 'PUBLISHED',
					expectedUpdatedAt: importedDeck.updatedAt,
					cards: importedDeck.cards,
				},
			});
			expect(published.ok()).toBe(true);
			const publishedDeck = ((await published.json()) as { data: Deck }).data;

			const listed = await page.request.get(`/api/admin/teaching/classes/${classId}/recall`);
			expect(listed.ok()).toBe(true);
			const assignments = (
				(await listed.json()) as { data: Array<{ deckId: string; enabled: boolean }> }
			).data;
			expect(assignments).toEqual([expect.objectContaining({ deckId: deck.id, enabled: true })]);

			const disabled = await page.request.put(`/api/admin/teaching/classes/${classId}/recall`, {
				data: { assignments: [{ deckId: deck.id, enabled: false, displayOrder: 0 }] },
			});
			expect(disabled.ok()).toBe(true);
			expect(((await disabled.json()) as { data: Array<{ enabled: boolean }> }).data).toEqual([
				expect.objectContaining({ deckId: deck.id, enabled: false }),
			]);

			const edited = await page.request.patch(deckApi, {
				data: {
					title: 'Course Recall E2E edited',
					slug: `course-recall-${suffix}`,
					subject: '',
					lessonLabel: '',
					description: '',
					status: 'PUBLISHED',
					expectedUpdatedAt: publishedDeck.updatedAt,
					cards: publishedDeck.cards,
				},
			});
			expect(edited.ok()).toBe(true);
			const afterEdit = await page.request.get(`/api/admin/teaching/classes/${classId}/recall`);
			expect(((await afterEdit.json()) as { data: Array<{ enabled: boolean }> }).data).toEqual([
				expect.objectContaining({ deckId: deck.id, enabled: false }),
			]);
		} finally {
			if (deckId) {
				await archiveDeck(page.request, `/api/admin/teaching/courses/${courseId}/recall/${deckId}`);
			}
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('round-trips nested underline and color through import and export', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const slug = `recall-format-${Date.now().toString(36)}`;
		const created = await page.request.post('/api/admin/active-recall', {
			data: { title: 'Format round trip', slug, status: 'DRAFT' },
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: Deck };
		let deck = createdBody.data;

		try {
			const text =
				'Q: What is <u><span style="color: #dc2626">HRM</span></u>?\nA: <strong>Human</strong> <em>resources</em> and 2 * 3 * 4';
			const imported = await page.request.post(`/api/admin/active-recall/${deck.id}/import`, {
				data: { text, mode: 'append', expectedUpdatedAt: deck.updatedAt },
			});
			expect(imported.ok()).toBe(true);
			deck = ((await imported.json()) as { data: { deck: Deck } }).data.deck;
			expect(deck.cards[0]?.question).toContain('<u><span style="color: #dc2626">HRM</span></u>');
			expect(deck.cards[0]?.answer).toContain('<strong>Human</strong> <em>resources</em>');
			expect(deck.cards[0]?.answer).toContain('2 * 3 * 4');
			expect(JSON.stringify(deck.cards)).not.toContain('\\u0000');
		} finally {
			await archiveDeck(page.request, `/api/admin/active-recall/${deck.id}`);
		}
	});
});
