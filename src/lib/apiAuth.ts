import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export interface ApiUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

/**
 * Extract the authenticated user from a request's JWT token.
 * Returns `null` when the request carries no valid session.
 *
 * This is the single source of truth for API-route authentication —
 * replaces the duplicated `getUser()` helpers scattered across route files.
 */
export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
	// secureCookie=true: cookies use __Secure- prefix to match auth.ts useSecureCookies.
	// NEXTAUTH_URL=https://... makes Auth.js use secure cookies automatically.
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: true });
	if (!token?.sub) return null;

	return {
		id: String(token.sub),
		email: typeof token.email === 'string' ? token.email : '',
		name: typeof token.name === 'string' ? token.name : '',
		role: typeof token.role === 'string' ? token.role : 'student',
	};
}

/** Returns `true` when the authenticated user holds the `admin` role. */
export async function isAdmin(request: NextRequest): Promise<boolean> {
	const user = await getApiUser(request);
	return user?.role === 'admin';
}
