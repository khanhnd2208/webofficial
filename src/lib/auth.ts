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
	providers:
		googleClientId && googleClientSecret
			? [
				Google({
					clientId: googleClientId,
					clientSecret: googleClientSecret,
					// Use state-only checks instead of PKCE.
					// PKCE requires cookie round-trips that break under Nginx reverse
					// proxy when Auth.js derives an inconsistent "salt" URL between
					// the sign-in request and the Google callback request.
					// State-based CSRF protection is fully secure for server-side flows.
					checks: ['state'],
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
