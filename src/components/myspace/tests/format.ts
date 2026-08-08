/** Shared formatters for My Space Tests public UI. */

export function formatScorePercent(avg: number | null): string | null {
	if (avg == null) return null;
	return `${avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)}%`;
}

export function formatDuration(ms: number | null): string | null {
	if (ms == null || ms <= 0) return null;
	const minutes = Math.round(ms / 60_000);
	if (minutes < 1) return '<1 min';
	if (minutes === 1) return '1 min';
	return `${minutes} min`;
}

export function formatCount(n: number): string {
	return n.toLocaleString('en-US');
}

export function scoreColorClass(avg: number | null): string {
	if (avg == null) return 'text-ink';
	if (avg >= 80) return 'text-success';
	if (avg >= 50) return 'text-accent';
	return 'text-error';
}

/**
 * Build a compact meta line for a test row.
 * Empty / missing values are omitted (smart-hide).
 *
 * Example: "105 questions · 6 attempts · avg 82% · 12 min"
 * When no attempts yet: "105 questions"
 */
export function buildTestMetaLine({
	questionCount,
	attemptedCount,
	completedCount,
	avgScorePercent,
	avgDurationMs,
}: {
	questionCount: number;
	attemptedCount: number;
	completedCount: number;
	avgScorePercent: number | null;
	avgDurationMs: number | null;
}): string {
	const parts: string[] = [
		`${formatCount(questionCount)} ${questionCount === 1 ? 'question' : 'questions'}`,
	];

	if (attemptedCount > 0) {
		parts.push(
			`${formatCount(attemptedCount)} ${attemptedCount === 1 ? 'attempt' : 'attempts'}`,
		);
	}

	if (avgScorePercent != null && completedCount > 0) {
		const score = formatScorePercent(avgScorePercent);
		if (score) parts.push(`avg ${score}`);
	}

	if (avgDurationMs != null && completedCount > 0) {
		const time = formatDuration(avgDurationMs);
		if (time) parts.push(time);
	}

	return parts.join(' · ');
}
