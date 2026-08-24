import { expect, test } from '@playwright/test';

const course = '/my-space/my-class/hrm-toi-gian';
const lesson = 'hrm-la-gi';
const moduleSlug = 'phan-1-tong-quan';
const unit = 'hrm-sample-l01-s01-k01';

async function noOverflow(page: import('@playwright/test').Page, url: string) {
	await page.goto(url);
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
	expect(overflow).toBe(false);
}

test.describe('My Class learner hierarchy', () => {
	test('catalog and subject preserve the Course → lesson/topic → module hierarchy', async ({ page }) => {
		await page.goto('/my-space/my-class');
		await expect(page.getByRole('heading', { name: 'Môn học' })).toBeVisible();
		await page.goto(course);
		await expect(page).toHaveURL(/\/my-space\/my-class\/hrm-toi-gian\/?$/);
		await expect(page.getByRole('heading', { name: 'HRM tối giản' })).toBeVisible();
		await expect(page.locator('a[href*="/modules/"]').first()).toBeVisible();
		await expect(page.getByRole('link', { name: 'Nội dung', exact: true })).toHaveAttribute('aria-current', 'page');
	});

	test('module opens overview before an idea', async ({ page }) => {
		await page.goto(course);
		const moduleLink = page.locator('a[href*="/modules/"]').first();
		await expect(moduleLink).toBeVisible();
		await moduleLink.click();
		await expect(page.locator('.mc-module-head h1')).toBeVisible();
		await expect(page.getByRole('link', { name: /Bắt đầu module|Tiếp tục module|Xem lại module/ })).toBeVisible();
		await expect(page.locator('a[href*="/hrm-sample-"]').first()).toBeVisible();
	});

	test('legacy deep link remains reachable', async ({ page }) => {
		await page.goto(`${course}?lesson=${lesson}&unit=${unit}`);
		await expect(page).toHaveURL(new RegExp(`${course.replaceAll('/', '\\/')}\\/${lesson}\\/${unit}`));
		await expect(page.getByTestId('knowledge-workspace')).toBeVisible();
	});

	test('workspace uses two explanation modes and module-local navigation', async ({ page }) => {
		await page.goto(`${course}/${lesson}/${unit}?s=${moduleSlug}`);
		await expect(page.getByTestId('knowledge-workspace')).toBeVisible();
		const tabs = page.getByRole('tab');
		const count = await tabs.count();
		if (count === 2) await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByRole('button', { name: 'Đã học & tiếp tục' })).toBeVisible();
	});

	test('review and vocabulary use subject navigation', async ({ page }) => {
		await page.goto(`${course}/review`);
		await expect(page.getByRole('link', { name: 'Ôn tập' })).toHaveAttribute('aria-current', 'page');
		await page.goto(`${course}/vocab`);
		await expect(page.getByRole('heading', { name: 'Từ vựng' })).toBeVisible();
	});

	for (const width of [320, 390, 768, 1024, 1440, 1600]) {
		test(`learner surface has no horizontal overflow at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await noOverflow(page, course);
		});
	}

	test('mobile outline can be opened', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`${course}/${lesson}/${unit}?s=${moduleSlug}`);
		await page.getByRole('button', { name: 'Mục lục' }).click();
		await expect(page.getByRole('complementary', { name: 'Mục lục bài học và module' })).toBeVisible();
	});

	test('missing test returns 404', async ({ request }) => {
		const response = await request.get('/my-space/my-class/missing-course/tests/missing-test');
		expect(response.status()).toBe(404);
	});
});
