'use client';

import type { TeachingSessionRecord } from '@/features/teaching/types';

import { isCpFinalized } from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

/** Session lock state in one line, with the button that opens CP for the week. */
export function ArenaCpStatus({
	session,
	opening,
	onOpen,
}: {
	session: TeachingSessionRecord;
	opening: boolean;
	onOpen: (sessionId: string) => void;
}) {
	if (session.participationOpen) {
		return (
			<span className={styles.setupHint} data-tone="ok">
				CP tuần {session.weekNumber} đang mở
			</span>
		);
	}
	return (
		<span className={setup.cpRow}>
			<span className={styles.setupHint} data-tone="bad">
				CP tuần {session.weekNumber} {isCpFinalized(session) ? 'đã chốt' : 'đang khóa'}
			</span>
			<button
				type="button"
				className={styles.smallButton}
				disabled={opening}
				onClick={() => onOpen(session.id)}
			>
				{opening ? 'Đang mở…' : `Mở chấm CP tuần ${session.weekNumber}`}
			</button>
		</span>
	);
}
