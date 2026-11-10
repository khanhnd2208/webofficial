'use client';

import type { RecallArenaData } from '@/features/teaching/types';

import type { ArenaConfig } from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

/** Step 3: tick one or more lessons; questions are drawn from all of them together. */
export function ArenaSetupLessons({
	data,
	config,
	onChange,
}: {
	data: RecallArenaData;
	config: ArenaConfig;
	onChange: (next: ArenaConfig) => void;
}) {
	const chosen = new Set(config.deckIds);
	const cardTotal = data.decks
		.filter((deck) => chosen.has(deck.deckId))
		.reduce((sum, deck) => sum + deck.cardCount, 0);

	function setDecks(next: Set<string>) {
		// Keep course order so the choice reads the same every time.
		onChange({
			...config,
			deckIds: data.decks.map((deck) => deck.deckId).filter((id) => next.has(id)),
		});
	}

	function toggle(deckId: string) {
		const next = new Set(chosen);
		if (next.has(deckId)) next.delete(deckId);
		else next.add(deckId);
		setDecks(next);
	}

	if (data.decks.length === 0) {
		return (
			<p className={styles.setupHint}>
				Môn này chưa có bộ thẻ Active Recall nào có câu hỏi. Bạn vẫn chơi được bằng câu hỏi của
				mình.
			</p>
		);
	}

	return (
		<div className={setup.section}>
			<div className={setup.sectionHead}>
				<span className={styles.setupHint}>
					{chosen.size
						? `Hỏi trộn ${chosen.size} bài · ${cardTotal} câu`
						: 'Chưa chọn bài: bạn tự đặt câu hỏi cho từng lượt.'}
				</span>
				<span className={setup.footActions}>
					<button
						type="button"
						className={styles.smallButton}
						disabled={chosen.size === data.decks.length}
						onClick={() => setDecks(new Set(data.decks.map((deck) => deck.deckId)))}
					>
						Chọn tất cả
					</button>
					<button
						type="button"
						className={styles.smallButton}
						disabled={chosen.size === 0}
						onClick={() => setDecks(new Set())}
					>
						Bỏ chọn
					</button>
				</span>
			</div>
			<div className={setup.lessonList}>
				{data.decks.map((deck) => (
					<label key={deck.deckId} className={styles.deckOption}>
						<input
							type="checkbox"
							checked={chosen.has(deck.deckId)}
							onChange={() => toggle(deck.deckId)}
						/>
						<span>
							{deck.lessonLabel && deck.lessonLabel !== deck.title ? `${deck.lessonLabel} · ` : ''}
							{deck.title}
							{deck.status === 'DRAFT' ? <span className={setup.draft}> Bản nháp</span> : null}
						</span>
						<span className={styles.count}>{deck.cardCount}</span>
					</label>
				))}
			</div>
		</div>
	);
}
