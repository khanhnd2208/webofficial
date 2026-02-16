import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const nextAuth = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true,
	// useSecureCookies: true — The correct setting for HTTPS sites behind Nginx.
	//
	// Flow: Browser ←HTTPS→ Nginx ←HTTP→ Next.js (localhost:4000)
	//
	// Why this works:
	// 1. NEXTAUTH_URL=https://toiladuykhanh.com causes Auth.js reqWithEnvURL()
	//    to rewrite the request URL to https:// before processing
	// 2. Auth.js generates Set-Cookie headers with Secure flag + __Secure- prefix
	// 3. These headers pass through Nginx → browser receives them via HTTPS
	// 4. Browser accepts Secure cookies because the connection IS HTTPS
	// 5. Chrome REQUIRES Secure flag on cookies for HTTPS sites (modern policy)
	//    — non-secure cookies may be silently dropped by Chrome
	//
	// Cookie names: __Secure-authjs.session-token, __Secure-authjs.csrf-token, etc.
	useSecureCookies: true,
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
