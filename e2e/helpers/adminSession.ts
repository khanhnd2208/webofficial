import { createHash, randomBytes } from 'node:crypto';
import { encode } from 'next-auth/jwt';
import type { BrowserContext } from '@playwright/test';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(config({ path: '.env.local', quiet: true }));

const COOKIE_NAME = 'authjs.session-token';

async function addSession(
	context: BrowserContext,
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
	// Google sign-in already creates this cookie; fixtures must model that browser state too.
	const csrfToken = randomBytes(32).toString('hex');
	const csrfHash = createHash('sha256').update(`${csrfToken}${secret}`).digest('hex');
	await context.addCookies([
		{
			name: 'authjs.csrf-token',
			value: `${csrfToken}|${csrfHash}`,
			url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
			httpOnly: true,
			sameSite: 'Lax',
		},
		{
			name: COOKIE_NAME,
			value,
			url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
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
