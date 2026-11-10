'use client';

import type { ArenaGroupFilter } from '@/features/teaching/domain/recallArena';
import type {
	RecallArenaDeck,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { isCpFinalized, playersInRoom, sessionLabel, type ArenaConfig } from './arenaGame';
import styles from './arena.module.css';

const FILTERS: Array<{ value: ArenaGroupFilter; label: string }> = [
	{ value: 'ALL', label: 'Cả lớp' },
	{ value: 'CHALLENGE', label: 'Chỉ Challenging' },
	{ value: 'SUPPORT', label: 'Chỉ Supporting' },
];

/**
 * Lecturer-only setup: session, who can be called, which decks. Group names
 * appear only here, never on the game screen.
 */
export function ArenaSetup({
	config,
	sessions,
	tutorials,
	decks,
	players,
	session,
	openingCp,
	recallHref,
	onChange,
	onOpenCp,
	onStart,
	onClose,
}: {
	config: ArenaConfig;
	sessions: TeachingSessionRecord[];
	tutorials: Array<{ id: string; code: string }>;
	decks: RecallArenaDeck[];
	players: RecallArenaPlayer[];
	session: TeachingSessionRecord | null;
	openingCp: boolean;
	recallHref: string;
	onChange: (next: ArenaConfig) => void;
	onOpenCp: () => void;
	onStart: () => void;
	onClose?: () => void;
}) {
	const inRoom = playersInRoom(players, session);
	const counts: Record<ArenaGroupFilter, number> = {
		ALL: inRoom.length,
		CHALLENGE: inRoom.filter((player) => player.group === 'CHALLENGE').length,
		SUPPORT: inRoom.filter((player) => player.group === 'SUPPORT').length,
	};
	const noGroup = inRoom.length - counts.CHALLENGE - counts.SUPPORT;
	const selectedDecks = config.deckIds.length ? config.deckIds : decks.map((deck) => deck.deckId);
	const cardTotal = decks
		.filter((deck) => selectedDecks.includes(deck.deckId))
		.reduce((sum, deck) => sum + deck.cardCount, 0);
	const attendanceMissing = Boolean(session && inRoom.length === 0);

	function toggleDeck(deckId: string) {
		const current = new Set(selectedDecks);
		if (current.has(deckId)) current.delete(deckId);
		else current.add(deckId);
		const next = decks.map((deck) => deck.deckId).filter((id) => current.has(id));
		onChange({ ...config, deckIds: next.length === decks.length ? [] : next });
	}

	return (
		<div className={styles.setupBackdrop}>
			<section
				className={styles.setup}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-setup-title"
			>
				<header className={styles.setupHead}>
					<h2 id="arena-setup-title">Thiết lập kiểm tra bài cũ</h2>
					{onClose ? (
						<button type="button" className={styles.ghostButton} onClick={onClose}>
							Đóng <kbd>Esc</kbd>
						</button>
					) : null}
				</header>

				<label className={styles.field}>
					<span className={styles.fieldLabel}>Buổi học</span>
					<select
						value={config.sessionId ?? ''}
						onChange={(event) => onChange({ ...config, sessionId: event.target.value || null })}
					>
						{sessions.length === 0 ? <option value="">Lớp chưa có buổi học</option> : null}
						{sessions.map((item) => (
							<option key={item.id} value={item.id}>
								{sessionLabel(item, tutorials)}
							</option>
						))}
					</select>
					<span className={styles.fieldHint}>
						{attendanceMissing
							? 'Buổi này chưa có ai được điểm danh có mặt. Điểm danh trước rồi mở lại.'
							: `${inRoom.length} sinh viên có mặt sẽ vào đấu trường.`}
					</span>
				</label>

				<fieldset className={styles.field}>
					<legend className={styles.fieldLabel}>Quái vật được bắt</legend>
					<div className={styles.segmented}>
						{FILTERS.map((filter) => (
							<button
								key={filter.value}
								type="button"
								aria-pressed={config.filter === filter.value}
								onClick={() => onChange({ ...config, filter: filter.value })}
							>
								{filter.label}
								<span className={styles.count}>{counts[filter.value]}</span>
							</button>
						))}
					</div>
					{noGroup > 0 ? (
						<span className={styles.fieldHint}>
							{noGroup} bạn có mặt chưa chọn nhóm: chỉ được bắt khi chọn “Cả lớp”.
						</span>
					) : null}
				</fieldset>

				<fieldset className={styles.field}>
					<legend className={styles.fieldLabel}>Bộ thẻ Active Recall</legend>
					{decks.length === 0 ? (
						<span className={styles.fieldHint}>
							Lớp chưa bật bộ thẻ nào. <a href={recallHref}>Bật bộ thẻ cho lớp</a>, hoặc chơi không
							có câu hỏi.
						</span>
					) : (
						<div className={styles.deckList}>
							{decks.map((deck) => (
								<label key={deck.deckId} className={styles.deckOption}>
									<input
										type="checkbox"
										checked={selectedDecks.includes(deck.deckId)}
										onChange={() => toggleDeck(deck.deckId)}
									/>
									<span>
										{deck.lessonLabel ? `${deck.lessonLabel} · ` : ''}
										{deck.title}
									</span>
									<span className={styles.count}>{deck.cardCount} thẻ</span>
								</label>
							))}
						</div>
					)}
					{decks.length ? (
						<span className={styles.fieldHint}>{cardTotal} câu hỏi trong các bộ đã chọn.</span>
					) : null}
				</fieldset>

				<div className={styles.field}>
					<span className={styles.fieldLabel}>Điểm CP</span>
					{!session ? null : session.participationOpen ? (
						<span className={styles.fieldHint} data-tone="ok">
							CP tuần {session.weekNumber} đang mở. Chấm Đạt sẽ ghi vào CP, giữ mức cao hơn.
						</span>
					) : (
						<span className={styles.cpLocked}>
							<span>
								CP tuần {session.weekNumber} {isCpFinalized(session) ? 'đã chốt' : 'đang khóa'}:
								chấm Đạt chưa được ghi điểm.
							</span>
							<button
								type="button"
								className={styles.ghostButton}
								disabled={openingCp}
								onClick={onOpenCp}
							>
								{openingCp ? 'Đang mở…' : `Mở chấm CP tuần ${session.weekNumber}`}
							</button>
						</span>
					)}
				</div>

				<footer className={styles.setupFoot}>
					<button
						type="button"
						className={styles.startButton}
						disabled={!session || counts[config.filter] === 0}
						onClick={onStart}
					>
						Vào trận
					</button>
				</footer>
			</section>
		</div>
	);
}
