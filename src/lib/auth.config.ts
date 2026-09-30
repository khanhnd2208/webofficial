import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { resolveAuthJsRedirect } from '@/lib/auth/safeRedirect';

/**
 * Edge-safe Auth.js config — NO Node.js-only imports (no MongoDB, no mongoose).
 *
 * Used exclusively by middleware (edge runtime). The full auth.ts config
 * (which includes MongoDBAdapter) is used only in Node.js server contexts
 * (API routes, server components).
 *
 * Auth.js v5 pattern: https://authjs.dev/guides/edge-compatibility
 */

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Auth.js stores the post-sign-in destination here while Google is open. */
export const AUTH_CALLBACK_URL_COOKIE = 'authjs.callback-url';

// Detect local dev: secure cookies break on http://localhost
const isLocalDev = process.env.AUTH_URL?.startsWith('http://');

/** Custom page paths for Auth.js */
const pages = {
	signIn: '/dang-nhap',
	error: '/dang-nhap',
};

const secureCookieOptions = {
	httpOnly: true,
	sameSite: 'lax' as const,
	path: '/',
	secure: !isLocalDev,
};

const sessionTokenCookieOptions = {
	...secureCookieOptions,
	maxAge: SESSION_MAX_AGE_SECONDS,
};

export const authConfig: NextAuthConfig = {
	secret: process.env.AUTH_SECRET,
	pages,
	session: {
		strategy: 'jwt',
		maxAge: SESSION_MAX_AGE_SECONDS,
		updateAge: 24 * 60 * 60,
	},
	jwt: {
		maxAge: SESSION_MAX_AGE_SECONDS,
	},
	trustHost: true,
	// Same cookie overrides as auth.ts — must match exactly so the middleware
	// can read the session cookie set by the full auth handler.
	cookies: {
		sessionToken: { name: 'authjs.session-token', options: sessionTokenCookieOptions },
		callbackUrl: { name: AUTH_CALLBACK_URL_COOKIE, options: secureCookieOptions },
		csrfToken: { name: 'authjs.csrf-token', options: secureCookieOptions },
		pkceCodeVerifier: { name: 'authjs.pkce.code_verifier', options: secureCookieOptions },
		state: { name: 'authjs.state', options: secureCookieOptions },
		nonce: { name: 'authjs.nonce', options: secureCookieOptions },
	},
	providers:
		googleClientId && googleClientSecret
			? [
					Google({
						clientId: googleClientId,
						clientSecret: googleClientSecret,
					}),
				]
			: [],
	callbacks: {
		async redirect({ url, baseUrl }) {
			return resolveAuthJsRedirect(url, baseUrl);
		},
		// Edge-safe jwt: propagate role from user object into token.
		// The full server-side auth.ts overrides this to also fetch from DB.
		async jwt({ token, user }) {
			if (user) {
				const userRole = (user as { role?: string }).role;
				// 'teacher' was a legacy role; normalize to 'student'.
				token.role = userRole === 'admin' ? 'admin' : 'student';
			} else if (!token.role || String(token.role) === 'teacher') {
				token.role = 'student';
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as unknown as Record<string, unknown>).id = token.sub;
				session.user.role = (token.role === 'admin' ? 'admin' : 'student') as 'admin' | 'student';
			}
			return session;
		},
	},
};
