import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

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

// Detect local dev: secure cookies break on http://localhost
const isLocalDev = process.env.AUTH_URL?.startsWith('http://');

const secureCookieOptions = {
	httpOnly: true,
	sameSite: 'lax' as const,
	path: '/',
	secure: !isLocalDev,
};

export const authConfig: NextAuthConfig = {
	secret: process.env.AUTH_SECRET,
	session: { strategy: 'jwt' },
	trustHost: true,
	// Same cookie overrides as auth.ts — must match exactly so the middleware
	// can read the session cookie set by the full auth handler.
	cookies: {
		sessionToken: { name: 'authjs.session-token', options: secureCookieOptions },
		callbackUrl: { name: 'authjs.callback-url', options: secureCookieOptions },
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
					checks: ['none'],
				}),
			]
			: [],
	callbacks: {
		// Edge-safe jwt: propagate role from user object into token.
		// The full server-side auth.ts overrides this to also fetch from DB.
		async jwt({ token, user }) {
			if (user) {
				const userRole = (user as { role?: string }).role;
				token.role = (userRole === 'admin' || userRole === 'teacher' || userRole === 'student')
					? userRole
					: 'student';
			} else if (!token.role) {
				token.role = 'student';
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as unknown as Record<string, unknown>).id = token.sub;
				session.user.role = (token.role as 'admin' | 'teacher' | 'student' | undefined) ?? 'student';
			}
			return session;
		},
	},
};
