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
	onStart,
	backHref,
	backLabel,
}: {
	title: string;
	decks: RecallTestDeck[];
	selected: ReadonlySet<string>;
	onToggle: (deckId: string) => void;
	onSelectAll: (all: boolean) => void;
	onStart: () => void;
	backHref: string;
	backLabel: string;
}) {
	const cardCount = decks
		.filter((deck) => selected.has(deck.id))
		.reduce((sum, deck) => sum + deck.cards.length, 0);
	const allSelected = selected.size === decks.length;

	return (
		<div className={styles.setup}>
			<Link href={backHref} className={styles.back}>
				← {backLabel}
			</Link>
			<header className={styles.setupHead}>
				<p className={styles.kicker}>Active Recall · {title}</p>
				<h1 className={styles.setupTitle}>Test yourself</h1>
				<p className={styles.setupLead}>
					Chọn bộ câu hỏi. Một boss ngẫu nhiên sẽ xuất hiện và hỏi bạn từng câu. Câu nào
					<strong> đã hiểu</strong> thì boss mất máu và không hỏi lại; câu nào
					<strong> chưa hiểu</strong> thì boss sẽ hỏi lại bất ngờ trong phiên.
				</p>
			</header>

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

			<div className={styles.startRow}>
				<button
					type="button"
					className={styles.startButton}
					disabled={cardCount === 0}
					onClick={onStart}
				>
					{cardCount === 0 ? 'Chọn ít nhất một bộ' : `Gặp boss · ${cardCount} câu`}
				</button>
			</div>
		</div>
	);
}
