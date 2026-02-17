import type { NextRequest } from 'next/server';

export interface ApiUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

/**
 * User authentication is temporarily disabled.
 * Always returns null — login features are hidden from the UI.
 * Kept as a stub so existing API routes don't break.
 */
export async function getApiUser(_request: NextRequest): Promise<ApiUser | null> {
	return null;
}

/**
 * Check if a request carries a valid admin token.
 * Admin auth is done via ADMIN_SECRET — no OAuth required.
 *
 * The token can be in:
 *   1. Cookie 'admin_token' (set by middleware on first visit with ?token=...)
 *   2. Header 'x-admin-token' (for API clients / curl)
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
	const adminSecret = process.env.ADMIN_SECRET;
	if (!adminSecret) return false;

	// Check cookie first (set by middleware)
	const cookieToken = request.cookies.get('admin_token')?.value;
	if (cookieToken === adminSecret) return true;

	// Check header (for API clients)
	const headerToken = request.headers.get('x-admin-token');
	if (headerToken === adminSecret) return true;

	return false;
}
