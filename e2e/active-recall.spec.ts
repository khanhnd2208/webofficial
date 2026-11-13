import { expect, test, type APIResponse } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

async function responseData<T>(response: APIResponse): Promise<T> {
	expect(response.ok()).toBe(true);
	return (await response.json()).data as T;
}

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

	test('a guest can study a shared course without seeing classes or decks from other courses', async ({
		browser,
		context,
		page,
	}, testInfo) => {
		await addAdminSession(context);
		const guest = await browser.newContext({ viewport: { width: 390, height: 844 } });
		const student = await guest.newPage();
		const suffix = Date.now().toString(36);
		const courseName = `Shared recall ${suffix}`;
		const createdCourses: string[] = [];
		const createdDecks: string[] = [];
		const request = page.request;

		async function createCourse(code: string, name: string) {
			const course = await responseData<{ id: string }>(
				await request.post('/api/admin/teaching/courses', {
					data: { courseCode: `${code}${suffix}`, courseName: name },
				}),
			);
			createdCourses.push(`/api/admin/teaching/courses/${course.id}`);
			return course.id;
		}

		async function createDeck(courseId: string, title: string, publish: boolean) {
			const path = `/api/admin/teaching/courses/${courseId}/recall`;
			const deck = await responseData<{ id: string; slug: string; updatedAt: string }>(
				await request.post(path, {
					data: {
						title,
						cards: [{ question: 'Recall question', answer: 'Recall answer' }],
					},
				}),
			);
			createdDecks.push(`${path}/${deck.id}`);
			if (publish) {
				const updated = await request.patch(`${path}/${deck.id}`, {
					data: { status: 'PUBLISHED', expectedUpdatedAt: deck.updatedAt },
				});
				expect(updated.ok()).toBe(true);
			}
			return deck.slug;
		}

		try {
			const courseId = await createCourse('SHARE', courseName);
			const otherId = await createCourse('OTHER', `Other recall ${suffix}`);
			const emptyCoursePath = `/active-recall/${otherId}`;
			expect((await student.request.get(emptyCoursePath)).status()).toBe(404);
			await createDeck(courseId, 'Lecture 10', true);
			const lesson9 = await createDeck(courseId, 'Lecture 9', true);
			const draft = await createDeck(courseId, 'Draft lecture', false);
			const otherDeck = await createDeck(otherId, 'Different course lecture', true);
			const coursePath = `/active-recall/${courseId}`;

			await page.goto(`/my-space/teaching/courses/${courseId}?tab=recall`);
			await expect(page.getByRole('link', { name: 'Mở trang ôn tập' })).toHaveAttribute(
				'href',
				coursePath,
			);
			await page.screenshot({
				path: testInfo.outputPath('recall-sharing-teaching.png'),
				fullPage: true,
			});

			expect((await student.goto(coursePath))?.status()).toBe(200);
			await expect(student.getByRole('heading', { level: 1 })).toHaveText(courseName);
			await expect(student.getByRole('heading', { level: 2 })).toHaveText([
				'Lecture 9',
				'Lecture 10',
			]);
			await expect(student.getByTestId('site-header')).toHaveCount(0);
			await expect(student.locator('a[href^="/lop/"], a[href^="/my-space/teaching"]')).toHaveCount(
				0,
			);
			await student.screenshot({
				path: testInfo.outputPath('recall-course-mobile.png'),
				fullPage: true,
			});

			const studyStarted = student.waitForResponse((response) =>
				response.url().endsWith('/api/active-recall/study/begin'),
			);
			await student.getByRole('link', { name: /Lecture 9/ }).click();
			expect((await studyStarted).ok()).toBe(true);
			await expect(student).toHaveURL(`${coursePath}/${lesson9}`);
			await student.getByRole('button', { name: 'Hiện đáp án', exact: true }).click();
			await expect(student.locator('.recall-text')).toContainText('Recall answer');
			await student.screenshot({
				path: testInfo.outputPath('recall-player-mobile.png'),
				fullPage: true,
			});
			const back = student.getByRole('link', { name: /Các bộ thẻ của môn/ });
			await expect(back).toHaveAttribute('href', coursePath);
			await back.click();
			await expect(student).toHaveURL(coursePath);

			for (const invalidPath of [
				`${coursePath}/${draft}`,
				`${coursePath}/${otherDeck}`,
				'/active-recall/missing-course',
			]) {
				expect((await student.request.get(invalidPath, { maxRedirects: 0 })).status()).toBe(404);
			}
		} finally {
			await guest.close();
			for (const path of createdDecks) await request.delete(path);
			for (const path of createdCourses) await request.delete(path);
		}
	});

	test('unknown My Space deck slugs return 404', async ({ page }) => {
		const missing = await page.request.get('/my-space/active-recall/no-such-deck-ever', {
			maxRedirects: 0,
		});
		expect(missing.status()).toBe(404);
	});
});
