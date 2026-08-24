import { encode } from 'next-auth/jwt';
import type { BrowserContext } from '@playwright/test';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(config({ path: '.env.local', quiet: true }));

const COOKIE_NAME = 'authjs.session-token';

export async function addAdminSession(context: BrowserContext) {
	const secret = process.env.AUTH_SECRET;
	if (!secret) throw new Error('AUTH_SECRET is required for admin E2E tests');
	const token = await encode({
		secret,
		salt: COOKIE_NAME,
		maxAge: 60 * 60,
		token: {
			sub: 'my-class-e2e-admin',
			email: process.env.ADMIN_EMAIL ?? 'khanhnd2208@gmail.com',
			name: 'My Class E2E Admin',
			role: 'admin',
		},
	});
	await context.addCookies([
		{
			name: COOKIE_NAME,
			value: token,
			url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
			httpOnly: true,
			sameSite: 'Lax',
		},
	]);
}
