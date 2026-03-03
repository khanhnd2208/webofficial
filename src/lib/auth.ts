import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { ObjectId } from 'mongodb';

import { mongoClientPromise } from '@/lib/mongodbClient';
import { authConfig } from '@/lib/auth.config';

// ────────────────────────────────────────────────────────────────────────
// Auth.js v5 — Full server-side auth (Node.js runtime only).
//
// Extends authConfig (edge-safe) with the MongoDB adapter and createUser
// event. This file must NEVER be imported by middleware.ts — only by
// API routes and server components.
//
// middleware.ts uses auth.config.ts directly (no MongoDB, edge-safe).
// ────────────────────────────────────────────────────────────────────────

const nextAuth = NextAuth({
	...authConfig,
	adapter: MongoDBAdapter(mongoClientPromise),
	events: {
		async createUser({ user }) {
			const client = await mongoClientPromise;
			const db = client.db();
			
			// Set admin role for predefined admin emails (local testing + production admins)
			const adminEmails = [
				'khanhnd2208@gmail.com',
				process.env.ADMIN_EMAIL,
			].filter(Boolean);
			const role = user.email && adminEmails.includes(user.email) ? 'admin' : 'student';
			
			await db.collection('users').updateOne(
				{ _id: new ObjectId(user.id) },
				{ $set: { role } }
			);
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
