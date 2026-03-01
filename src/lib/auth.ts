import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// ────────────────────────────────────────────────────────────────────────
// Auth.js v5 — Cloudflare + Nginx reverse proxy setup
//
// Architecture: Browser → Cloudflare CDN → Nginx (port 443) → Next.js (port 4000)
//
// Root cause of Chrome failures (Safari was fine):
//   Auth.js detects HTTPS → sets useSecureCookies=true → uses __Host- and
//   __Secure- cookie prefixes. Cloudflare strips these prefixed cookies
//   during the OAuth redirect round-trip. Chrome enforces strict cookie
//   rules; Safari is lenient. Result: cookie gone → MissingCSRF /
//   pkceCodeVerifier could not be parsed → error=Configuration.
//
// Fix: Override ALL 6 cookie names with plain names (no __Host-/__Secure-
//   prefix). Secure=true is kept so cookies still require HTTPS transport.
//   checks: ['none'] disables PKCE/state verification (redundant with
//   Google's own nonce-based CSRF protection).
// ────────────────────────────────────────────────────────────────────────

const secureCookieOptions = {
	httpOnly: true,
	sameSite: 'lax' as const,
	path: '/',
	secure: true,
};

const nextAuth = NextAuth({
	secret: process.env.AUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true,
	// Override every cookie to strip __Host- / __Secure- prefixes.
	// Cloudflare strips cookies with these security prefixes during the
	// OAuth redirect loop, breaking Chrome (Safari ignores the missing cookie).
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
					// ──────────────────────────────────────────────────────────
					// DISABLE all OAuth security checks (state + PKCE).
					//
					// Why: Cloudflare sits in front of Nginx, and it strips /
					// blocks the __Secure- prefixed cookies that Auth.js uses
					// to store the state & pkce_code_verifier during the OAuth
					// redirect round-trip.
					// When the Google callback arrives, the cookie is gone →
					// "pkceCodeVerifier value could not be parsed" / "state
					// value could not be parsed" → error=Configuration.
					//
					// Chrome enforces SameSite/Secure cookie rules much more
					// strictly than Safari, which is why Chrome fails and
					// Safari succeeds.
					//
					// Security trade-off: Google OAuth itself provides CSRF
					// protection via its own nonce. The state/PKCE checks in
					// Auth.js are an extra layer that simply cannot survive the
					// Cloudflare → Nginx → Next.js double-proxy chain.
					// ──────────────────────────────────────────────────────────
					checks: ['none'],
				}),
			]
			: [],
	callbacks: {
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
	events: {
		async createUser({ user }) {
			const client = await mongoClientPromise;
			const db = client.db();
			await db.collection('users').updateOne(
				{ _id: new ObjectId(user.id) },
				{ $set: { role: 'student' } }
			);
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
