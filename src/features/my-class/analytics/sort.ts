export function comparePerformanceRows<T extends { accuracy: number | null; evidence: number; title?: string }>(
	a: T,
	b: T,
): number {
	if (a.accuracy === null && b.accuracy !== null) return 1;
	if (b.accuracy === null && a.accuracy !== null) return -1;
	if (a.accuracy !== b.accuracy) return (b.accuracy ?? 0) - (a.accuracy ?? 0);
	if (b.evidence !== a.evidence) return b.evidence - a.evidence;
	return (a.title ?? '').localeCompare(b.title ?? '', 'vi');
}
