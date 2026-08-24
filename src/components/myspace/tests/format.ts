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

export function formatDifficulty(value: number): string {
	if (value <= 1) return 'Dễ';
	if (value === 2) return 'Trung bình';
	return 'Khó';
}

export function formatCount(n: number): string {
	return n.toLocaleString('vi-VN');
}

export function scoreColorClass(avg: number | null): string {
	if (avg == null) return 'text-ink';
	if (avg >= 80) return 'text-success';
	if (avg >= 50) return 'text-accent';
	return 'text-error';
}

export function formatCompletedDate(iso: string | null): string | null {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export function truncateDescription(text: string, maxLines = 2): string {
	const cleaned = text.replace(/\s+/g, ' ').trim();
	if (!cleaned) return '';
	// Soft cap ~140 chars ≈ two short lines in the dense catalogue.
	const maxChars = maxLines * 70;
	if (cleaned.length <= maxChars) return cleaned;
	return `${cleaned.slice(0, maxChars - 1).trimEnd()}…`;
}
