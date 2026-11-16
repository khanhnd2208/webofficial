import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaTurnInput } from '@/features/teaching/schemas';
import type { ArenaAwardLevel } from '@/features/teaching/domain/recallArena';
import type { RecallArenaAwardResult, RecallArenaTurnRecord } from '@/features/teaching/types';

import { isManualPlayer, type ArenaGrade, type ArenaHistoryEntry } from './arenaGame';

/**
 * How long a save may take before the arena stops waiting. Without a limit a
 * request lost on a dropped connection can keep the grading buttons busy for
 * minutes in front of the class.
 */
export const ARENA_SAVE_TIMEOUT_MS = 15_000;

/** POST to the admin API, giving up after `ARENA_SAVE_TIMEOUT_MS`. */
export function arenaPost<T>(url: string, body: unknown): Promise<T> {
	return teachingApi<T>(url, {
		method: 'POST',
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(ARENA_SAVE_TIMEOUT_MS),
	});
}

/**
 * True when a failed save may still have been applied: no answer (offline,
 * timeout) or a server error. A 4xx answer means the server refused it.
 */
export function saveMayHaveLanded(error: unknown) {
	return !(error instanceof AdminApiError) || error.status >= 500;
}

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
		...(entry.pendingGrade ? { grade: entry.pendingGrade } : {}),
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

/**
 * Fold the server's answer to a graded save into the turn: the confirmed CP
 * or Gift, and a toast line. Throws when the answer confirms neither.
 */
export function applySavedGrade(
	entry: ArenaHistoryEntry,
	grade: ArenaGrade,
	saved: RecallArenaTurnRecord | undefined,
	name: string,
) {
	const { pendingGrade: _pending, ...rest } = entry;
	if (grade.kind === 'gift' && saved?.giftAfter != null) {
		return {
			entry: { ...rest, synced: true, giftAfter: saved.giftAfter },
			message: `${name}: +1 Gift (${saved.giftAfter} Gift)`,
		};
	}
	if (grade.kind === 'cp' && saved?.cpAfter != null) {
		const points = saved.cpAfter;
		return {
			entry: {
				...rest,
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

export async function saveArenaGrade(
	courseId: string,
	entry: ArenaHistoryEntry,
	grade: ArenaGrade,
	name: string,
) {
	const saved = await arenaPost<RecallArenaTurnRecord>(arenaTurnsUrl(courseId), {
		...turnPayload(entry),
		grade,
	});
	return applySavedGrade(entry, grade, saved, name);
}

export function arenaErrorMessage(error: unknown) {
	if (
		error instanceof DOMException &&
		(error.name === 'TimeoutError' || error.name === 'AbortError')
	)
		return 'Máy chủ không trả lời kịp.';
	if (error instanceof TypeError) return 'Mất kết nối mạng.';
	return error instanceof Error ? error.message : 'Không lưu được, thử lại.';
}

/** Write a CP level straight to a session, for a pass whose save failed earlier. */
export async function awardArenaCp(
	target: { id: string } | null,
	weekNumber: number | undefined,
	enrollmentId: string,
	level: ArenaAwardLevel,
) {
	if (!target) {
		const week = weekNumber != null ? ` tuần ${weekNumber}` : '';
		throw new Error(`Lớp gốc không có buổi${week}, không ghi được CP.`);
	}
	return arenaPost<RecallArenaAwardResult>(
		`/api/admin/teaching/sessions/${target.id}/recall-arena`,
		{ enrollmentId, points: level },
	);
}
