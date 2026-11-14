'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

import { arenaCpSession, type ArenaAwardLevel } from '@/features/teaching/domain/recallArena';
import type { RecallArenaPlayer, TeachingSessionRecord } from '@/features/teaching/types';

import type { ArenaHistoryEntry, ArenaProgress } from './arenaGame';
import { arenaErrorMessage, awardArenaCp } from './arenaTurnLog';

/**
 * Each student's weekly CP as the arena knows it (the loaded value, or what
 * the server returned since), and saving again a CP award that failed.
 */
export function useArenaCp({
	playersById,
	hosts,
	sessions,
	setProgress,
	onToast,
}: {
	playersById: ReadonlyMap<string, RecallArenaPlayer>;
	hosts: readonly TeachingSessionRecord[];
	sessions: readonly TeachingSessionRecord[];
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	onToast: (toast: { tone: 'ok' | 'error'; text: string }) => void;
}) {
	const [overrides, setOverrides] = useState<Record<string, number>>({});
	const [retryingId, setRetryingId] = useState<string | null>(null);

	/** The session a correct answer is written to: always the student's own class. */
	function sessionFor(enrollmentId: string) {
		const player = playersById.get(enrollmentId);
		return player ? arenaCpSession(player, hosts, sessions) : null;
	}

	function cpFor(enrollmentId: string) {
		const target = sessionFor(enrollmentId);
		if (!target) return 0;
		return (
			overrides[`${target.id}:${enrollmentId}`] ?? playersById.get(enrollmentId)?.cp[target.id] ?? 0
		);
	}

	/** Keep CP the server returned, so the arena shows it without a reload. */
	function remember(sessionId: string, enrollmentId: string, points: number) {
		setOverrides((previous) => ({ ...previous, [`${sessionId}:${enrollmentId}`]: points }));
	}

	async function retry(entry: ArenaHistoryEntry) {
		if (!entry.award) return;
		setRetryingId(entry.id);
		try {
			const result = await awardArenaCp(
				sessionFor(entry.enrollmentId),
				hosts[0]?.weekNumber,
				entry.enrollmentId,
				entry.award as ArenaAwardLevel,
			);
			remember(result.sessionId, result.enrollmentId, result.points);
			setProgress((previous) => ({
				...previous,
				history: previous.history.map((item) =>
					item.id === entry.id
						? { ...item, saveError: undefined, cpAfter: result.points, synced: false }
						: item,
				),
			}));
			onToast({ tone: 'ok', text: `Đã ghi CP ${result.points} cho ${entry.name}` });
		} catch (error) {
			onToast({ tone: 'error', text: arenaErrorMessage(error) });
		} finally {
			setRetryingId(null);
		}
	}

	return { sessionFor, cpFor, remember, retryingId, retry };
}
