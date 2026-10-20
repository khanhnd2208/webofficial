import { createHash, randomBytes } from 'node:crypto';
import { encode } from 'next-auth/jwt';
import { request, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(config({ path: '.env.local', quiet: true }));

const COOKIE_NAME = 'authjs.session-token';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function sessionCookieValues(
	role: 'admin' | 'student',
	token: { sub: string; name: string },
) {
	const secret = process.env.AUTH_SECRET;
	if (!secret) throw new Error('AUTH_SECRET is required for admin E2E tests');
	const value = await encode({
		secret,
		salt: COOKIE_NAME,
		maxAge: 60 * 60,
		token: {
			sub: token.sub,
			email: process.env.ADMIN_EMAIL ?? 'khanhnd2208@gmail.com',
			name: token.name,
			role,
		},
	});
	const csrfToken = randomBytes(32).toString('hex');
	const csrfHash = createHash('sha256').update(`${csrfToken}${secret}`).digest('hex');
	return { session: value, csrf: `${csrfToken}|${csrfHash}` };
}

async function addSession(
	context: BrowserContext,
	role: 'admin' | 'student',
	token: { sub: string; name: string },
) {
	const cookies = await sessionCookieValues(role, token);
	// Google sign-in already creates this cookie; fixtures must model that browser state too.
	await context.addCookies([
		{
			name: 'authjs.csrf-token',
			value: cookies.csrf,
			url: BASE_URL,
			httpOnly: true,
			sameSite: 'Lax',
		},
		{
			name: COOKIE_NAME,
			value: cookies.session,
			url: BASE_URL,
			httpOnly: true,
			sameSite: 'Lax',
		},
	]);
}

export async function addAdminSession(context: BrowserContext) {
	await addSession(context, 'admin', {
		sub: 'my-class-e2e-admin',
		name: 'My Class E2E Admin',
	});
}

export async function addStudentSession(context: BrowserContext) {
	await addSession(context, 'student', {
		sub: 'vocab-store-e2e-student',
		name: 'Vocab Store E2E Student',
	});
}

/** API client with an admin session, independent of a page that may already be closed. */
export async function createAdminRequest(): Promise<APIRequestContext> {
	const cookies = await sessionCookieValues('admin', {
		sub: 'my-class-e2e-admin',
		name: 'My Class E2E Admin',
	});
	return request.newContext({
		baseURL: BASE_URL,
		extraHTTPHeaders: {
			Cookie: `${COOKIE_NAME}=${cookies.session}; authjs.csrf-token=${cookies.csrf}`,
		},
	});
}
