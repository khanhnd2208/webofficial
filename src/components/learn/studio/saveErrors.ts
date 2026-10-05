/** How a failed studio save should be treated. Network blips retry; bad fields wait. */

const RETRY_BACKOFF_MS = [2_000, 5_000, 10_000, 20_000, 30_000] as const;

export type ClassifiedSaveError =
	| { action: 'retry' }
	| { action: 'hold'; fields: string[]; message: string }
	| { action: 'conflict'; message: string }
	| { action: 'drop' }
	| { action: 'stop'; message: string };

type HttpLikeError = {
	status: number;
	message?: string;
	fields?: Record<string, string>;
};

function httpError(error: unknown): HttpLikeError | null {
	if (typeof error !== 'object' || error === null || !('status' in error)) return null;
	const status = (error as { status: unknown }).status;
	if (typeof status !== 'number') return null;
	const fields = (error as { fields?: unknown }).fields;
	return {
		status,
		message: error instanceof Error ? error.message : undefined,
		fields: fields && typeof fields === 'object' ? (fields as Record<string, string>) : undefined,
	};
}

/** Classify a thrown save error. Anything without an HTTP status is a network failure. */
export function classifySaveError(error: unknown): ClassifiedSaveError {
	const http = httpError(error);
	if (!http) return { action: 'retry' };

	const message = http.message || 'Không lưu được';
	if (http.status === 409) return { action: 'conflict', message };
	if (http.status === 404) return { action: 'drop' };
	if (http.status === 401 || http.status === 403) return { action: 'stop', message };
	if (http.status === 400 || http.status === 413 || http.status === 422) {
		return {
			action: 'hold',
			fields: Object.keys(http.fields ?? {}),
			message,
		};
	}
	if (http.status === 408 || http.status === 429 || http.status >= 500) return { action: 'retry' };
	return { action: 'stop', message };
}

/** Backoff for attempt 0, 1, 2… plus up to one second of jitter. */
export function retryDelayMs(attempt: number, random: () => number = Math.random): number {
	const base = RETRY_BACKOFF_MS[Math.min(Math.max(attempt, 0), RETRY_BACKOFF_MS.length - 1)];
	return base + Math.floor(random() * 1_000);
}
