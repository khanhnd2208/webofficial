/** Compute consecutive-day streak ending today (UTC). */
export function computeStreak(isoDays: string[], today = new Date()): number {
	const daySet = new Set(isoDays.map((value) => value.slice(0, 10)));
	let streak = 0;
	const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
	while (true) {
		const key = cursor.toISOString().slice(0, 10);
		if (!daySet.has(key)) break;
		streak += 1;
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}
	return streak;
}
