import { teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaTurnInput } from '@/features/teaching/schemas';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import { isManualPlayer, type ArenaHistoryEntry } from './arenaGame';

/** What the server keeps for one call; a typed-in player goes by name. */
export function turnPayload(entry: ArenaHistoryEntry): RecallArenaTurnInput {
	const guest = isManualPlayer(entry.enrollmentId);
	return {
		clientId: entry.id,
		playedAt: entry.at,
		...(guest
			? { guestName: entry.name || 'Khách', ...(entry.group ? { guestGroup: entry.group } : {}) }
			: { enrollmentId: entry.enrollmentId }),
		...(entry.cardId ? { cardId: entry.cardId } : {}),
		result: entry.result,
		...(entry.award != null ? { award: entry.award as 0 | 0.5 | 1 | 2 } : {}),
		...(entry.cpAfter != null ? { cpAfter: entry.cpAfter } : {}),
		...(entry.giftAfter != null ? { giftAfter: entry.giftAfter } : {}),
	};
}

/** A saved call as a history entry, for a browser that did not play it. */
export function entryFromTurn(turn: RecallArenaTurnRecord): ArenaHistoryEntry {
	return {
		id: turn.clientId,
		at: turn.playedAt,
		enrollmentId: turn.enrollmentId ?? `turn:${turn.clientId}`,
		name: turn.playerName,
		cardId: turn.cardId,
		result: turn.result,
		...(turn.award != null ? { award: turn.award } : {}),
		...(turn.cpAfter != null ? { cpAfter: turn.cpAfter } : {}),
		...(turn.cpPrevious != null ? { cpBefore: turn.cpPrevious } : {}),
		...(turn.giftAfter != null ? { giftAfter: turn.giftAfter } : {}),
		...(turn.guestGroup ? { group: turn.guestGroup } : {}),
		synced: true,
	};
}

export interface RecallArenaTurnDay {
	date: string;
	turns: RecallArenaTurnRecord[];
	/** Game days with saved calls, newest first. */
	days: string[];
}

export function arenaTurnsUrl(courseId: string, date?: string) {
	const base = `/api/admin/teaching/courses/${encodeURIComponent(courseId)}/recall-arena/turns`;
	return date ? `${base}?date=${date}` : base;
}

export async function saveArenaGrade(
	courseId: string,
	entry: ArenaHistoryEntry,
	grade: NonNullable<RecallArenaTurnInput['grade']>,
	name: string,
) {
	const saved = await teachingApi<RecallArenaTurnRecord>(arenaTurnsUrl(courseId), {
		method: 'POST',
		body: JSON.stringify({ ...turnPayload(entry), grade }),
	});
	if (grade.kind === 'gift' && saved?.giftAfter != null) {
		return {
			entry: { ...entry, synced: true, giftAfter: saved.giftAfter },
			message: `${name}: +1 Gift (${saved.giftAfter} Gift)`,
		};
	}
	if (grade.kind === 'cp' && saved?.cpAfter != null) {
		const points = saved.cpAfter;
		return {
			entry: {
				...entry,
				synced: true,
				cpAfter: points,
				// A retried save returns the committed turn without its previous mark.
				...(saved.cpPrevious != null ? { cpBefore: saved.cpPrevious } : {}),
			},
			message:
				saved.cpPrevious != null && saved.cpPrevious < points
					? `${name}: CP ${saved.cpPrevious} → ${points}`
					: `${name}: CP tuần này ${points}`,
		};
	}
	throw new Error('Máy chủ chưa xác nhận kết quả chấm.');
}
