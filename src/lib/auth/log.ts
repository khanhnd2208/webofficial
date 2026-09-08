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

const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9._-]*$/;

function safeErrorName(value: unknown): string | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const named = value as { name?: unknown; type?: unknown };
	const raw =
		typeof named.type === 'string' && named.type.trim()
			? named.type
			: typeof named.name === 'string' && named.name.trim()
				? named.name
				: undefined;
	if (!raw) return undefined;
	const cleaned = redactAuthText(raw);
	return SAFE_ERROR_NAME.test(cleaned) ? cleaned : 'AuthError';
}

/** Auth.js wraps the original error at `cause.err`. Never read messages. */
function unwrapAuthCause(cause: unknown): unknown {
	if (!cause || typeof cause !== 'object') return undefined;
	const nested = (cause as { err?: unknown }).err;
	if (nested && typeof nested === 'object') return nested;
	return cause;
}

/** Auth.js error name + cleaned cause name. Never include messages (they can hold emails). */
export function describeAuthError(error: unknown): { code: string; cause?: string } {
	const code = safeErrorName(error) ?? 'AuthError';
	if (!error || typeof error !== 'object') return { code };
	const inner = unwrapAuthCause((error as { cause?: unknown }).cause);
	const cause = inner ? safeErrorName(inner) : undefined;
	if (!cause || cause === code) return { code };
	return { code, cause };
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
