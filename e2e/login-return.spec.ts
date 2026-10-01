import { expect, type Page, test } from '@playwright/test';

import { addAdminSession, addStudentSession } from './helpers/adminSession';

/** Long page whose login chip stays fixed, so it can be pressed mid-page. */
const PAGE = '/lien-he?ref=e2e';

/** Scroll halfway down whatever height the page has and return the offset. */
async function scrollHalfway(page: Page): Promise<number> {
	const y = await page.evaluate(() => {
		const target = Math.floor((document.documentElement.scrollHeight - window.innerHeight) / 2);
		window.scrollTo({ top: target, behavior: 'instant' });
		return Math.round(window.scrollY);
	});
	expect(y).toBeGreaterThan(0);
	return y;
}

test.describe('Sign-in returns to where it started', () => {
	test('the login link carries the live page, query and #section', async ({ page }) => {
		await page.goto(`${PAGE}#form`);
		const y = await scrollHalfway(page);
		await page.getByTestId('site-auth-chip').click();

		await expect(page).toHaveURL(/\/dang-nhap\?/);
		expect(new URL(page.url()).searchParams.get('from')).toBe(`${PAGE}#form`);
		await expect(page.getByText(/Sau khi đăng nhập, bạn sẽ quay lại/)).toBeVisible();

		const saved = await page.evaluate(() => sessionStorage.getItem('auth:return-position'));
		expect(JSON.parse(saved ?? '{}')).toMatchObject({ path: PAGE, y });
	});

	test('an admin lands back on the same page and scroll position', async ({ page, context }) => {
		await page.goto(PAGE);
		const y = await scrollHalfway(page);
		await page.getByTestId('site-auth-chip').click();
		await expect(page).toHaveURL(/\/dang-nhap\?/);

		// Google's round trip ends with a full load of the `from` page, now signed in.
		await addAdminSession(context);
		await page.goto(PAGE);
		await expect(page.getByTestId('site-auth-chip')).toHaveAttribute('data-auth-state', 'admin');
		await expect(page.getByTestId('site-auth-chip')).toContainText('Admin');
		await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(y);
		expect(await page.evaluate(() => sessionStorage.getItem('auth:return-position'))).toBeNull();
	});

	test('opening the login page directly while signed in says so instead of bouncing away', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/dang-nhap');
		await expect(page).toHaveURL(/\/dang-nhap$/);
		await expect(page.getByTestId('login-signed-in')).toContainText('quyền admin');
		await expect(page.getByTestId('login-continue')).toHaveAttribute('href', '/muc-luc');

		// With a destination (a gate or a retry) it goes straight on.
		await page.goto('/dang-nhap?from=%2Fgioi-thieu');
		await expect(page).toHaveURL(/\/gioi-thieu$/);
	});

	test('pages from before sign-in show the account when reached with Back', async ({
		page,
		context,
	}) => {
		await page.goto('/gioi-thieu');
		await expect(page.getByTestId('site-auth-chip')).toHaveAttribute(
			'data-auth-state',
			'signed-out',
		);
		await page.goto('/lien-he');
		await addStudentSession(context);
		await page.goBack();
		await expect(page).toHaveURL(/\/gioi-thieu$/);
		await expect(page.getByTestId('site-auth-chip')).toHaveAttribute(
			'data-auth-state',
			'signed-in',
		);
	});

	test('the account menu signs out and stays on a public page', async ({ page, context }) => {
		await addStudentSession(context);
		await page.goto('/gioi-thieu');
		await page.getByTestId('site-auth-chip').click();
		await page.getByTestId('site-sign-out').click();
		await expect(page).toHaveURL(/\/gioi-thieu$/);
		await expect(page.getByTestId('site-auth-chip')).toHaveAttribute(
			'data-auth-state',
			'signed-out',
		);
	});

	test('a retry after a failed sign-in keeps the original destination', async ({
		page,
		context,
		baseURL,
	}) => {
		await addStudentSession(context);
		await context.addCookies([
			{
				name: 'authjs.callback-url',
				value: `${baseURL}/muc-luc`,
				url: baseURL ?? 'http://localhost:3000',
			},
		]);
		await page.goto('/dang-nhap?error=OAuthCallbackError');
		await expect(page).toHaveURL(/\/muc-luc$/);
	});
});
