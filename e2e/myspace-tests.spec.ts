import { test, expect } from '@playwright/test';

test.describe('My Space Tests quiz play', () => {
	test('subject explorer shows tests and play starts from list', async ({ page }) => {
		test.setTimeout(90_000);

		await page.goto('/my-space/tests', { waitUntil: 'networkidle' });
		// Prefer the visible page — Next.js streaming can leave a hidden Suspense twin
		const testsPage = page.locator('[data-testid="myspace-tests"]:visible');
		await expect(testsPage).toBeVisible();
		await expect(
			testsPage.getByText(/Pick a subject, then a test/i),
		).toBeVisible();

		await expect(testsPage.getByTestId('myspace-subject-explorer')).toBeVisible();
		await expect(testsPage.getByTestId('myspace-subjects-nav')).toBeVisible();

		const subjects = testsPage
			.getByTestId('myspace-subjects-nav')
			.getByTestId(/myspace-subject-\d+/);
		await expect(subjects.first()).toBeVisible();

		const subjectCount = await subjects.count();
		// Prefer a later subject when available — sample quizzes are shorter than full chapter banks
		if (subjectCount > 1) {
			await subjects.nth(1).click();
			await expect(testsPage.getByTestId('myspace-subject-panel')).toBeVisible();
		}

		const list = testsPage.getByTestId('myspace-tests-list');
		await expect(list).toBeVisible();
		const start = list.getByRole('link', { name: /Start/i }).first();
		if ((await start.count()) === 0) {
			test.skip(true, 'No published tests available');
			return;
		}

		await start.click();
		const play = page.locator('[data-testid="myspace-quiz-play"]:visible');
		await expect(play).toBeVisible();

		// Question grid is collapsed by default — open it before asserting progress cells
		const navToggle = play.getByTestId('myspace-quiz-nav-toggle');
		await expect(navToggle).toBeVisible();
		await navToggle.click();
		await expect(play.getByTestId('myspace-progress-1').first()).toBeVisible();

		await play.getByTestId('myspace-option-A').click();
		const feedback = play.getByTestId('myspace-answer-feedback');
		await expect(feedback).toBeVisible();
		await expect(feedback).toContainText(/Correct|Incorrect/);

		const q1 = play.getByTestId('myspace-progress-1').first();
		await expect(q1).toHaveAttribute('aria-label', /Question 1, (correct|incorrect)/);

		const nextBtn = play.getByTestId('myspace-quiz-next');
		await expect(nextBtn).toBeEnabled();

		const firstNextLabel = (await nextBtn.textContent()) ?? '';
		if (firstNextLabel.includes('Next')) {
			await nextBtn.click();
			await expect(play.getByText(/Question 2 \//).first()).toBeVisible();

			const prevBtn = play.getByTestId('myspace-quiz-prev');
			await expect(prevBtn).toBeEnabled();
			await prevBtn.click();
			await expect(play.getByText(/Question 1 \//).first()).toBeVisible();
			await expect(play.getByTestId('myspace-answer-feedback')).toBeVisible();

			for (;;) {
				const playVisible = page.locator('[data-testid="myspace-quiz-play"]:visible');
				if ((await playVisible.count()) === 0) break;

				await expect(playVisible.getByTestId('myspace-option-A')).toHaveCount(1);

				const next = playVisible.getByTestId('myspace-quiz-next');
				const needsAnswer = await next.isDisabled();
				if (needsAnswer) {
					await playVisible.getByTestId('myspace-option-A').click();
					await expect(playVisible.getByTestId('myspace-answer-feedback')).toBeVisible();
					await expect(next).toBeEnabled({ timeout: 10_000 });
				}

				const label = (await next.textContent()) ?? '';
				await next.click();
				if (label.includes('Submit')) break;
			}
		} else {
			await nextBtn.click();
		}

		await expect(page.locator('[data-testid="myspace-quiz-result"]:visible')).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
	});
});
