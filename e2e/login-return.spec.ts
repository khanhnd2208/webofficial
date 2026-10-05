import { expect, type Page, test } from '@playwright/test';

import { addAdminSession, addStudentSession } from './helpers/adminSession';

/** Long page whose login chip stays fixed, so it can be pressed mid-page. */
const PAGE = '/lien-he?ref=e2e';

/** Keep OAuth assertions deterministic without depending on Google's discovery network. */
async function stubGoogle(page: Page) {
	await page.route('**/api/auth/signin/google*', async (route) => {
		const request = route.request();
		const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		new URL(request.url()).searchParams.forEach((value, key) =>
			authorization.searchParams.set(key, value),
		);
		const callback = new URLSearchParams(request.postData() ?? '').get('callbackUrl') ?? '/';
		const destination = new URL(callback, request.url()).href;
		await route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({ url: authorization.href }),
			headers: {
				'set-cookie': `authjs.callback-url=${encodeURIComponent(destination)}; Path=/; HttpOnly; SameSite=Lax`,
			},
		});
	});
	await page.route('https://accounts.google.com/**', (route) =>
		route.fulfill({ body: '<h1>Google sign-in test</h1>', contentType: 'text/html' }),
	);
}

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
	test('one click opens Google with the live page, query and #section', async ({
		page,
		context,
	}) => {
		await stubGoogle(page);
		await page.goto(`${PAGE}#form`);
		const y = await scrollHalfway(page);
		await page.getByTestId('site-auth-chip').click();

		await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);
		expect(new URL(page.url()).searchParams.has('prompt')).toBe(false);
		const callback = (await context.cookies()).find(
			(cookie) => cookie.name === 'authjs.callback-url',
		);
		expect(decodeURIComponent(callback?.value ?? '')).toContain(`${PAGE}#form`);
		await page.goto('/dang-nhap');

		const saved = await page.evaluate(() => sessionStorage.getItem('auth:return-position'));
		expect(JSON.parse(saved ?? '{}')).toMatchObject({ path: PAGE, y });
	});

	test('an admin lands back on the same page and scroll position', async ({ page, context }) => {
		await stubGoogle(page);
		await page.goto(PAGE);
		const y = await scrollHalfway(page);
		await page.getByTestId('site-auth-chip').click();
		await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);

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

test('www redirects preserve the path and query before an auth gate', async ({ request }) => {
	const response = await request.get('/khoa-hoc/ai50?section=intro', {
		headers: { host: 'www.toiladuykhanh.com' },
		maxRedirects: 0,
	});
	expect(response.status()).toBe(308);
	expect(response.headers().location).toBe('https://toiladuykhanh.com/khoa-hoc/ai50?section=intro');
});

test('the session endpoint renews a signed-in browser cookie for a year', async ({
	context,
	page,
}) => {
	await addStudentSession(context);
	const response = await page.request.get('/api/auth/session');
	expect(response.ok()).toBe(true);
	expect((await response.json()).user.role).toBe('student');
	expect(response.headers()['set-cookie']).toContain(`Max-Age=${365 * 86400}`);
});

test('an embedded browser chip shows opening instructions with the same destination', async ({
	page,
}) => {
	await page.addInitScript(() =>
		Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 Android Zalo/123' }),
	);
	await page.goto(`${PAGE}#form`);
	await page.getByTestId('site-auth-chip').click();
	await expect(page).toHaveURL(/\/dang-nhap\?/);
	expect(new URL(page.url()).searchParams.get('from')).toBe(`${PAGE}#form`);
	await expect(page.getByText(/Bạn đang mở trong Zalo/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sao chép link' })).toBeVisible();
});

test('switching accounts preserves the destination and explicitly asks Google to choose', async ({
	page,
	context,
}) => {
	await addStudentSession(context);
	await page.goto('/dang-nhap');
	await page.getByRole('button', { name: 'Đăng xuất để dùng tài khoản khác' }).click();
	await expect(page).toHaveURL(/\/dang-nhap\?from=%2F&chon=1$/);
	await stubGoogle(page);
	await page.getByRole('button', { name: 'Tiếp tục với Google' }).click();
	await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);
	expect(new URL(page.url()).searchParams.get('prompt')).toBe('select_account');
});

test('a pending cookie renewal cannot undo account-switch sign-out', async ({ page, context }) => {
	await addStudentSession(context);
	await page.goto('/dang-nhap');
	await expect(
		page.getByRole('button', { name: 'Đăng xuất để dùng tài khoản khác' }),
	).toBeEnabled();
	let holding = true;
	let renewals = 0;
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/api/auth/session', async (route) => {
		if (!holding) return route.continue();
		const response = await route.fetch();
		renewals++;
		await gate;
		// The old document's requests should be cancelled when sign-out navigates away.
		await route.fulfill({ response }).catch(() => {});
	});
	await page.evaluate(() => {
		void fetch('/api/auth/session');
	});
	await expect.poll(() => renewals).toBeGreaterThan(0);
	await page.getByRole('button', { name: 'Đăng xuất để dùng tài khoản khác' }).click();
	await expect(page).toHaveURL(/\/dang-nhap\?from=%2F&chon=1$/);
	holding = false;
	release();
	await expect(page.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible();
	expect(await (await page.request.get('/api/auth/session')).json()).toBeNull();
	expect(
		(await context.cookies()).some((cookie) => cookie.name.startsWith('authjs.session-token')),
	).toBe(false);
});
