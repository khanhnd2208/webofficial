import { isAssistTurn, isManualPlayer, isOwnTurn, type ArenaHistoryEntry } from './arenaGame';

export interface ArenaSummaryRow {
	enrollmentId: string;
	name: string;
	result: 'pass' | 'fail' | 'waiting';
	/** CP level given for the pass; 0 is a bare pass. */
	award: number | null;
	/** The week's CP before the pass, when known. */
	cpBefore: number | null;
	/** The week's CP after the pass was saved. */
	cpAfter: number | null;
	/** CP actually added this session: the week keeps the higher mark, so it can be 0. */
	cpGain: number | null;
	/** Questions answered in place of a classmate; their CP is part of `cpGain`. */
	assists: number;
	/** Gifts added this session (one per missed answer that the server confirmed). */
	giftAdded: number;
	giftAfter: number | null;
	/** Typed-in player outside the course roster: nothing is scored. */
	guest: boolean;
}

export interface ArenaSummaryTotals {
	answered: number;
	passed: number;
	failed: number;
	cpGained: number;
	/** Students whose CP went up. */
	cpRaised: number;
	giftsAdded: number;
}

/**
 * One line per student in today's game: everyone on the floor, plus anyone
 * who answered earlier and has since left. Passes first (highest award
 * first), then misses, then students not called yet, each by name. The
 * result is the student's own turn; an answer given in place of a classmate
 * only adds to their CP, so it never hides a miss or counts as being called.
 */
export function arenaSummaryRows(
	players: ReadonlyArray<{ enrollmentId: string }>,
	history: readonly ArenaHistoryEntry[],
	nameOf: (enrollmentId: string, fallback: string) => string,
): ArenaSummaryRow[] {
	const answers = new Map<string, ArenaHistoryEntry>();
	const assists = new Map<string, ArenaHistoryEntry[]>();
	for (const entry of history) {
		if (isOwnTurn(entry)) answers.set(entry.enrollmentId, entry);
		else if (isAssistTurn(entry) && entry.result === 'pass')
			assists.set(entry.enrollmentId, [...(assists.get(entry.enrollmentId) ?? []), entry]);
	}
	const ids = [
		...new Set([
			...players.map((player) => player.enrollmentId),
			...answers.keys(),
			...assists.keys(),
		]),
	];
	const order = { pass: 0, fail: 1, waiting: 2 } as const;
	return ids
		.map((id): ArenaSummaryRow => {
			const entry = answers.get(id);
			const helped = assists.get(id) ?? [];
			// The week's CP from before the first pass that saved CP to after the last one.
			const scored = [...(entry?.result === 'pass' ? [entry] : []), ...helped]
				.filter((turn) => turn.cpAfter != null)
				.sort((left, right) => left.at - right.at);
			const cpBefore = scored[0]?.cpBefore ?? null;
			const cpAfter = scored.at(-1)?.cpAfter ?? null;
			const named = entry ?? helped[0];
			return {
				enrollmentId: id,
				name: nameOf(id, named?.name ?? ''),
				result: entry ? (entry.result as 'pass' | 'fail') : 'waiting',
				award: entry?.result === 'pass' ? (entry.award ?? 0) : null,
				cpBefore,
				cpAfter,
				cpGain: cpBefore != null && cpAfter != null ? Math.max(0, cpAfter - cpBefore) : null,
				assists: helped.length,
				giftAdded: entry?.result === 'fail' && entry.giftAfter != null ? 1 : 0,
				giftAfter: entry?.giftAfter ?? null,
				guest: isManualPlayer(id) || Boolean(named?.group),
			};
		})
		.sort(
			(left, right) =>
				order[left.result] - order[right.result] ||
				(right.award ?? 0) - (left.award ?? 0) ||
				left.name.localeCompare(right.name, 'vi'),
		);
}

export function arenaSummaryTotals(rows: readonly ArenaSummaryRow[]): ArenaSummaryTotals {
	const answered = rows.filter((row) => row.result !== 'waiting');
	const passed = answered.filter((row) => row.result === 'pass').length;
	return {
		answered: answered.length,
		passed,
		failed: answered.length - passed,
		cpGained: rows.reduce((sum, row) => sum + (row.cpGain ?? 0), 0),
		cpRaised: rows.filter((row) => (row.cpGain ?? 0) > 0).length,
		giftsAdded: answered.reduce((sum, row) => sum + row.giftAdded, 0),
	};
}

/** Plain-text report the lecturer can paste into a chat or a note. */
export function arenaSummaryText(
	title: string,
	rows: readonly ArenaSummaryRow[],
	totals: ArenaSummaryTotals,
): string {
	const lines = [
		title,
		`Đã trả lời ${totals.answered}/${rows.length} · Đạt ${totals.passed} · Chưa đạt ${totals.failed}`,
		`CP cộng: +${totals.cpGained} (${totals.cpRaised} bạn) · Gift: +${totals.giftsAdded}`,
		'',
	];
	for (const row of rows) {
		if (row.result === 'waiting' && !row.assists) continue;
		lines.push(`${row.name}: ${summaryOutcome(row)}`);
	}
	const waiting = rows.filter((row) => row.result === 'waiting').map((row) => row.name);
	if (waiting.length) lines.push('', `Chưa gọi: ${waiting.join(', ')}`);
	return lines.join('\n');
}

/** What happened to a student's marks, in one short phrase. */
export function summaryOutcome(row: ArenaSummaryRow): string {
	const own = ownOutcome(row);
	if (!row.assists) return own;
	const bonus =
		!row.guest && row.result !== 'pass' && row.cpGain != null && row.cpAfter != null
			? row.cpGain > 0
				? `, CP ${row.cpBefore} → ${row.cpAfter} (+${row.cpGain})`
				: `, CP giữ ${row.cpAfter}`
			: '';
	return `${own} · trả lời thay ${row.assists} câu${bonus}`;
}

function ownOutcome(row: ArenaSummaryRow): string {
	if (row.result === 'waiting') return 'Chưa gọi';
	if (row.guest)
		return row.result === 'pass' ? 'Đạt · không ghi điểm' : 'Chưa đạt · không ghi điểm';
	if (row.result === 'fail') {
		return row.giftAfter != null ? `Chưa đạt · +1 Gift (tổng ${row.giftAfter})` : 'Chưa đạt';
	}
	if (row.award === 0 && !row.assists) return 'Không điểm · CP giữ nguyên';
	if (row.cpGain != null && row.cpAfter != null) {
		return row.cpGain > 0
			? `Đạt · CP ${row.cpBefore} → ${row.cpAfter} (+${row.cpGain})`
			: `Đạt · CP giữ ${row.cpAfter} (đã bằng hoặc cao hơn)`;
	}
	return row.cpAfter != null ? `Đạt · CP tuần ${row.cpAfter}` : 'Đạt';
}
