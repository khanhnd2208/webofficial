'use client';

import { useState } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import type {
	RecallArenaData,
	TeachingParticipationMutationResult,
} from '@/features/teaching/types';

import { isCpFinalized } from './arenaGame';

/** Every class's sessions, kept current when the lecturer opens CP grading from the arena. */
export function useArenaSessions(data: RecallArenaData, onError: (error: unknown) => void) {
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
			onError(error);
		} finally {
			setOpeningCpId(null);
		}
	}

	/** The class a session belongs to, by its code, for naming runs. */
	function classCodeOf(sessionId: string) {
		const classId = sessions.find((item) => item.id === sessionId)?.classId;
		return data.classes.find((item) => item.id === classId)?.classCode ?? '';
	}

	return { sessions, openingCpId, openCp, classCodeOf };
}
