'use client';

import { m } from 'framer-motion';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { recallHasContent, recallToStoredHtml } from '@/features/active-recall/richText';
import { ARENA_AWARD_LEVELS, type ArenaAwardLevel } from '@/features/teaching/domain/recallArena';
import type { RecallArenaCard, RecallArenaPlayer } from '@/features/teaching/types';

import { ArenaCharacter } from './ArenaCharacter';
import { ArenaMonster } from './ArenaFigures';
import type { ArenaBoss } from './arenaBosses';
import type { ArenaCharacter as Character } from './arenaCharacters';
import { fullName, matchesPlayerSearch } from './arenaGame';
import styles from './arena.module.css';

function RichText({ html }: { html: string }) {
	return (
		<div
			className={`recall-text ${styles.richText}`}
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: recallToStoredHtml(html) }}
		/>
	);
}

/**
 * One card: question, language switch and the hidden answer. Keyed by card id
 * so "Đổi câu" resets the answer without rebuilding the whole dialog.
 */
function QuestionCard({ card, deckLabel }: { card: RecallArenaCard; deckLabel: string }) {
	const hasEn = recallHasContent(card.question);
	const hasVi = recallHasContent(card.questionVi);
	const [lang, setLang] = useState<'en' | 'vi'>(hasEn || !hasVi ? 'en' : 'vi');
	const [revealed, setRevealed] = useState(false);
	const useVi = lang === 'vi' && hasVi;
	const question = useVi ? card.questionVi : card.question;
	const answer = useVi && recallHasContent(card.answerVi) ? card.answerVi : card.answer;

	return (
		<div className={styles.questionCard}>
			<div className={styles.questionMeta}>
				<span>Câu hỏi{deckLabel ? ` · ${deckLabel}` : ''}</span>
				{hasEn && hasVi ? (
					<span className={styles.langSwitch} role="group" aria-label="Ngôn ngữ câu hỏi">
						<button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
							EN
						</button>
						<button type="button" aria-pressed={lang === 'vi'} onClick={() => setLang('vi')}>
							VI
						</button>
					</span>
				) : null}
			</div>
			<RichText html={question} />
			{revealed ? (
				<div className={styles.answer}>
					<span className={styles.answerLabel}>Đáp án</span>
					{recallHasContent(answer) ? (
						<RichText html={answer} />
					) : (
						<p className={styles.noCard}>Thẻ này chưa có đáp án.</p>
					)}
				</div>
			) : (
				<button
					type="button"
					className={styles.revealButton}
					onClick={() => setRevealed(true)}
					data-arena-key="a"
				>
					Hiện đáp án
				</button>
			)}
		</div>
	);
}

/** Who was caught, the question, and the lecturer's grading controls. */
export function ArenaCaught({
	player,
	character,
	boss,
	card,
	deckLabel,
	cpNow,
	manual,
	saving,
	canChangeCard,
	onPass,
	onBarePass,
	onFail,
	onSkipStudent,
	onChooseStudent,
	otherPlayers,
	onNextCard,
	onClose,
}: {
	player: RecallArenaPlayer;
	/** The student's hero, as shown on the floor. */
	character: Character;
	boss: ArenaBoss;
	card: RecallArenaCard | null;
	deckLabel: string;
	cpNow: number;
	manual: boolean;
	saving: boolean;
	canChangeCard: boolean;
	onPass: (level: ArenaAwardLevel) => void;
	onBarePass: () => void;
	onFail: () => void;
	onSkipStudent: () => void;
	onChooseStudent: (enrollmentId: string) => void;
	otherPlayers: RecallArenaPlayer[];
	onNextCard: () => void;
	/** Close without grading: the student keeps their turn. */
	onClose: () => void;
}) {
	const [choosing, setChoosing] = useState(false);
	const [query, setQuery] = useState('');
	const matches = otherPlayers.filter((candidate) => matchesPlayerSearch(candidate, query));
	return (
		<m.div
			className={styles.caughtBackdrop}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<m.section
				className={styles.caught}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-caught-name"
				initial={{ scale: 0.6, y: 80, opacity: 0 }}
				animate={{ scale: 1, y: 0, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 260, damping: 20 }}
			>
				<button
					type="button"
					className={`${styles.iconButton} ${styles.caughtClose}`}
					onClick={onClose}
					disabled={saving}
					aria-label="Đóng, không chấm"
					title="Đóng, không chấm (Esc). Bạn này vẫn giữ lượt."
					data-arena-key="escape"
				>
					<McIcon name="close" size={22} />
				</button>

				<div className={styles.caughtLayout}>
					<section
						className={styles.caughtScene}
						aria-label={`${fullName(player)} đối đầu ${boss.name}`}
					>
						<p className={styles.caughtEyebrow}>Quái vật đã bắt được</p>
						<div className={styles.duel}>
							<m.span
								className={styles.duelHero}
								initial={{ x: -45, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
							>
								<ArenaCharacter character={character} size={240} decorative={false} />
							</m.span>
							<span className={styles.duelVersus} aria-hidden="true">
								VS
							</span>
							<span className={styles.duelBoss}>
								<ArenaMonster boss={boss} mood="roar" size={184} decorative />
							</span>
						</div>
						<div className={styles.caughtWho}>
							<h2 id="arena-caught-name" className={styles.caughtName}>
								{fullName(player)}
							</h2>
							<p className={styles.caughtMeta}>
								{manual
									? 'Người ngoài danh sách · không ghi CP'
									: `${player.studentCode} · CP tuần này: ${cpNow}`}
							</p>
							<p className={styles.duelOpponent}>Đối đầu {boss.name}</p>
						</div>
					</section>

					{card ? (
						<QuestionCard key={card.id} card={card} deckLabel={deckLabel} />
					) : (
						<div className={styles.questionCard}>
							<p className={styles.noCard}>
								Không có thẻ câu hỏi trong bộ đã chọn. Hỏi câu của bạn rồi chấm như bình thường.
							</p>
						</div>
					)}
				</div>

				<div className={styles.grading}>
					<div
						className={styles.passGroup}
						role="group"
						aria-label={manual ? 'Đạt' : 'Đạt, chọn mức CP'}
					>
						<span className={styles.passLabel}>Đạt</span>
						{manual ? (
							<button
								type="button"
								className={styles.passButton}
								disabled={saving}
								onClick={() => onPass(1)}
								data-arena-key="1"
							>
								Đạt
							</button>
						) : (
							ARENA_AWARD_LEVELS.map((level, index) => (
								<button
									key={level}
									type="button"
									className={styles.passButton}
									disabled={saving}
									onClick={() => onPass(level)}
									data-arena-key={String(index + 1)}
									aria-label={`Đạt +${level}`}
								>
									+{level}
								</button>
							))
						)}
					</div>
					<button
						type="button"
						className={styles.barePassButton}
						disabled={saving}
						onClick={onBarePass}
						title="Qua lượt này, không cộng CP và không thêm Gift"
						data-arena-key="4"
					>
						Vừa đủ qua
					</button>
					<button
						type="button"
						className={styles.failButton}
						disabled={saving}
						onClick={onFail}
						data-arena-key="0"
					>
						{manual ? 'Chưa đạt' : 'Chưa đạt · +1 Gift'}
					</button>
					<span className={styles.gradingSpacer} />
					{canChangeCard ? (
						<button
							type="button"
							className={styles.textButton}
							disabled={saving}
							onClick={onNextCard}
							data-arena-key="q"
						>
							Đổi câu
						</button>
					) : null}
					{otherPlayers.length > 0 ? (
						<button
							type="button"
							className={styles.textButton}
							disabled={saving}
							onClick={onSkipStudent}
							data-arena-key="s"
						>
							Gọi ngẫu nhiên bạn khác
						</button>
					) : null}
					{otherPlayers.length > 0 ? (
						<button
							type="button"
							className={styles.textButton}
							disabled={saving}
							onClick={() => setChoosing((value) => !value)}
						>
							Gọi chỉ định
						</button>
					) : null}
				</div>
				{choosing ? (
					<div className={styles.choosePlayer}>
						<label htmlFor="arena-choose-player">Nhập tên hoặc mã sinh viên</label>
						<input
							id="arena-choose-player"
							type="search"
							autoFocus
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm bạn trong trận…"
						/>
						{query.trim() ? (
							<div className={styles.chooseResults}>
								{matches.length ? (
									matches.map((candidate) => (
										<button
											type="button"
											key={candidate.enrollmentId}
											onClick={() => onChooseStudent(candidate.enrollmentId)}
										>
											{fullName(candidate)} · {candidate.studentCode}
										</button>
									))
								) : (
									<p>Không tìm thấy bạn nào trong trận.</p>
								)}
							</div>
						) : null}
					</div>
				) : null}
				<p className={styles.shortcuts}>
					Phím tắt: <kbd>1</kbd>
					{manual ? (
						''
					) : (
						<>
							{' '}
							<kbd>2</kbd> <kbd>3</kbd>
						</>
					)}{' '}
					Đạt · <kbd>4</kbd> vừa đủ qua · <kbd>0</kbd> Chưa đạt · <kbd>A</kbd> đáp án · <kbd>Q</kbd>{' '}
					đổi câu · <kbd>S</kbd> bạn khác · <kbd>Esc</kbd> đóng
				</p>
			</m.section>
		</m.div>
	);
}
