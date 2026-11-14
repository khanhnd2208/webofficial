'use client';

import { useState } from 'react';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { fullName, isManualPlayer, matchesPlayerSearch } from './arenaGame';
import styles from './arenaCaught.module.css';

const MAX_MATCHES = 8;

/**
 * After a missed answer: find the student who raised a hand to answer the
 * same question, or move on. Enter with an empty box moves on; Enter with a
 * single match picks that student.
 */
export function ArenaAssistPicker({
	failedName,
	candidates,
	onPick,
	onEnd,
}: {
	failedName: string;
	/** Everyone else in the game, including students already called today. */
	candidates: RecallArenaPlayer[];
	onPick: (enrollmentId: string) => void;
	onEnd: () => void;
}) {
	const [query, setQuery] = useState('');
	const typed = query.trim().length > 0;
	const matches = typed ? candidates.filter((player) => matchesPlayerSearch(player, query)) : [];

	return (
		<div className={styles.assist}>
			<div className={styles.assistAsk}>
				<label htmlFor="arena-assist-player">Có bạn nào trả lời thay {failedName}?</label>
				<input
					id="arena-assist-player"
					type="search"
					autoFocus
					autoComplete="off"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Escape') onEnd();
						if (event.key !== 'Enter') return;
						if (!typed) onEnd();
						else if (matches.length === 1) onPick(matches[0]!.enrollmentId);
					}}
					placeholder="Nhập tên hoặc mã sinh viên của bạn giơ tay"
				/>
				{typed ? (
					<div className={styles.assistResults}>
						{matches.length ? (
							matches.slice(0, MAX_MATCHES).map((candidate) => (
								<button
									type="button"
									key={candidate.enrollmentId}
									onClick={() => onPick(candidate.enrollmentId)}
								>
									<span>{fullName(candidate)}</span>
									{isManualPlayer(candidate.enrollmentId) ? null : (
										<span className={styles.chooseCode}>{candidate.studentCode}</span>
									)}
								</button>
							))
						) : (
							<p>Không tìm thấy bạn nào trong trận.</p>
						)}
						{matches.length > MAX_MATCHES ? (
							<p>Còn {matches.length - MAX_MATCHES} bạn nữa, hãy nhập thêm.</p>
						) : null}
					</div>
				) : (
					<p className={styles.assistHint}>
						Bạn trả lời thay được thưởng CP. Gift của {failedName} vẫn giữ nguyên.
					</p>
				)}
			</div>
			<button type="button" className={styles.assistEnd} onClick={onEnd}>
				Không ai · tiếp tục
				<kbd className={styles.key} aria-hidden="true">
					Enter
				</kbd>
			</button>
		</div>
	);
}
