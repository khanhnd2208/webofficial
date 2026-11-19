'use client';

import Link from 'next/link';

import type { RecallTestDeck } from '@/features/active-recall/testYourself';

import styles from './testYourself.module.css';

export default function TestYourselfSetup({
	title,
	decks,
	selected,
	onToggle,
	onSelectAll,
	initialDeckSlug,
	onStart,
	backHref,
	backLabel,
}: {
	title: string;
	decks: RecallTestDeck[];
	selected: ReadonlySet<string>;
	onToggle: (deckId: string) => void;
	onSelectAll: (all: boolean) => void;
	/** The deck the link pointed to: start it first, other decks stay folded. */
	initialDeckSlug?: string;
	onStart: () => void;
	backHref: string;
	backLabel: string;
}) {
	const cardCount = decks
		.filter((deck) => selected.has(deck.id))
		.reduce((sum, deck) => sum + deck.cards.length, 0);
	const allSelected = selected.size === decks.length;
	const linked = decks.find((deck) => deck.slug === initialDeckSlug);
	const onlyLinked = linked && selected.size === 1 && selected.has(linked.id);
	const startLabel =
		cardCount === 0
			? 'Chọn ít nhất một bộ'
			: onlyLinked
				? `Bắt đầu ${linked.title} · ${cardCount} câu`
				: `Gặp boss · ${cardCount} câu`;

	const startRow = (
		<div className={styles.startRow} data-linked={linked ? true : undefined}>
			<button
				type="button"
				className={styles.startButton}
				disabled={cardCount === 0}
				onClick={onStart}
			>
				{startLabel}
			</button>
		</div>
	);

	const picker = (
		<fieldset className={styles.deckPicker}>
			<legend className={styles.deckLegend}>
				<span>Bộ câu hỏi</span>
				<button
					type="button"
					className={styles.linkButton}
					onClick={() => onSelectAll(!allSelected)}
				>
					{allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
				</button>
			</legend>
			<ul className={styles.deckList}>
				{decks.map((deck) => {
					const checked = selected.has(deck.id);
					return (
						<li key={deck.id}>
							<label className={styles.deckOption} data-checked={checked || undefined}>
								<input type="checkbox" checked={checked} onChange={() => onToggle(deck.id)} />
								<span className={styles.deckText}>
									{deck.lessonLabel && deck.lessonLabel !== deck.title ? (
										<span className={styles.deckLesson}>{deck.lessonLabel}</span>
									) : null}
									<span className={styles.deckName}>{deck.title}</span>
								</span>
								<span className={styles.deckCount}>{deck.cards.length} câu</span>
							</label>
						</li>
					);
				})}
			</ul>
		</fieldset>
	);

	return (
		<div className={styles.setup}>
			<Link href={backHref} className={styles.back}>
				← {backLabel}
			</Link>
			<header className={styles.setupHead}>
				<p className={styles.kicker}>Active Recall · {title}</p>
				<h1 className={styles.setupTitle}>Test yourself</h1>
				<p className={styles.setupLead}>
					Chọn bộ câu hỏi. Một boss ngẫu nhiên sẽ xuất hiện và hỏi bạn từng câu. Thử tự trả lời
					trước khi xem đáp án. Câu nào <strong>nhớ được</strong> thì boss mất máu và không hỏi lại;
					câu nào <strong>cần ôn lại</strong> thì boss sẽ hỏi lại bất ngờ trong phiên.
				</p>
			</header>

			{linked ? (
				<>
					{startRow}
					<details className={styles.moreDecks}>
						<summary>Đổi hoặc chọn thêm bộ</summary>
						{picker}
					</details>
				</>
			) : (
				<>
					{picker}
					{startRow}
				</>
			)}
		</div>
	);
}
