import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const nextAuth = NextAuth({
	secret: process.env.AUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	// trustHost: true is critical when running behind Nginx reverse proxy.
	// Auth.js reads X-Forwarded-Proto: https from Nginx and automatically
	// uses __Secure- cookie prefix and Secure flag — do not fight it.
	trustHost: true,
	// ────────────────────────────────────────────────────────────────────────
	// HARDCODED COOKIE NAMES — Fixes "split personality" bug in Auth.js v5 beta.
	//
	// Problem: Auth.js v5 behind Nginx reverse proxy has inconsistent behavior:
	//   • When WRITING cookies: sees AUTH_URL=https://... → adds __Secure- prefix
	//   • When READING cookies: receives HTTP from Nginx → looks for plain names
	//   Result: Write "__Secure-authjs.state", read "authjs.state" → not found
	//
	// Solution: Explicitly define every cookie with plain names + secure:true flag.
	// This ensures symmetric write/read behavior while keeping Chrome happy.
	// ────────────────────────────────────────────────────────────────────────
	cookies: {
		sessionToken: {
			name: 'authjs.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
			},
		},
		callbackUrl: {
			name: 'authjs.callback-url',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
			},
		},
		csrfToken: {
			name: 'authjs.csrf-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
			},
		},
		pkceCodeVerifier: {
			name: 'authjs.pkce.code_verifier',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
				maxAge: 60 * 15, // 15 minutes
			},
		},
		state: {
			name: 'authjs.state',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
				maxAge: 60 * 15, // 15 minutes
			},
		},
		nonce: {
			name: 'authjs.nonce',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: true,
			},
		},
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
