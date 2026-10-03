import { Auth } from '@auth/core';
import { decode, encode } from 'next-auth/jwt';
import { describe, expect, it } from 'vitest';

import { authConfig } from '@/lib/auth.config';
import { SESSION_MAX_AGE_SECONDS } from './sessionLifetime';

const secret = 'session-renewal-test-secret';
const salt = 'authjs.session-token';

async function fetchSession(token: string) {
	return Auth(
		new Request('http://localhost/api/auth/session', {
			headers: { cookie: `${salt}=${token}` },
		}),
		{
			...authConfig,
			secret,
			basePath: '/api/auth',
			logger: { error() {} },
			providers: [],
			cookies: {
				...authConfig.cookies,
				sessionToken: {
					name: salt,
					options: { ...authConfig.cookies?.sessionToken?.options, secure: false },
				},
			},
		},
	);
}

describe('rolling Google sessions', () => {
	it('renews an unexpired legacy token even when sign-in was more than seven days ago', async () => {
		const now = Math.floor(Date.now() / 1000);
		const token = await encode({
			secret,
			salt,
			maxAge: 3600,
			token: {
				sub: 'student',
				email: 'student@example.com',
				role: 'student',
				signedInAt: now - 30 * 86400,
			},
		});
		const response = await fetchSession(token);
		expect((await response.json()).user.id).toBe('student');
		const cookie = response.headers.get('set-cookie') ?? '';
		expect(cookie).toContain(`Max-Age=${365 * 86400}`);
		const renewed = cookie.match(/authjs.session-token=([^;]+)/)?.[1];
		expect(renewed).toBeTruthy();
		const payload = await decode({ secret, salt, token: renewed });
		expect(payload?.exp).toBeGreaterThanOrEqual(now + SESSION_MAX_AGE_SECONDS);
	});

	it('does not revive an expired JWT', async () => {
		const token = await encode({ secret, salt, maxAge: -60, token: { sub: 'student' } });
		const response = await fetchSession(token);
		expect(await response.json()).toBeNull();
		expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
	});
});
