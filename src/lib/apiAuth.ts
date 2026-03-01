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
 * Check if a request carries a valid admin token OR the user is an admin.
 *
 * Admin auth can be done via:
 *   1. ADMIN_SECRET token (cookie or header) — for direct admin access
 *   2. Auth.js session with role='admin' — for logged-in admin users
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
	const adminSecret = process.env.ADMIN_SECRET;
	if (adminSecret) {
		// Check cookie first (set by middleware on first visit with ?token=...)
		const cookieToken = request.cookies.get('admin_token')?.value;
		if (cookieToken === adminSecret) return true;

		// Check header (for API clients / curl)
		const headerToken = request.headers.get('x-admin-token');
		if (headerToken === adminSecret) return true;
	}

	// Also check if logged-in user has admin role
	const user = await getApiUser(request);
	if (user?.role === 'admin') return true;

	return false;
}
