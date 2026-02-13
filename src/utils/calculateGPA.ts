export function calculateGPA(scores: number[]): number {
	const valid = scores.filter((s) => typeof s === 'number' && !Number.isNaN(s));
	if (valid.length === 0) return 0;
	const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length;
	return Math.round(avg * 100) / 100;
}
