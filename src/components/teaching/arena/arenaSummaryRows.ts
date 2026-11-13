import type { ArenaHistoryEntry } from './arenaGame';

export interface ArenaSummaryRow {
	enrollmentId: string;
	name: string;
	result: 'pass' | 'fail' | 'waiting';
	/** CP level given for the pass; 0 is a bare pass. */
	award: number | null;
	/** The week's CP after the pass was saved. */
	cpAfter: number | null;
	giftAfter: number | null;
}

/**
 * One line per student in today's game: everyone on the floor, plus anyone
 * who answered earlier and has since left. Passes first (highest award
 * first), then misses, then students not called yet, each by name.
 */
export function arenaSummaryRows(
	players: ReadonlyArray<{ enrollmentId: string }>,
	history: readonly ArenaHistoryEntry[],
	nameOf: (enrollmentId: string, fallback: string) => string,
): ArenaSummaryRow[] {
	const answers = new Map<string, ArenaHistoryEntry>();
	for (const entry of history) {
		if (entry.result !== 'skip') answers.set(entry.enrollmentId, entry);
	}
	const ids = [...new Set([...players.map((player) => player.enrollmentId), ...answers.keys()])];
	const order = { pass: 0, fail: 1, waiting: 2 } as const;
	return ids
		.map((id): ArenaSummaryRow => {
			const entry = answers.get(id);
			return {
				enrollmentId: id,
				name: nameOf(id, entry?.name ?? ''),
				result: entry ? (entry.result as 'pass' | 'fail') : 'waiting',
				award: entry?.result === 'pass' ? (entry.award ?? 0) : null,
				cpAfter: entry?.cpAfter ?? null,
				giftAfter: entry?.giftAfter ?? null,
			};
		})
		.sort(
			(left, right) =>
				order[left.result] - order[right.result] ||
				(right.award ?? 0) - (left.award ?? 0) ||
				left.name.localeCompare(right.name, 'vi'),
		);
}
