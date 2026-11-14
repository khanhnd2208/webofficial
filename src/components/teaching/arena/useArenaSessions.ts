'use client';

import { useState } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import type {
	RecallArenaData,
	TeachingParticipationMutationResult,
} from '@/features/teaching/types';

import { isCpFinalized } from './arenaGame';
import { arenaErrorMessage } from './arenaTurnLog';

/**
 * The course's sessions as the arena sees them, and the action that opens CP
 * grading for a week that is still locked or already finalized.
 */
export function useArenaSessions(data: RecallArenaData, onError: (message: string) => void) {
	const [sessions, setSessions] = useState(() => data.classes.flatMap((item) => item.sessions));
	const [openingCpId, setOpeningCpId] = useState<string | null>(null);

	async function openCp(sessionId: string) {
		const session = sessions.find((item) => item.id === sessionId);
		if (!session) return;
		setOpeningCpId(sessionId);
		try {
			const result = await teachingApi<TeachingParticipationMutationResult>(
				`/api/admin/teaching/sessions/${session.id}/participation/lock`,
				{
					method: 'PATCH',
					body: JSON.stringify({ action: isCpFinalized(session) ? 'unfinalize' : 'open' }),
				},
			);
			setSessions((previous) =>
				previous.map((item) => (item.id === result.session.id ? result.session : item)),
			);
		} catch (error) {
			onError(arenaErrorMessage(error));
		} finally {
			setOpeningCpId(null);
		}
	}

	return { sessions, openingCpId, openCp };
}
