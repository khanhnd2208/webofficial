const DAY_MS = 24 * 60 * 60_000;
const VIETNAM_OFFSET_MS = 7 * 60 * 60_000;

export function studyReportRange(days: number, now = new Date()) {
	const rangeDays = Number.isFinite(days) ? Math.min(365, Math.max(1, Math.floor(days))) : 30;
	const local = new Date(now.getTime() + VIETNAM_OFFSET_MS);
	const today = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
	const startDay = new Date(today.getTime() - (rangeDays - 1) * DAY_MS);
	return { rangeDays, startDay, start: new Date(startDay.getTime() - VIETNAM_OFFSET_MS) };
}

export function studyReportPage(value: number) {
	return Number.isFinite(value) ? Math.min(100_000, Math.max(1, Math.floor(value))) : 1;
}

export function fillStudyDays<T extends { day: string }>(
	startDay: Date,
	days: number,
	rows: T[],
	empty: Omit<T, 'day'>,
): T[] {
	const byDay = new Map(rows.map((row) => [row.day, row]));
	return Array.from({ length: days }, (_, index) => {
		const day = new Date(startDay.getTime() + index * DAY_MS).toISOString().slice(0, 10);
		return byDay.get(day) ?? ({ ...empty, day } as T);
	});
}
