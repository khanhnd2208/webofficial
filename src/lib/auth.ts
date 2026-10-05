import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';
import { ObjectId } from 'mongodb';

import { getMongoClient } from '@/lib/mongodbClient';
import { authConfig } from '@/lib/auth.config';
import { describeAuthError, logAuth, newAuthCorrelationId } from '@/lib/auth/log';
import { applyStoredRole, needsRoleRecheck, type StoredRoleLookup } from '@/lib/auth/roleFreshness';
import { reconciledRole, roleForNewUser } from '@/lib/auth/roles';
import { runSignInSideEffects } from '@/lib/auth/sideEffects';

// ────────────────────────────────────────────────────────────────────────
// Auth.js v5 — Full server-side auth (Node.js runtime only).
//
// Extends authConfig (edge-safe) with the MongoDB adapter.
// Role is written during adapter.createUser so it lands with the account.
// JWT fetches/reconciles role on sign-in. Side effects never fail the session.
// ────────────────────────────────────────────────────────────────────────

function withRoleOnCreate(adapter: Adapter): Adapter {
	return {
		...adapter,
		async createUser(user) {
			if (!adapter.createUser) {
				throw new Error('MongoDB adapter is missing createUser');
			}
			const created = await adapter.createUser(user);
			const role = roleForNewUser(created.email);
			const correlationId = newAuthCorrelationId();
			try {
				const client = await getMongoClient();
				await client
					.db()
					.collection('users')
					.updateOne({ _id: new ObjectId(created.id) }, { $set: { role } });
				logAuth({
					event: 'auth.role_assigned',
					stage: 'createUser',
					ok: true,
					correlationId,
					provider: 'google',
					role,
				});
			} catch {
				logAuth({
					event: 'auth.role_assigned',
					stage: 'createUser',
					ok: false,
					correlationId,
					provider: 'google',
					code: 'ROLE_WRITE_FAILED',
				});
			}
			return { ...created, role };
		},
	};
}

async function persistRole(
	userId: string,
	role: 'admin' | 'student',
	correlationId: string,
): Promise<void> {
	try {
		const client = await getMongoClient();
		await client
			.db()
			.collection('users')
			.updateOne({ _id: new ObjectId(userId) }, { $set: { role } });
		logAuth({
			event: 'auth.role_reconciled',
			stage: 'role.reconcile',
			ok: true,
			correlationId,
			provider: 'google',
			role,
		});
	} catch {
		logAuth({
			event: 'auth.role_reconciled',
			stage: 'role.reconcile',
			ok: false,
			correlationId,
			provider: 'google',
			code: 'ROLE_RECONCILE_FAILED',
		});
	}
}

async function lookupStoredRole(userId: string | undefined): Promise<StoredRoleLookup> {
	if (!userId || !ObjectId.isValid(userId)) return { status: 'found', role: undefined };
	try {
		const client = await getMongoClient();
		const dbUser = await client
			.db()
			.collection('users')
			.findOne({ _id: new ObjectId(userId) }, { projection: { role: 1 } });
		return { status: 'found', role: typeof dbUser?.role === 'string' ? dbUser.role : undefined };
	} catch {
		logAuth({
			event: 'auth.role_lookup',
			stage: 'jwt',
			ok: false,
			correlationId: newAuthCorrelationId(),
			provider: 'google',
			code: 'ROLE_LOOKUP_FAILED',
		});
		return { status: 'failed' };
	}
}

const nextAuth = NextAuth({
	...authConfig,
	adapter: withRoleOnCreate(MongoDBAdapter(getMongoClient)),
	logger: {
		error(error) {
			const described = describeAuthError(error);
			logAuth({
				event: 'auth.logger',
				stage: 'logger',
				ok: false,
				correlationId: newAuthCorrelationId(),
				provider: 'google',
				code: described.code,
				cause: described.cause,
			});
		},
	},
	callbacks: {
		...authConfig.callbacks,

		async jwt({ token, user, trigger }) {
			if (user) {
				const correlationId = newAuthCorrelationId();
				let persisted: string | undefined;
				try {
					const client = await getMongoClient();
					const dbUser = await client
						.db()
						.collection('users')
						.findOne({ _id: new ObjectId(user.id!) }, { projection: { role: 1 } });
					persisted = typeof dbUser?.role === 'string' ? dbUser.role : undefined;
				} catch {
					logAuth({
						event: 'auth.role_lookup',
						stage: 'jwt',
						ok: false,
						correlationId,
						provider: 'google',
						code: 'ROLE_LOOKUP_FAILED',
					});
				}

				const nextRole = reconciledRole(user.email, persisted);
				token.role = nextRole;
				token.roleCheckedAt = Math.floor(Date.now() / 1000);
				if (user.id && nextRole === 'admin' && persisted !== 'admin') {
					await persistRole(user.id, 'admin', correlationId);
				}

				if (user.id && user.email) {
					await runSignInSideEffects({
						id: user.id,
						email: user.email,
						name: user.name,
						image: user.image,
					});
				}
			} else if (trigger === 'update' || needsRoleRecheck(token)) {
				// Sessions renew for a year; a demoted admin must not keep admin until sign-out.
				applyStoredRole(token, await lookupStoredRole(token.sub));
			}
			if (!token.role) token.role = 'student';
			return token;
		},
	},
});

export const { GET, POST } = nextAuth.handlers;
export const { auth } = nextAuth;
