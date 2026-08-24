import { devices, expect, test } from '@playwright/test';

test.describe('My Space Tests Learning Workspace', () => {
	test('desktop: search, switch subject, open history affordances, start quiz', async ({
		page,
	}) => {
		test.setTimeout(90_000);
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/my-space/tests', { waitUntil: 'networkidle' });

		const testsPage = page.locator('[data-testid="myspace-tests"]:visible');
		await expect(testsPage).toBeVisible();
		await expect(testsPage.getByRole('heading', { name: 'Bài kiểm tra' })).toBeVisible();
		await expect(testsPage.getByTestId('myspace-subject-rail')).toBeVisible();
		await expect(testsPage.getByTestId('myspace-test-search')).toBeVisible();

		const start = testsPage.getByTestId(/myspace-test-start-/).first();
		if ((await start.count()) === 0) {
			test.skip(true, 'No published tests available');
			return;
		}

		const subjectFilter = testsPage.getByTestId(/myspace-subject-filter-/).nth(2);
		await subjectFilter.click();
		await expect(page).toHaveURL(/\?subject=/);

		await testsPage.getByTestId('myspace-test-search').fill('zzz-no-match-e2e');
		await expect(testsPage.getByTestId('myspace-tests-empty')).toBeVisible();
		await testsPage.getByTestId('myspace-tests-clear-filters').click();

		const quizStart = testsPage.getByTestId('myspace-test-start-principles-of-management-sample');
		await expect(quizStart).toBeVisible();
		await quizStart.click();
		const play = page.locator('[data-testid="myspace-quiz-play"]:visible');
		await expect(play).toBeVisible();

		for (let i = 0; i < 20; i += 1) {
			const result = page.locator('[data-testid="myspace-quiz-result"]:visible');
			if (await result.count()) break;
			const option = play.locator('button[data-testid="myspace-option-A"]:not([disabled])').last();
			if ((await option.count()) === 0) {
				await page.waitForTimeout(500);
				continue;
			}
			await option.click();
			const next = play.getByTestId('myspace-quiz-next');
			await expect(next).toBeEnabled({ timeout: 10_000 });
			await next.click();
		}

		const result = page.locator('[data-testid="myspace-quiz-result"]:visible');
		await expect(result).toBeVisible();
		await expect(result.getByRole('button', { name: 'Try again' })).toBeVisible();
		await result.getByRole('link', { name: /Tests/i }).click();
		await expect(page).toHaveURL(/\/my-space\/tests/);
		await expect(page.getByTestId('myspace-test-status-principles-of-management-sample')).toHaveText(/Đã làm/);
		await expect(page.getByTestId('myspace-test-start-principles-of-management-sample')).toHaveText(/Làm lại/);
		await page.getByTestId('myspace-test-history-toggle-principles-of-management-sample').click();
		await expect(page.getByTestId('myspace-test-history-principles-of-management-sample')).toBeVisible();
	});

	test('mobile: subject sheet supports escape and returns focus', async ({ browser }) => {
		test.setTimeout(90_000);
		const context = await browser.newContext({
			...devices['iPhone 13'],
		});
		const page = await context.newPage();
		await page.goto('/my-space/tests', { waitUntil: 'networkidle' });

		const testsPage = page.locator('[data-testid="myspace-tests"]:visible');
		await expect(testsPage).toBeVisible();

		const picker = testsPage.getByTestId('myspace-subject-picker');
		await expect(picker).toBeVisible();
		await picker.focus();
		await picker.click();
		await expect(page.getByRole('dialog', { name: /Chọn môn học/i })).toBeVisible();
		await expect(page.getByTestId('myspace-subject-search-sheet')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: /Chọn môn học/i })).toHaveCount(0);
		await expect(picker).toBeFocused();

		const start = testsPage.getByTestId(/myspace-test-start-/).first();
		if ((await start.count()) > 0) {
			const box = await start.boundingBox();
			expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
		}

		await context.close();
	});
});
