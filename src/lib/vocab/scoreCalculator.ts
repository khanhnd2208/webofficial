/**
 * scoreCalculator.ts — Server-side score computation for all game modes.
 *
 * Anti-cheat: scores are NEVER trusted from the client.
 * The client sends raw timestamps; the server recomputes the score.
 *
 * Score scales:
 *   MCQ / FILL_BLANK → 0–3000  (average per question/word)
 *   MATCHING / GUESS_WHO → 0–10000  (session total)
 *
 * Timestamp validation:
 *   - All times must be positive integers
 *   - startTime < endTime for each entry
 *   - The session's last endTime must be within MAX_CLOCK_SKEW_MS of server now
 */

export const MAX_CLOCK_SKEW_MS = 60_000; // 60 s tolerance for network + processing

// ─── MCQ ─────────────────────────────────────────────────────────────────────
export interface MCQQuestion {
	startTime: number; // Date.now() when question appeared
	endTime: number; // Date.now() when answer was submitted (or 30 s timeout)
	correct: boolean;
}

/**
 * Returns average points per question (0–3000).
 * Per-question: correct → max(0, 3000 − elapsed_seconds × 100), wrong/timeout → 0.
 */
export function calcMCQScore(questions: MCQQuestion[]): number {
	if (questions.length === 0) return 0;
	const perQ = questions.map(({ startTime, endTime, correct }) => {
		if (!correct) return 0;
		const elapsed = (endTime - startTime) / 1000;
		return Math.max(0, 3000 - elapsed * 100);
	});
	const avg = perQ.reduce((a, b) => a + b, 0) / perQ.length;
	return Math.round(avg * 10) / 10; // 1 decimal place
}

/** Validates MCQ payload. Returns error string or null. */
export function validateMCQPayload(questions: MCQQuestion[], nowMs: number): string | null {
	if (!Array.isArray(questions) || questions.length === 0) return 'No questions provided';
	for (const q of questions) {
		if (typeof q.startTime !== 'number' || typeof q.endTime !== 'number')
			return 'Invalid timestamp type';
		if (q.startTime <= 0 || q.endTime <= 0) return 'Timestamps must be positive';
		if (q.startTime >= q.endTime) return 'startTime must be before endTime';
	}
	const lastEnd = Math.max(...questions.map((q) => q.endTime));
	if (Math.abs(nowMs - lastEnd) > MAX_CLOCK_SKEW_MS)
		return 'Session timestamp too old or in the future';
	return null;
}

// ─── Fill-blank ───────────────────────────────────────────────────────────────
export interface FillBlankWord {
	startTime: number; // Date.now() when word appeared
	endTime: number; // Date.now() when answer was checked
	penaltyMs: number; // accumulated penalties (hint × 10 000, wrong × 10 000)
	correct: boolean;
}

/**
 * Returns average points per word (0–3000).
 * Per-word: correct → max(0, 3000 − effectiveElapsed × 100), wrong/timeout → 0.
 * effectiveElapsed = (endTime − startTime + penaltyMs) / 1000
 */
export function calcFillBlankScore(words: FillBlankWord[]): number {
	if (words.length === 0) return 0;
	const perW = words.map(({ startTime, endTime, penaltyMs, correct }) => {
		if (!correct) return 0;
		const effectiveElapsed = (endTime - startTime + penaltyMs) / 1000;
		if (effectiveElapsed >= 30) return 0;
		return Math.max(0, 3000 - effectiveElapsed * 100);
	});
	const avg = perW.reduce((a, b) => a + b, 0) / perW.length;
	return Math.round(avg * 10) / 10;
}

export function validateFillBlankPayload(words: FillBlankWord[], nowMs: number): string | null {
	if (!Array.isArray(words) || words.length === 0) return 'No words provided';
	for (const w of words) {
		if (typeof w.startTime !== 'number' || typeof w.endTime !== 'number')
			return 'Invalid timestamp type';
		if (w.startTime <= 0 || w.endTime <= 0) return 'Timestamps must be positive';
		if (w.startTime >= w.endTime) return 'startTime must be before endTime';
		if (typeof w.penaltyMs !== 'number' || w.penaltyMs < 0) return 'Invalid penaltyMs';
	}
	const lastEnd = Math.max(...words.map((w) => w.endTime));
	if (Math.abs(nowMs - lastEnd) > MAX_CLOCK_SKEW_MS)
		return 'Session timestamp too old or in the future';
	return null;
}

// ─── Matching ─────────────────────────────────────────────────────────────────
export interface MatchingSession {
	sessionStartTime: number;
	sessionEndTime: number;
	penaltyMs: number; // wrongPairs × 5 000
}

/**
 * Returns session score (0–10 000).
 * score = max(0, 10 000 − effectiveElapsed × 100)
 * effectiveElapsed = (endTime − startTime + penaltyMs) / 1000
 */
export function calcMatchingScore({
	sessionStartTime,
	sessionEndTime,
	penaltyMs,
}: MatchingSession): number {
	const effectiveElapsed = (sessionEndTime - sessionStartTime + penaltyMs) / 1000;
	return Math.max(0, Math.round(10000 - effectiveElapsed * 100));
}

export function validateMatchingPayload(data: MatchingSession, nowMs: number): string | null {
	const { sessionStartTime, sessionEndTime, penaltyMs } = data;
	if (typeof sessionStartTime !== 'number' || typeof sessionEndTime !== 'number')
		return 'Invalid timestamp type';
	if (sessionStartTime <= 0 || sessionEndTime <= 0) return 'Timestamps must be positive';
	if (sessionStartTime >= sessionEndTime) return 'startTime must be before endTime';
	if (typeof penaltyMs !== 'number' || penaltyMs < 0) return 'Invalid penaltyMs';
	if (Math.abs(nowMs - sessionEndTime) > MAX_CLOCK_SKEW_MS)
		return 'Session timestamp too old or in the future';
	return null;
}

// ─── Guess Who ────────────────────────────────────────────────────────────────
export interface GuessWhoSession {
	sessionStartTime: number;
	sessionEndTime: number;
	penaltyMs: number; // wrongGuesses × 5 000 + hintsUsed × 10 000
}

/** Identical formula to matching: max(0, 10 000 − effectiveElapsed × 100) */
export function calcGuessWhoScore({
	sessionStartTime,
	sessionEndTime,
	penaltyMs,
}: GuessWhoSession): number {
	const effectiveElapsed = (sessionEndTime - sessionStartTime + penaltyMs) / 1000;
	return Math.max(0, Math.round(10000 - effectiveElapsed * 100));
}

export function validateGuessWhoPayload(data: GuessWhoSession, nowMs: number): string | null {
	const { sessionStartTime, sessionEndTime, penaltyMs } = data;
	if (typeof sessionStartTime !== 'number' || typeof sessionEndTime !== 'number')
		return 'Invalid timestamp type';
	if (sessionStartTime <= 0 || sessionEndTime <= 0) return 'Timestamps must be positive';
	if (sessionStartTime >= sessionEndTime) return 'startTime must be before endTime';
	if (typeof penaltyMs !== 'number' || penaltyMs < 0) return 'Invalid penaltyMs';
	if (Math.abs(nowMs - sessionEndTime) > MAX_CLOCK_SKEW_MS)
		return 'Session timestamp too old or in the future';
	return null;
}
