import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// ─────────────────────────────────────────────────────────────────────────────
// Cookie prefix + domain derived once at startup.
//
// Deployment topology:
//   Browser ←── HTTPS ──► Nginx (port 443)
//                              │
//                              └── HTTP ──► Next.js (localhost:4000)
//
// Because Next.js itself only sees plain HTTP (from Nginx), Auth.js would
// normally label cookies as non-Secure and use the bare "authjs." prefix.
// But the browser receives everything over HTTPS, so Chrome/Firefox REQUIRE
// the Secure flag — otherwise they silently drop the cookies.
//
// Fix: define every cookie name explicitly with:
//   • secure: true    → adds the Secure attribute so browsers accept them
//   • sameSite: 'lax' → allows the cross-site redirect from accounts.google.com
//   • httpOnly: true  → prevents JS access (security best-practice)
//   • path: '/'
//
// We do NOT use useSecureCookies: true at the top level, because that flag
// also changes the cookie *prefix* to "__Secure-" and relies on Auth.js
// reading back cookies from an HTTPS request — which never arrives at the
// Node process (Nginx terminates TLS). The result is that the PKCE
// code_verifier cookie gets written with the __Secure- prefix but is then
// looked up without it (or vice-versa), producing the
//   [auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed
// error on every Google callback.
// ─────────────────────────────────────────────────────────────────────────────

const secureCookieOptions = {
	secure: true,
	sameSite: 'lax' as const,
	httpOnly: true,
	path: '/',
};

const nextAuth = NextAuth({
	secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true,
	// Do NOT set useSecureCookies here — see explanation above.
	cookies: {
		sessionToken: {
			name: 'authjs.session-token',
			options: secureCookieOptions,
		},
		callbackUrl: {
			name: 'authjs.callback-url',
			options: { ...secureCookieOptions, httpOnly: false },
		},
		csrfToken: {
			name: 'authjs.csrf-token',
			options: { ...secureCookieOptions, httpOnly: false },
		},
		pkceCodeVerifier: {
			name: 'authjs.pkce.code_verifier',
			options: { ...secureCookieOptions, maxAge: 60 * 15 }, // 15-min TTL
		},
		state: {
			name: 'authjs.state',
			options: { ...secureCookieOptions, maxAge: 60 * 15 },
		},
		nonce: {
			name: 'authjs.nonce',
			options: secureCookieOptions,
		},
	},
	providers:
		googleClientId && googleClientSecret
			? [
				Google({
					clientId: googleClientId,
					clientSecret: googleClientSecret,
					authorization: {
						params: {
							// Force PKCE + consent screen every time in prod
							access_type: 'offline',
							prompt: 'select_account',
						},
					},
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
