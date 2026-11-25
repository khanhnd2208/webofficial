'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';

import { parseDeckHeading } from '@/features/active-recall/deckHeading';
import { Icon } from '@/components/ui/Icon';

import { parseProgressSnapshot, progressSnapshot, subscribeDeckProgress } from './deckProgress';
import styles from './RecallCourseIndex.module.css';

export type RecallIndexDeck = {
	id: string;
	href: string;
	title: string;
	lessonLabel: string;
	description: string;
	cardIds: string[];
};

export type RecallIndexGroup = {
	id: string;
	title: string;
	decks: RecallIndexDeck[];
};

/**
 * Decks as numbered lesson lists with this browser's progress: where to pick
 * up, how much of each lesson is known, and (for one course) the mixed test.
 * One course passes a single group; the My space library passes one per course.
 */
export default function RecallCourseIndex({
	kicker = 'Ôn tập · Active Recall',
	title,
	groups,
	testHref,
}: {
	kicker?: string;
	title: string;
	groups: RecallIndexGroup[];
	testHref?: string;
}) {
	const decks = useMemo(() => groups.flatMap((group) => group.decks), [groups]);
	const snapshot = useSyncExternalStore(
		subscribeDeckProgress,
		() => progressSnapshot(decks),
		() => '[]',
	);
	const progress = useMemo(() => parseProgressSnapshot(snapshot), [snapshot]);
	const toRow = (deck: RecallIndexDeck) => {
		const heading = parseDeckHeading(deck.title, deck.lessonLabel);
		const stats = progress.get(deck.id);
		const total = deck.cardIds.length;
		const known = Math.min(stats?.known ?? 0, total);
		return { deck, heading, stats, total, known, done: total > 0 && known === total };
	};
	const sections = groups.map((group) => ({ ...group, rows: group.decks.map(toRow) }));
	const rows = sections.flatMap((section) => section.rows);
	const totalCards = rows.reduce((sum, row) => sum + row.total, 0);
	const knownCards = rows.reduce((sum, row) => sum + row.known, 0);
	const resume = rows
		.filter((row) => row.stats?.started && !row.done)
		.sort((left, right) => (right.stats?.studiedAt ?? 0) - (left.stats?.studiedAt ?? 0))[0];

	return (
		<main className={styles.page}>
			<div className={styles.inner}>
				<header className={styles.head}>
					<p className={styles.kicker}>{kicker}</p>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.lead}>
						Đọc câu hỏi, tự trả lời trong đầu, rồi lật thẻ và tự chấm. Thẻ nào chưa nhớ sẽ được ôn
						lại.
					</p>
					<div className={styles.overall}>
						<p>
							{sections.length > 1 ? (
								<>
									<span className="tabular-nums">{sections.length}</span> môn ·{' '}
								</>
							) : null}
							<span className="tabular-nums">{rows.length}</span> bài ·{' '}
							<span className="tabular-nums">{totalCards}</span> thẻ
							{knownCards > 0 ? (
								<>
									{' '}
									· <strong className="tabular-nums">Đã nhớ {knownCards}</strong>
								</>
							) : null}
						</p>
						{knownCards > 0 ? (
							<div
								className={styles.meter}
								role="meter"
								aria-label="Thẻ đã nhớ của tất cả các bài"
								aria-valuemin={0}
								aria-valuemax={totalCards}
								aria-valuenow={knownCards}
							>
								<span style={{ width: `${(knownCards / Math.max(totalCards, 1)) * 100}%` }} />
							</div>
						) : null}
					</div>
				</header>

				<div className={styles.actions}>
					{resume ? (
						<Link href={resume.deck.href} className={styles.resume}>
							<span className={styles.actionIcon} aria-hidden="true">
								<Icon name="play_arrow" size={22} />
							</span>
							<span className={styles.actionText}>
								<span className={styles.actionLabel}>Tiếp tục ôn</span>
								<span className={styles.actionTitle}>
									{resume.heading.number ? `Bài ${resume.heading.number} · ` : ''}
									{resume.heading.title}
								</span>
								<span className={styles.actionMeta}>
									{resume.stats && resume.stats.currentIndex >= 0
										? `Đang ở thẻ ${resume.stats.currentIndex + 1}/${resume.total} · `
										: ''}
									Đã nhớ {resume.known}/{resume.total}
								</span>
							</span>
							<Icon name="arrow_forward" size={20} aria-hidden="true" />
						</Link>
					) : null}
					{testHref ? (
						<Link href={testHref} className={styles.test}>
							<span className={styles.actionIcon} aria-hidden="true">
								<Icon name="quiz" size={22} />
							</span>
							<span className={styles.actionText}>
								<span className={styles.actionTitle}>Test yourself</span>
								<span className={styles.actionMeta}>
									Trộn câu hỏi từ các bài bạn chọn và đấu với boss.
								</span>
							</span>
							<Icon name="arrow_forward" size={20} aria-hidden="true" />
						</Link>
					) : null}
				</div>

				{rows.length === 0 ? (
					<p className={styles.empty}>Chưa có bộ thẻ nào được xuất bản.</p>
				) : null}
				{sections.map((section) => (
					<section key={section.id} aria-labelledby={`recall-group-${section.id}`}>
						<h2 id={`recall-group-${section.id}`} className={styles.sectionTitle}>
							{section.title}
						</h2>
						<ol className={styles.list}>
							{section.rows.map(({ deck, heading, stats, total, known, done }) => {
								const status = done
									? 'Đã nhớ hết'
									: known > 0
										? `Đã nhớ ${known}/${total}`
										: stats?.started
											? 'Đang học'
											: null;
								return (
									<li key={deck.id}>
										<Link href={deck.href} className={styles.row} data-done={done || undefined}>
											<span className={styles.num} aria-hidden="true">
												{done ? <Icon name="check" size={18} /> : (heading.number ?? '·')}
											</span>
											<span className={styles.rowBody}>
												<span className={styles.rowTitle}>
													{heading.number ? (
														<span className="sr-only">Bài {heading.number}: </span>
													) : null}
													{heading.title}
												</span>
												{deck.description ? (
													<span className={styles.rowDescription}>{deck.description}</span>
												) : null}
												<span className={styles.rowMeta}>
													<span className="tabular-nums">{total} thẻ</span>
													{status ? (
														<span className={styles.rowStatus} data-done={done || undefined}>
															{status}
														</span>
													) : null}
												</span>
												{known > 0 && !done ? (
													<span className={styles.rowBar} aria-hidden="true">
														<span style={{ width: `${(known / Math.max(total, 1)) * 100}%` }} />
													</span>
												) : null}
											</span>
											<Icon
												name="chevron_right"
												size={20}
												className={styles.chevron}
												aria-hidden="true"
											/>
										</Link>
									</li>
								);
							})}
						</ol>
					</section>
				))}
				<p className={styles.note}>Tiến độ chỉ lưu trên trình duyệt này, không cần đăng nhập.</p>
			</div>
		</main>
	);
}
