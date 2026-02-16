import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Cookie security: production (HTTPS) uses '__Secure-' prefix
// This MUST be consistent across auth.ts, proxy.ts, and apiAuth.ts
export const useSecureCookies = process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

const nextAuth = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true, // Required for production behind reverse proxy (Nginx)
	providers:
		googleClientId && googleClientSecret
			? [
				Google({
					clientId: googleClientId,
					clientSecret: googleClientSecret,
					// Use 'state' check — PKCE cookie gets lost through Nginx HTTPS→HTTP proxy
					checks: ['state'],
					authorization: {
						params: {
							prompt: 'consent',
							access_type: 'offline',
							response_type: 'code',
						},
					},
				}),
			]
			: [],
	// Explicit cookie config to ensure cookies work correctly
	// behind Nginx reverse proxy (HTTPS → HTTP localhost)
	cookies: {
		sessionToken: {
			name: `${cookiePrefix}authjs.session-token`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
		},
		callbackUrl: {
			name: `${cookiePrefix}authjs.callback-url`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
		},
		csrfToken: {
			name: `${cookiePrefix}authjs.csrf-token`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
		},
		state: {
			name: `${cookiePrefix}authjs.state`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
		},
		nonce: {
			name: `${cookiePrefix}authjs.nonce`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
		},
		pkceCodeVerifier: {
			name: `${cookiePrefix}authjs.pkce.code_verifier`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies, maxAge: 900 },
		},
	},
	callbacks: {
		async jwt({ token, user }) {
			// On first sign-in or user update, sync role from database
			if (user) {
				const userRole = (user as { role?: string }).role;
				token.role = (userRole === 'admin' || userRole === 'teacher' || userRole === 'student')
					? userRole
					: 'student';
			}
			// On subsequent requests, preserve role
			else if (!token.role) {
				token.role = 'student';
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				// Map MongoDB _id to user.id
				(session.user as unknown as Record<string, unknown>).id = token.sub;
				session.user.role = (token.role as 'admin' | 'teacher' | 'student' | undefined) ?? 'student';
			}
			return session;
		},
	},
	events: {
		async createUser({ user }) {
			// Ensure all new users have the 'student' role by default
			// This is critical because MongoDBAdapter doesn't apply Mongoose defaults
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
