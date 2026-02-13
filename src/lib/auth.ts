import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';

import { mongoClientPromise } from '@/lib/mongodbClient';

const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const nextAuth = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	adapter: MongoDBAdapter(mongoClientPromise),
	session: { strategy: 'jwt' },
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
		async jwt({ token, user, profile }) {
			const emailRaw = token.email ?? user?.email ?? (profile as { email?: unknown } | null)?.email;
			const email = typeof emailRaw === 'string' ? emailRaw.toLowerCase() : undefined;

			if (email) {
				token.role = adminEmail && email === adminEmail ? 'admin' : 'student';
			} else if (!token.role) {
				token.role = 'student';
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.role = (token.role as 'admin' | 'student' | undefined) ?? 'student';
			}
			return session;
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
