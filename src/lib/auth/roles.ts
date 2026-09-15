export type AppRole = 'admin' | 'student';

function adminAllowlist(): string[] {
	const extras = process.env.ADMIN_EMAIL;
	return ['khanhnd2208@gmail.com', 'khanhndfmt@hanu.edu.vn', extras].filter(
		(value): value is string => Boolean(value),
	);
}

export function normalizeEmail(email: string | null | undefined): string {
	return (email ?? '').trim().toLowerCase();
}

export function isAdminAllowlistedEmail(email: string | null | undefined): boolean {
	const normalized = normalizeEmail(email);
	if (!normalized) return false;
	return adminAllowlist().some((allowed) => allowed.toLowerCase() === normalized);
}

/** Role written when a brand-new user is created. Unknown emails are always student. */
export function roleForNewUser(email: string | null | undefined): AppRole {
	return isAdminAllowlistedEmail(email) ? 'admin' : 'student';
}

/**
 * One-time reconcile for an existing account on sign-in.
 * Allowlisted emails are upgraded to admin. Other emails are never granted admin here
 * (fail-closed). Manually promoted admins keep admin.
 */
export function reconciledRole(
	email: string | null | undefined,
	persistedRole: string | null | undefined,
): AppRole {
	if (isAdminAllowlistedEmail(email)) return 'admin';
	return persistedRole === 'admin' ? 'admin' : 'student';
}
