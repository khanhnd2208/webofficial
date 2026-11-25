'use client';

import { recallPreviewText } from '@/features/active-recall/richText';

import { ArenaMonster } from '@/components/teaching/arena/ArenaFigures';
import type { ArenaBoss } from '@/components/teaching/arena/arenaBosses';

import type { TestSession } from './testSession';
import styles from './testYourself.module.css';

const HARDEST_SHOWN = 5;

/**
 * Between or after fights. Paused keeps the run (same card, queue and
 * language) so "Tiếp tục trận" picks up where the learner stopped; an ended
 * run offers a focused rematch on the cards that needed review.
 */
export default function TestYourselfSummary({
	boss,
	session,
	paused,
	questionOf,
	onResume,
	onEnd,
	onReplay,
	onPractice,
	onChooseDecks,
}: {
	boss: ArenaBoss;
	session: TestSession;
	paused: boolean;
	questionOf: (cardId: string) => string;
	onResume: () => void;
	onEnd: () => void;
	onReplay: () => void;
	onPractice: (cardIds: string[]) => void;
	onChooseDecks: () => void;
}) {
	const won = session.queue.length === 0 && session.total > 0;
	const againTotal = Object.values(session.again).reduce((sum, count) => sum + count, 0);
	const hardestAll = Object.entries(session.again).sort((left, right) => right[1] - left[1]);
	const hardest = hardestAll.slice(0, HARDEST_SHOWN);
	const hiddenCount = hardestAll.length - hardest.length;
	const left = session.total - session.known.length;

	const title = won ? 'Boss đã gục!' : paused ? 'Tạm dừng trận đấu' : 'Kết thúc phiên';
	const lead = won
		? 'Bạn đã nhớ được hết các câu trong phiên này.'
		: paused
			? `Bạn đã nhớ ${session.known.length}/${session.total} câu. Tiếp tục để quay lại đúng câu đang hỏi.`
			: `Bạn đã nhớ ${session.known.length}/${session.total} câu. Còn ${left} câu chưa đánh dấu nhớ.`;

	return (
		<section className={styles.summary} aria-labelledby="test-summary-title">
			<div className={styles.summaryBoss}>
				<ArenaMonster
					boss={boss}
					mood={won ? 'defeated' : paused ? 'idle' : 'laugh'}
					size={150}
					decorative
				/>
			</div>
			<p className={styles.kicker}>{boss.name}</p>
			<h2 id="test-summary-title" className={styles.summaryTitle}>
				{title}
			</h2>
			<p className={styles.summaryLead}>{lead}</p>
			{paused ? (
				<div className={styles.summaryActions}>
					<button type="button" className={styles.startButton} onClick={onResume}>
						Tiếp tục trận
					</button>
					<button type="button" className={styles.ghostButton} onClick={onEnd}>
						Kết thúc phiên
					</button>
				</div>
			) : null}
			<dl className={styles.stats}>
				<div>
					<dt>Nhớ được</dt>
					<dd>
						{session.known.length}/{session.total}
					</dd>
				</div>
				<div>
					<dt>Lượt hỏi</dt>
					<dd>{session.asked}</dd>
				</div>
				<div>
					<dt>Lần chọn ôn lại</dt>
					<dd>{againTotal}</dd>
				</div>
			</dl>
			{hardest.length ? (
				<div className={styles.hardest}>
					<h3>Những câu cần ôn thêm</h3>
					<ol>
						{hardest.map(([cardId, count]) => (
							<li key={cardId}>
								<span>{recallPreviewText(questionOf(cardId))}</span>
								<span className={styles.hardestCount}>×{count}</span>
							</li>
						))}
					</ol>
					{hiddenCount > 0 ? <p className={styles.hardestMore}>và {hiddenCount} câu khác</p> : null}
					{paused ? null : (
						<button
							type="button"
							className={styles.practiceButton}
							onClick={() => onPractice(hardestAll.map(([cardId]) => cardId))}
						>
							Ôn riêng {hardestAll.length} câu này
						</button>
					)}
				</div>
			) : null}
			{paused ? null : (
				<div className={styles.summaryActions}>
					<button type="button" className={styles.startButton} onClick={onReplay}>
						Đấu lại với boss mới
					</button>
					<button type="button" className={styles.ghostButton} onClick={onChooseDecks}>
						Chọn bộ câu hỏi khác
					</button>
				</div>
			)}
		</section>
	);
}
