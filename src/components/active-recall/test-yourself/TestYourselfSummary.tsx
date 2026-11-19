'use client';

import { recallVisibleText } from '@/features/active-recall/richText';

import { ArenaMonster } from '@/components/teaching/arena/ArenaFigures';
import type { ArenaBoss } from '@/components/teaching/arena/arenaBosses';

import type { TestSession } from './testSession';
import styles from './testYourself.module.css';

const HARDEST_SHOWN = 5;

export default function TestYourselfSummary({
	boss,
	session,
	questionOf,
	onReplay,
	onChooseDecks,
}: {
	boss: ArenaBoss;
	session: TestSession;
	questionOf: (cardId: string) => string;
	onReplay: () => void;
	onChooseDecks: () => void;
}) {
	const won = session.queue.length === 0 && session.total > 0;
	const againTotal = Object.values(session.again).reduce((sum, count) => sum + count, 0);
	const hardest = Object.entries(session.again)
		.sort((left, right) => right[1] - left[1])
		.slice(0, HARDEST_SHOWN);

	return (
		<section className={styles.summary} aria-labelledby="test-summary-title">
			<div className={styles.summaryBoss}>
				<ArenaMonster boss={boss} mood={won ? 'defeated' : 'laugh'} size={150} decorative />
			</div>
			<p className={styles.kicker}>{boss.name}</p>
			<h2 id="test-summary-title" className={styles.summaryTitle}>
				{won ? 'Boss đã gục!' : 'Tạm dừng trận đấu'}
			</h2>
			<p className={styles.summaryLead}>
				{won
					? 'Bạn đã trả lời hiểu hết các câu trong phiên này.'
					: `Bạn đã hạ ${session.known.length}/${session.total} câu. Boss vẫn còn ${session.total - session.known.length} máu.`}
			</p>
			<dl className={styles.stats}>
				<div>
					<dt>Đã hiểu</dt>
					<dd>
						{session.known.length}/{session.total}
					</dd>
				</div>
				<div>
					<dt>Lượt hỏi</dt>
					<dd>{session.asked}</dd>
				</div>
				<div>
					<dt>Kiểm tra lại</dt>
					<dd>{againTotal}</dd>
				</div>
			</dl>
			{hardest.length ? (
				<div className={styles.hardest}>
					<h3>Những câu cần ôn thêm</h3>
					<ol>
						{hardest.map(([cardId, count]) => (
							<li key={cardId}>
								<span>{recallVisibleText(questionOf(cardId))}</span>
								<span className={styles.hardestCount}>×{count}</span>
							</li>
						))}
					</ol>
				</div>
			) : null}
			<div className={styles.summaryActions}>
				<button type="button" className={styles.startButton} onClick={onReplay}>
					Đấu lại với boss mới
				</button>
				<button type="button" className={styles.ghostButton} onClick={onChooseDecks}>
					Chọn bộ câu hỏi khác
				</button>
			</div>
		</section>
	);
}
