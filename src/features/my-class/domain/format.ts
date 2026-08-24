export function formatEvidenceCount(value: number): string {
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatEvidenceSummary(correctCount: number, questionCount: number, accuracy: number): string {
	return `Đúng ${formatEvidenceCount(correctCount)} / ${formatEvidenceCount(questionCount)} evidence (${accuracy}%)`;
}
