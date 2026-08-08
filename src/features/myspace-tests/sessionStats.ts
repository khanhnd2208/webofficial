/** Minimum time-on-task for completions and score/time averages. */
export const MIN_ATTEMPT_DURATION_MS = 5 * 60 * 1000;

export type SessionTiming = {
	createdAt: Date;
	engagedAt: Date | null;
	submittedAt: Date | null;
};

/**
 * Start of real attempt: first answer when available and before submit;
 * otherwise session creation (covers historical rows).
 */
export function sessionStartAt(s: SessionTiming): Date {
	if (s.engagedAt && (!s.submittedAt || s.engagedAt.getTime() < s.submittedAt.getTime())) {
		return s.engagedAt;
	}
	return s.createdAt;
}

/** End of attempt: submit time, or "now" for in-progress sessions. */
export function sessionEndAt(s: SessionTiming, now = new Date()): Date {
	return s.submittedAt ?? now;
}

export function sessionDurationMs(s: SessionTiming, now = new Date()): number {
	return sessionEndAt(s, now).getTime() - sessionStartAt(s).getTime();
}

/** Answered ≥1 question (no duration gate). */
export function isQualifyingAttempt(s: SessionTiming): boolean {
	return Boolean(s.engagedAt || s.submittedAt);
}

/** Submitted and spent ≥ 5 minutes. */
export function isQualifyingCompletion(s: SessionTiming): boolean {
	if (!s.submittedAt) return false;
	return sessionDurationMs(s) >= MIN_ATTEMPT_DURATION_MS;
}

export function avgDurationMs(durations: number[]): number | null {
	if (durations.length === 0) return null;
	const sum = durations.reduce((a, b) => a + b, 0);
	return Math.round(sum / durations.length);
}
