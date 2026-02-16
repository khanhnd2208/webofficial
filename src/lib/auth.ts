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
	// CRITICAL: Force useSecureCookies=false for Nginx HTTPS→HTTP reverse proxy.
	// Behind Nginx, the Next.js app receives HTTP requests (localhost:4000),
	// so Auth.js internal url.protocol = "http:".
	// If secure=true, cookies get __Secure- prefix which requires Secure flag,
	// but the Set-Cookie response goes through HTTP internally, causing
	// browsers to reject or mishandle the cookie on the round-trip.
	// Since Nginx handles HTTPS termination, the cookie is still sent over
	// HTTPS between browser↔Nginx. This is safe.
	useSecureCookies: false,
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
