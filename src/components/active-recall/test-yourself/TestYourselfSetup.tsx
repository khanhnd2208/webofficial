'use client';

import Link from 'next/link';

import type { RecallTestDeck } from '@/features/active-recall/testYourself';

import BossPicker from './BossPicker';
import { TEST_BOSSES } from './bossChoice';
import bossStyles from './bossPicker.module.css';
import styles from './testYourself.module.css';

export default function TestYourselfSetup({
	title,
	decks,
	selected,
	onToggle,
	onSelectAll,
	initialDeckSlug,
	bossChoice,
	onBossChange,
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
	/** A boss id, or `RANDOM_BOSS` for a different one each run. */
	bossChoice: string;
	onBossChange: (choice: string) => void;
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
	const selectedTitles = decks.filter((deck) => selected.has(deck.id)).map((deck) => deck.title);
	const startLabel =
		cardCount === 0
			? 'Chọn ít nhất một bộ'
			: onlyLinked
				? `Bắt đầu · ${cardCount} câu`
				: `Gặp boss · ${cardCount} câu`;

	const chosenBoss = TEST_BOSSES.find((boss) => boss.id === bossChoice);
	const bossSection = (
		<section className={bossStyles.section} aria-labelledby="test-boss-title">
			<div className={bossStyles.sectionHead}>
				<h2 id="test-boss-title" className={bossStyles.sectionTitle}>
					Boss
				</h2>
				<p className={bossStyles.sectionHint}>
					{chosenBoss ? chosenBoss.name : 'Mỗi trận một boss khác'} · đổi được giữa trận
				</p>
			</div>
			<BossPicker value={bossChoice} onChange={onBossChange} label="Chọn boss" withRandom />
		</section>
	);

	const startRow = (
		<div className={styles.startRow} data-linked={linked ? true : undefined}>
			{linked ? (
				<p className={styles.selectedDecks}>
					<span className={styles.kicker}>
						{selectedTitles.length > 1 ? `${selectedTitles.length} bộ đã chọn` : 'Bộ đã chọn'}
					</span>
					<span className={styles.selectedNames}>
						{selectedTitles.length ? selectedTitles.join(' · ') : 'Chưa chọn bộ nào'}
					</span>
				</p>
			) : null}
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
				<p className={styles.kicker}>{title}</p>
				<h1 className={styles.setupTitle}>Test yourself</h1>
				<p className={styles.setupLead}>
					Tự trả lời rồi mở đáp án để đối chiếu. Chọn <strong>Nhớ được</strong> để hạ máu boss hoặc{' '}
					<strong>Cần ôn lại</strong> để gặp lại câu đó trong lượt này.
				</p>
			</header>

			{linked ? (
				<>
					{startRow}
					{bossSection}
					{decks.length > 1 ? (
						<details className={styles.moreDecks}>
							<summary>Đổi hoặc chọn thêm bộ</summary>
							{picker}
						</details>
					) : null}
				</>
			) : (
				<>
					{picker}
					{bossSection}
					{startRow}
				</>
			)}
		</div>
	);
}
