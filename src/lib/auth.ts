import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';

import { mongoClientPromise } from '@/lib/mongodbClient';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const nextAuth = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
	trustHost: true, // CRITICAL: Required for production behind reverse proxy
	providers:
		googleClientId && googleClientSecret
			? [
				Google({
					clientId: googleClientId,
					clientSecret: googleClientSecret,
					// Fix PKCE cookie issue behind Nginx reverse proxy
					// Keep state check for CSRF protection, remove pkce check
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
	callbacks: {
		async jwt({ token, user }) {
			// On first sign-in, read role from database
			if (user) {
				const userRole = (user as { role?: string }).role;
				token.role = (userRole === 'admin' || userRole === 'teacher' || userRole === 'student')
					? userRole
					: 'student';
			}
			// On subsequent requests, keep role from token
			else if (!token.role) {
				token.role = 'student';
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as unknown as Record<string, unknown>).id = token.sub;
				session.user.role = (token.role as 'admin' | 'student' | undefined) ?? 'student';
			}
			return session;
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
