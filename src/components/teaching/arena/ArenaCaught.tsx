'use client';

import { m } from 'framer-motion';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
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
				<span>{deckLabel || 'Câu hỏi'}</span>
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
	card,
	deckLabel,
	cpNow,
	saving,
	canChangeCard,
	onPass,
	onFail,
	onSkipStudent,
	onNextCard,
	onClose,
}: {
	player: RecallArenaPlayer;
	card: RecallArenaCard | null;
	deckLabel: string;
	cpNow: number;
	saving: boolean;
	canChangeCard: boolean;
	onPass: (level: ArenaAwardLevel) => void;
	onFail: () => void;
	onSkipStudent: () => void;
	onNextCard: () => void;
	/** Close without grading: the student keeps their turn. */
	onClose: () => void;
}) {
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

				<header className={styles.caughtHead}>
					<m.span
						className={styles.caughtAvatar}
						initial={{ rotate: -18, y: -30 }}
						animate={{ rotate: [-18, 10, -6, 0], y: 0 }}
						transition={{ duration: 0.7 }}
					>
						<ArenaAvatar look={avatarLook(player.studentCode)} size={80} />
					</m.span>
					<div className={styles.caughtWho}>
						<p className={styles.caughtEyebrow}>Quái vật đã bắt được</p>
						<h2 id="arena-caught-name" className={styles.caughtName}>
							{fullName(player)}
						</h2>
						<p className={styles.caughtMeta}>
							{player.studentCode} · CP tuần này: {cpNow}
						</p>
					</div>
				</header>

				{card ? (
					<QuestionCard key={card.id} card={card} deckLabel={deckLabel} />
				) : (
					<div className={styles.questionCard}>
						<p className={styles.noCard}>
							Không có thẻ câu hỏi trong bộ đã chọn. Hỏi câu của bạn rồi chấm như bình thường.
						</p>
					</div>
				)}

				<div className={styles.grading}>
					<div className={styles.passGroup} role="group" aria-label="Đạt, chọn mức CP">
						<span className={styles.passLabel}>Đạt</span>
						{ARENA_AWARD_LEVELS.map((level, index) => (
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
						))}
					</div>
					<button
						type="button"
						className={styles.failButton}
						disabled={saving}
						onClick={onFail}
						data-arena-key="0"
					>
						Chưa đạt
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
					<button
						type="button"
						className={styles.textButton}
						disabled={saving}
						onClick={onSkipStudent}
						data-arena-key="s"
					>
						Gọi bạn khác
					</button>
				</div>
				<p className={styles.shortcuts}>
					Phím tắt: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Đạt · <kbd>0</kbd> Chưa đạt ·{' '}
					<kbd>A</kbd> đáp án · <kbd>Q</kbd> đổi câu · <kbd>S</kbd> bạn khác · <kbd>Esc</kbd> đóng
				</p>
			</m.section>
		</m.div>
	);
}
