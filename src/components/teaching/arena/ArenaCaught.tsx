'use client';

import { m } from 'framer-motion';
import { useState } from 'react';

import { recallHasContent, recallToStoredHtml } from '@/features/active-recall/richText';
import { ARENA_AWARD_LEVELS, type ArenaAwardLevel } from '@/features/teaching/domain/recallArena';
import type { RecallArenaCard, RecallArenaPlayer } from '@/features/teaching/types';

import { ArenaAvatar } from './ArenaFigures';
import { avatarLook, fullName } from './arenaGame';
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

/** Shows who was caught, the question, and the lecturer's grading controls. */
export function ArenaCaught({
	player,
	card,
	deckLabel,
	cpNow,
	saving,
	onPass,
	onFail,
	onSkipStudent,
	onNextCard,
}: {
	player: RecallArenaPlayer;
	card: RecallArenaCard | null;
	deckLabel: string;
	cpNow: number;
	saving: boolean;
	onPass: (level: ArenaAwardLevel) => void;
	onFail: () => void;
	onSkipStudent: () => void;
	onNextCard: () => void;
}) {
	const [revealed, setRevealed] = useState(false);
	const hasVi = Boolean(card && recallHasContent(card.questionVi));
	const [lang, setLang] = useState<'en' | 'vi'>('en');
	const question = card ? (lang === 'vi' && hasVi ? card.questionVi : card.question) : '';
	const answer = card
		? lang === 'vi' && recallHasContent(card.answerVi)
			? card.answerVi
			: card.answer
		: '';

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
				<header className={styles.caughtHead}>
					<m.span
						className={styles.caughtAvatar}
						initial={{ rotate: -18, y: -30 }}
						animate={{ rotate: [-18, 10, -6, 0], y: 0 }}
						transition={{ duration: 0.7 }}
					>
						<ArenaAvatar look={avatarLook(player.studentCode)} size={88} />
					</m.span>
					<div>
						<p className={styles.caughtEyebrow}>Quái vật đã bắt được</p>
						<h2 id="arena-caught-name" className={styles.caughtName}>
							{fullName(player)}
						</h2>
						<p className={styles.caughtMeta}>
							{player.studentCode} · CP tuần này: {cpNow}
						</p>
					</div>
				</header>

				<div className={styles.questionCard}>
					<div className={styles.questionMeta}>
						<span>{deckLabel || 'Câu hỏi'}</span>
						{hasVi ? (
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
					{card ? (
						<RichText html={question} />
					) : (
						<p className={styles.noCard}>
							Lớp chưa bật bộ thẻ Active Recall nào. Hỏi câu của bạn rồi chấm như bình thường.
						</p>
					)}
					{card ? (
						revealed ? (
							<div className={styles.answer}>
								<span className={styles.answerLabel}>Đáp án</span>
								<RichText html={answer} />
							</div>
						) : (
							<button
								type="button"
								className={styles.revealButton}
								onClick={() => setRevealed(true)}
								data-arena-key="a"
							>
								Hiện đáp án <kbd>A</kbd>
							</button>
						)
					) : null}
				</div>

				<div className={styles.grading}>
					<div className={styles.passGroup} role="group" aria-label="Đạt, chọn mức CP">
						{ARENA_AWARD_LEVELS.map((level, index) => (
							<button
								key={level}
								type="button"
								className={styles.passButton}
								disabled={saving}
								onClick={() => onPass(level)}
								data-arena-key={String(index + 1)}
							>
								Đạt +{level} <kbd>{index + 1}</kbd>
							</button>
						))}
					</div>
					<button
						type="button"
						className={styles.failButton}
						disabled={saving}
						onClick={onFail}
						data-arena-key="0"
					>
						Chưa đạt <kbd>0</kbd>
					</button>
					<span className={styles.gradingSpacer} />
					{card ? (
						<button
							type="button"
							className={styles.ghostButton}
							disabled={saving}
							onClick={() => {
								setRevealed(false);
								onNextCard();
							}}
							data-arena-key="q"
						>
							Đổi câu <kbd>Q</kbd>
						</button>
					) : null}
					<button
						type="button"
						className={styles.ghostButton}
						disabled={saving}
						onClick={onSkipStudent}
						data-arena-key="s"
					>
						Gọi bạn khác <kbd>S</kbd>
					</button>
				</div>
			</m.section>
		</m.div>
	);
}
