'use client';

import { McIcon } from '@/components/myclass/ui';
import type { ArenaGroupFilter } from '@/features/teaching/domain/recallArena';
import type {
	RecallArenaDeck,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { isCpFinalized, playersInRoom, sessionLabel, type ArenaConfig } from './arenaGame';
import styles from './arena.module.css';

const FILTER_LABEL: Record<ArenaGroupFilter, string> = {
	ALL: 'Cả lớp',
	CHALLENGE: 'Chỉ Challenging',
	SUPPORT: 'Chỉ Supporting',
};

/** Decks the game draws from: an empty selection in config means every deck. */
export function selectedDeckIds(config: ArenaConfig, decks: RecallArenaDeck[]) {
	return config.deckIds.length ? config.deckIds : decks.map((deck) => deck.deckId);
}

/**
 * Lecturer-only settings in one compact panel: session, who can be called,
 * which decks, and CP status. Group names appear only here, never on the
 * game screen.
 */
export function ArenaSetup({
	config,
	sessions,
	tutorials,
	decks,
	players,
	session,
	started,
	openingCp,
	recallHref,
	onChange,
	onOpenCp,
	onReload,
	onDone,
	onClose,
}: {
	config: ArenaConfig;
	sessions: TeachingSessionRecord[];
	tutorials: Array<{ id: string; code: string }>;
	decks: RecallArenaDeck[];
	players: RecallArenaPlayer[];
	session: TeachingSessionRecord | null;
	/** True once the lecturer entered the game; the main button then just closes. */
	started: boolean;
	openingCp: boolean;
	recallHref: string;
	onChange: (next: ArenaConfig) => void;
	onOpenCp: () => void;
	onReload: () => void;
	onDone: () => void;
	onClose?: () => void;
}) {
	const inRoom = playersInRoom(players, session);
	const counts: Record<ArenaGroupFilter, number> = {
		ALL: inRoom.length,
		CHALLENGE: inRoom.filter((player) => player.group === 'CHALLENGE').length,
		SUPPORT: inRoom.filter((player) => player.group === 'SUPPORT').length,
	};
	const noGroup = inRoom.length - counts.CHALLENGE - counts.SUPPORT;
	const chosenDecks = selectedDeckIds(config, decks);
	const cardTotal = decks
		.filter((deck) => chosenDecks.includes(deck.deckId))
		.reduce((sum, deck) => sum + deck.cardCount, 0);

	function toggleDeck(deckId: string) {
		const current = new Set(chosenDecks);
		if (current.has(deckId)) current.delete(deckId);
		else current.add(deckId);
		const next = decks.map((deck) => deck.deckId).filter((id) => current.has(id));
		if (next.length === 0) return;
		onChange({ ...config, deckIds: next.length === decks.length ? [] : next });
	}

	return (
		<div className={styles.setupBackdrop} onClick={onClose}>
			<section
				className={styles.setup}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-setup-title"
				onClick={(event) => event.stopPropagation()}
			>
				<header className={styles.setupHead}>
					<h2 id="arena-setup-title">Thiết lập kiểm tra bài cũ</h2>
					{onClose ? (
						<button
							type="button"
							className={styles.iconButton}
							onClick={onClose}
							aria-label="Đóng thiết lập"
							title="Đóng (Esc)"
						>
							<McIcon name="close" size={20} />
						</button>
					) : null}
				</header>

				<div className={styles.setupRows}>
					<label className={styles.setupRow}>
						<span className={styles.setupLabel}>Buổi học</span>
						<span className={styles.setupControl}>
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
							<span
								className={styles.setupHint}
								data-tone={session && !inRoom.length ? 'bad' : undefined}
							>
								{session && !inRoom.length
									? 'Chưa ai được điểm danh có mặt ở buổi này.'
									: `${inRoom.length} bạn có mặt`}
							</span>
						</span>
					</label>

					<label className={styles.setupRow}>
						<span className={styles.setupLabel}>Gọi ai</span>
						<span className={styles.setupControl}>
							<select
								value={config.filter}
								onChange={(event) =>
									onChange({ ...config, filter: event.target.value as ArenaGroupFilter })
								}
							>
								{(Object.keys(FILTER_LABEL) as ArenaGroupFilter[]).map((filter) => (
									<option key={filter} value={filter}>
										{FILTER_LABEL[filter]} ({counts[filter]})
									</option>
								))}
							</select>
							{noGroup > 0 && config.filter !== 'ALL' ? (
								<span className={styles.setupHint}>
									{noGroup} bạn chưa chọn nhóm chỉ được gọi khi chọn “Cả lớp”.
								</span>
							) : null}
						</span>
					</label>

					<div className={styles.setupRow}>
						<span className={styles.setupLabel}>Câu hỏi</span>
						<span className={styles.setupControl}>
							{decks.length === 0 ? (
								<span className={styles.setupHint}>
									Lớp chưa bật bộ thẻ Active Recall. <a href={recallHref}>Bật bộ thẻ</a> hoặc hỏi
									câu của bạn.
								</span>
							) : (
								<details className={styles.deckPicker}>
									<summary>
										<span>
											{chosenDecks.length === decks.length
												? `Tất cả ${decks.length} bộ thẻ`
												: `${chosenDecks.length}/${decks.length} bộ thẻ`}{' '}
											· {cardTotal} câu
										</span>
										<McIcon name="expand_more" size={18} />
									</summary>
									<div className={styles.deckList}>
										{decks.map((deck) => {
											const checked = chosenDecks.includes(deck.deckId);
											return (
												<label key={deck.deckId} className={styles.deckOption}>
													<input
														type="checkbox"
														checked={checked}
														disabled={checked && chosenDecks.length === 1}
														onChange={() => toggleDeck(deck.deckId)}
													/>
													<span>
														{deck.lessonLabel && deck.lessonLabel !== deck.title
															? `${deck.lessonLabel} · `
															: ''}
														{deck.title}
													</span>
													<span className={styles.count}>{deck.cardCount}</span>
												</label>
											);
										})}
									</div>
								</details>
							)}
						</span>
					</div>

					<div className={styles.setupRow}>
						<span className={styles.setupLabel}>Điểm CP</span>
						<span className={styles.setupControl}>
							{!session ? (
								<span className={styles.setupHint}>Chọn buổi học trước.</span>
							) : session.participationOpen ? (
								<span className={styles.setupHint} data-tone="ok">
									CP tuần {session.weekNumber} đang mở · chấm Đạt giữ mức cao hơn
								</span>
							) : (
								<span className={styles.cpLocked}>
									<span className={styles.setupHint} data-tone="bad">
										CP tuần {session.weekNumber} {isCpFinalized(session) ? 'đã chốt' : 'đang khóa'}
									</span>
									<button
										type="button"
										className={styles.smallButton}
										disabled={openingCp}
										onClick={onOpenCp}
									>
										{openingCp ? 'Đang mở…' : `Mở chấm CP tuần ${session.weekNumber}`}
									</button>
								</span>
							)}
						</span>
					</div>
				</div>

				<footer className={styles.setupFoot}>
					<button
						type="button"
						className={styles.linkButton}
						onClick={onReload}
						title="Lấy lại điểm danh mới nhất. Lịch sử gọi vẫn giữ."
					>
						Tải lại điểm danh
					</button>
					<button
						type="button"
						className={styles.startButton}
						disabled={!session || counts[config.filter] === 0}
						onClick={onDone}
					>
						{started ? 'Xong' : 'Vào trận'}
					</button>
				</footer>
			</section>
		</div>
	);
}
