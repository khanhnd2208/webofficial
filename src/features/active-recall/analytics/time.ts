import { AppError } from '@/lib/appError';
import type { RecallReportFilters } from './contracts';

const DAY_MS = 86_400_000;
const OFFSET_MS = 7 * 3_600_000;
export function recallDay(value: Date): string {
	return new Date(value.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}
export function recallDays(start: string, end: string): string[] {
	const days: string[] = [];
	for (let t = Date.parse(start); t <= Date.parse(end); t += DAY_MS)
		days.push(new Date(t).toISOString().slice(0, 10));
	return days;
}
export function splitRecallSeconds(end: Date, seconds: number) {
	let cursor = end.getTime() - seconds * 1000;
	const result: { day: string; seconds: number }[] = [];
	while (cursor < end.getTime()) {
		const midnight = (Math.floor((cursor + OFFSET_MS) / DAY_MS) + 1) * DAY_MS - OFFSET_MS;
		const next = Math.min(midnight, end.getTime());
		result.push({ day: recallDay(new Date(cursor)), seconds: (next - cursor) / 1000 });
		cursor = next;
	}
	// Allocate whole seconds while preserving the total at subsecond boundaries.
	let allocated = 0;
	return result.map((row, index) => {
		const count = index === result.length - 1 ? seconds - allocated : Math.floor(row.seconds);
		allocated += count;
		return { day: row.day, seconds: count };
	});
}
function validDate(value: string): boolean {
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) &&
		Number.isFinite(Date.parse(value)) &&
		new Date(value).toISOString().slice(0, 10) === value
	);
}
function page(value?: string) {
	return value && /^\d+$/.test(value) ? Math.min(100_000, Math.max(1, Number(value))) : 1;
}
export function recallReportFilters(
	query: Record<string, string | undefined>,
	now = new Date(),
): RecallReportFilters {
	const end = query.end || recallDay(now);
	const days = [7, 30, 90, 365].includes(Number(query.days)) ? Number(query.days) : 30;
	const start =
		query.start ||
		(validDate(end)
			? new Date(Date.parse(end) - (days - 1) * DAY_MS).toISOString().slice(0, 10)
			: '');
	if (
		!validDate(start) ||
		!validDate(end) ||
		start > end ||
		Date.parse(end) - Date.parse(start) > 365 * DAY_MS
	)
		throw new AppError('Chọn khoảng ngày hợp lệ, tối đa 366 ngày.', 400);
	for (const key of ['course', 'class', 'deck', 'visitor']) {
		if ((query[key]?.length ?? 0) > 128) throw new AppError('Bộ lọc không hợp lệ.', 400);
	}
	return {
		start,
		end,
		course: query.course || '',
		class: query.class || '',
		deck: query.deck || '',
		visitor: query.visitor || '',
		page: page(query.page),
		historyPage: page(query.historyPage),
	};
}
