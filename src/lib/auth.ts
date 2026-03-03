import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';
import { authConfig } from '@/lib/auth.config';

// ────────────────────────────────────────────────────────────────────────
// Auth.js v5 — Full server-side auth (Node.js runtime only).
//
// Extends authConfig (edge-safe) with the MongoDB adapter.
// Overrides the jwt callback to fetch role from database on sign-in.
//
// IMPORTANT: callbacks are merged manually to preserve the session
// callback from authConfig. A naive spread `{ ...authConfig, callbacks }`
// would replace the entire callbacks object.
//
// middleware.ts uses auth.config.ts directly (no MongoDB, edge-safe).
// ────────────────────────────────────────────────────────────────────────

/** Emails that always get admin role on first sign-up */
const ADMIN_EMAILS = [
	'khanhnd2208@gmail.com',
	process.env.ADMIN_EMAIL,
].filter(Boolean) as string[];

const nextAuth = NextAuth({
	...authConfig,
	adapter: MongoDBAdapter(mongoClientPromise),
	callbacks: {
		// Preserve session callback from authConfig
		...authConfig.callbacks,

		// Server-side jwt: on sign-in, always fetch the real role from MongoDB.
		// On subsequent token refreshes (no `user`), keep the role already in token.
		async jwt({ token, user, trigger }) {
			if (user) {
				// Sign-in: user is present. Fetch role from database for accuracy.
				try {
					const client = await mongoClientPromise;
					const db = client.db();
					const dbUser = await db.collection('users').findOne(
						{ _id: new ObjectId(user.id!) },
						{ projection: { role: 1 } }
					);
					token.role = dbUser?.role ?? 'student';
				} catch {
					// DB unreachable — fallback to admin-email check
					token.role = user.email && ADMIN_EMAILS.includes(user.email) ? 'admin' : 'student';
				}
			} else if (trigger === 'update') {
				// Session update triggered (e.g. after role change) — re-fetch from DB
				try {
					const client = await mongoClientPromise;
					const db = client.db();
					const dbUser = await db.collection('users').findOne(
						{ _id: new ObjectId(token.sub!) },
						{ projection: { role: 1 } }
					);
					if (dbUser?.role) token.role = dbUser.role;
				} catch {
					// keep existing token.role
				}
			}
			// On normal refresh (neither user nor trigger=update), token.role persists as-is.
			if (!token.role) token.role = 'student';
			return token;
		},
	},
	events: {
		async createUser({ user }) {
			// New user created via OAuth — set role in database
			const client = await mongoClientPromise;
			const db = client.db();
			const role = user.email && ADMIN_EMAILS.includes(user.email) ? 'admin' : 'student';
			await db.collection('users').updateOne(
				{ _id: new ObjectId(user.id!) },
				{ $set: { role } }
			);
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
