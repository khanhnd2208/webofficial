/**
 * Structured auth logs. Never include tokens, cookies, or email addresses.
 */

export type AuthLogStage =
	| 'createUser'
	| 'jwt'
	| 'signIn'
	| 'callback'
	| 'redirect'
	| 'profile.sync'
	| 'membership.reconcile'
	| 'role.assign'
	| 'role.reconcile'
	| 'logger';

export type AuthLogEntry = {
	event: string;
	stage: AuthLogStage;
	ok: boolean;
	correlationId: string;
	code?: string;
	cause?: string;
	provider?: string;
	role?: 'admin' | 'student';
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function redactAuthText(value: string): string {
	return value
		.replace(EMAIL_PATTERN, '[redacted-email]')
		.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
		.replace(/(?:cookie|token|secret|authorization)\s*[:=]\s*[^,\s]+/gi, '[redacted-secret]')
		.slice(0, 120);
}

/** Auth.js error name + cleaned cause name. Never include messages (they can hold emails). */
export function describeAuthError(error: unknown): { code: string; cause?: string } {
	if (!error || typeof error !== 'object') {
		return { code: 'AuthError' };
	}
	const named = error as { name?: string; type?: string; cause?: unknown };
	const code = redactAuthText(named.name || named.type || 'AuthError') || 'AuthError';
	const causeRaw = named.cause;
	if (!causeRaw || typeof causeRaw !== 'object') return { code };
	const causeName = (causeRaw as { name?: string; type?: string }).name
		|| (causeRaw as { type?: string }).type;
	if (!causeName) return { code };
	const cause = redactAuthText(causeName);
	return cause ? { code, cause } : { code };
}

export function newAuthCorrelationId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function logAuth(entry: AuthLogEntry): void {
	const payload = {
		source: 'auth',
		ts: new Date().toISOString(),
		event: entry.event,
		stage: entry.stage,
		ok: entry.ok,
		correlationId: entry.correlationId,
		...(entry.code ? { code: entry.code } : {}),
		...(entry.cause ? { cause: entry.cause } : {}),
		...(entry.provider ? { provider: entry.provider } : {}),
		...(entry.role ? { role: entry.role } : {}),
	};
	const line = JSON.stringify(payload);
	if (entry.ok) {
		console.info(line);
	} else {
		console.error(line);
	}
}
