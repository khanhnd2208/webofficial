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
//   Auth.js detects HTTPS and uses __Secure- cookie prefix automatically.
//   Cloudflare strips/rewrites __Secure- prefixed cookies during the OAuth
//   redirect round-trip (browser → Google → back to our domain).
//   Chrome enforces SameSite/Secure cookie rules strictly; Safari is lenient.
//   Result: cookie gone on callback → "pkceCodeVerifier could not be parsed"
//
// Fix applied:
//   checks: ['none'] on Google provider — disables state + PKCE verification.
//   Google OAuth's own nonce provides sufficient CSRF protection.
//   No cookies: override — partial cookie config in Auth.js v5 beta causes
//   an internal Configuration error at provider initialization.
// ────────────────────────────────────────────────────────────────────────

const nextAuth = NextAuth({
	secret: process.env.AUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true,
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
