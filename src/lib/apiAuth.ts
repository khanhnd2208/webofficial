import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';

export interface ApiUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

/**
 * Get the currently authenticated user from the Auth.js session.
 * Returns null if the user is not signed in.
 *
 * Used by API routes that require user-level authentication
 * (vocab-sets, vocab-stats, streak, comments, etc.).
 */
export async function getApiUser(_request: NextRequest): Promise<ApiUser | null> {
	const session = await auth();
	if (!session?.user?.email) return null;

	return {
		id: (session.user as { id?: string }).id ?? '',
		email: session.user.email,
		name: session.user.name ?? '',
		role: (session.user as { role?: string }).role ?? 'student',
	};
}

/**
 * Check if the current user is an admin (Auth.js session only).
 *
 * No more token-based auth — admin is determined solely by the
 * user's role in the database (set during account creation or
 * manually via MongoDB).
 */
export async function isAdmin(_request: NextRequest): Promise<boolean> {
	const user = await getApiUser(_request);
	return user?.role === 'admin';
}
