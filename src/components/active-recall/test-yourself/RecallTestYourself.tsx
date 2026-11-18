'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { recallHasContent, recallToStoredHtml } from '@/features/active-recall/richText';
import type { RecallTestDeck } from '@/features/active-recall/testYourself';

import { ArenaMonster, type MonsterMood } from '@/components/teaching/arena/ArenaFigures';
import { ARENA_BOSSES, type ArenaBoss } from '@/components/teaching/arena/arenaBosses';
import arenaStyles from '@/components/teaching/arena/arena.module.css';
import {
	isArenaMuted,
	playArenaSound,
	setArenaMuted,
	subscribeArenaMuted,
} from '@/components/teaching/arena/arenaSound';

import {
	bossHp,
	createTestSession,
	currentCard,
	markAgain,
	markKnown,
	skipCard,
	type TestSession,
} from './testSession';
import TestYourselfSetup from './TestYourselfSetup';
import TestYourselfSummary from './TestYourselfSummary';
import styles from './testYourself.module.css';

type Phase = 'setup' | 'battle' | 'summary';
type TestCard = RecallTestDeck['cards'][number] & { deckTitle: string };

/** Generic villains only: the illustrated sheets are portraits of real people. */
const TEST_BOSSES = ARENA_BOSSES.filter((boss) => boss.art.kind !== 'sheet');
const MOOD_MS: Partial<Record<MonsterMood, number>> = { roar: 900, hurt: 750, laugh: 1200 };
const VICTORY_MS = 1300;

function pickBoss(previousId?: string): ArenaBoss {
	const pool = TEST_BOSSES.filter((boss) => boss.id !== previousId);
	return pool[Math.floor(Math.random() * pool.length)] ?? TEST_BOSSES[0]!;
}

function RecallHtml({ html }: { html: string }) {
	return (
		<div
			className={`recall-text ${styles.recallText}`}
			dangerouslySetInnerHTML={{ __html: recallToStoredHtml(html) }}
		/>
	);
}

export default function RecallTestYourself({
	title,
	decks,
	initialDeckSlug,
	backHref,
	backLabel,
}: {
	title: string;
	decks: RecallTestDeck[];
	initialDeckSlug?: string;
	backHref: string;
	backLabel: string;
}) {
	const [selected, setSelected] = useState<Set<string>>(() => {
		const initial = decks.find((deck) => deck.slug === initialDeckSlug);
		return new Set(initial ? [initial.id] : decks.map((deck) => deck.id));
	});
	const [phase, setPhase] = useState<Phase>('setup');
	const [session, setSession] = useState<TestSession | null>(null);
	const [boss, setBoss] = useState<ArenaBoss>(TEST_BOSSES[0]!);
	const [mood, setMood] = useState<MonsterMood>('idle');
	const [revealed, setRevealed] = useState(false);
	const [viMode, setViMode] = useState(false);
	const [entry, setEntry] = useState(0);
	const moodTimer = useRef(0);
	const victoryTimer = useRef(0);
	const muted = useSyncExternalStore(subscribeArenaMuted, isArenaMuted, () => false);

	const cards = useMemo(() => {
		const map = new Map<string, TestCard>();
		for (const deck of decks) {
			for (const card of deck.cards) map.set(card.id, { ...card, deckTitle: deck.title });
		}
		return map;
	}, [decks]);

	const hasVi = useMemo(
		() =>
			decks.some(
				(deck) =>
					selected.has(deck.id) && deck.cards.some((card) => recallHasContent(card.questionVi)),
			),
		[decks, selected],
	);

	useEffect(
		() => () => {
			window.clearTimeout(moodTimer.current);
			window.clearTimeout(victoryTimer.current);
		},
		[],
	);

	const showMood = useCallback((next: MonsterMood) => {
		window.clearTimeout(moodTimer.current);
		setMood(next);
		const ms = MOOD_MS[next];
		if (ms) moodTimer.current = window.setTimeout(() => setMood('idle'), ms);
	}, []);

	const start = useCallback(
		(previousBossId?: string) => {
			const ids = decks
				.filter((deck) => selected.has(deck.id))
				.flatMap((deck) => deck.cards.map((card) => card.id));
			if (!ids.length) return;
			window.clearTimeout(victoryTimer.current);
			setSession(createTestSession(ids));
			setBoss(pickBoss(previousBossId));
			setRevealed(false);
			setEntry((value) => value + 1);
			setPhase('battle');
			showMood('roar');
			playArenaSound('boss');
			window.scrollTo?.({ top: 0 });
		},
		[decks, selected, showMood],
	);

	const reveal = useCallback(() => {
		if (revealed) return;
		setRevealed(true);
		playArenaSound('reveal');
	}, [revealed]);

	const answer = useCallback(
		(kind: 'known' | 'again' | 'skip') => {
			if (!session || phase !== 'battle') return;
			const next =
				kind === 'known'
					? markKnown(session)
					: kind === 'again'
						? markAgain(session)
						: skipCard(session);
			setSession(next);
			setRevealed(false);
			if (kind === 'known' && next.queue.length === 0) {
				window.clearTimeout(moodTimer.current);
				setMood('defeated');
				playArenaSound('finisher');
				victoryTimer.current = window.setTimeout(() => {
					setPhase('summary');
					playArenaSound('victory');
				}, VICTORY_MS);
				return;
			}
			if (kind === 'known') {
				showMood('hurt');
				playArenaSound('hit');
			} else if (kind === 'again') {
				showMood('laugh');
				playArenaSound('laugh');
			} else {
				showMood('idle');
			}
		},
		[phase, session, showMood],
	);

	useEffect(() => {
		if (phase !== 'battle') return;
		const onKey = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest('a, button, input, textarea, select, [contenteditable="true"]')
			)
				return;
			if (event.key === ' ' || event.key === 'Enter') {
				event.preventDefault();
				reveal();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				answer('skip');
			} else if (revealed && event.key === '1') {
				answer('again');
			} else if (revealed && event.key === '2') {
				answer('known');
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [answer, phase, reveal, revealed]);

	const toggleDeck = useCallback((deckId: string) => {
		setSelected((previous) => {
			const next = new Set(previous);
			if (next.has(deckId)) next.delete(deckId);
			else next.add(deckId);
			return next;
		});
	}, []);

	const selectAll = useCallback(
		(all: boolean) => setSelected(new Set(all ? decks.map((deck) => deck.id) : [])),
		[decks],
	);

	const questionOf = useCallback((cardId: string) => cards.get(cardId)?.question ?? '', [cards]);

	if (phase === 'setup' || !session) {
		return (
			<main className={styles.root}>
				<TestYourselfSetup
					title={title}
					decks={decks}
					selected={selected}
					onToggle={toggleDeck}
					onSelectAll={selectAll}
					onStart={() => start()}
					backHref={backHref}
					backLabel={backLabel}
				/>
			</main>
		);
	}

	if (phase === 'summary') {
		return (
			<main className={styles.root}>
				<TestYourselfSummary
					boss={boss}
					session={session}
					questionOf={questionOf}
					onReplay={() => start(boss.id)}
					onChooseDecks={() => setPhase('setup')}
				/>
			</main>
		);
	}

	const cardId = currentCard(session);
	const card = cardId ? cards.get(cardId) : undefined;
	const hp = bossHp(session);
	const useVi = viMode && card && recallHasContent(card.questionVi);
	const question = card ? (useVi ? card.questionVi : card.question) : '';
	const answerHtml =
		card && (useVi && recallHasContent(card.answerVi) ? card.answerVi : card.answer);
	const timesAgain = cardId ? (session.again[cardId] ?? 0) : 0;

	return (
		<main className={styles.root} data-phase="battle">
			<div className={styles.battle}>
				<div className={styles.topBar}>
					<button type="button" className={styles.ghostButton} onClick={() => setPhase('summary')}>
						Dừng trận
					</button>
					<div className={styles.topTools}>
						{hasVi ? (
							<button
								type="button"
								className={styles.chip}
								aria-pressed={viMode}
								onClick={() => setViMode((value) => !value)}
							>
								{viMode ? 'EN' : 'VI'}
							</button>
						) : null}
						<button
							type="button"
							className={styles.chip}
							aria-pressed={!muted}
							onClick={() => setArenaMuted(!muted)}
						>
							{muted ? 'Âm thanh: tắt' : 'Âm thanh: bật'}
						</button>
					</div>
				</div>

				<div className={styles.bossHud}>
					<p className={styles.bossName}>{boss.name}</p>
					<div
						className={styles.hpBar}
						role="meter"
						aria-label="Máu của boss"
						aria-valuemin={0}
						aria-valuemax={session.total}
						aria-valuenow={hp}
					>
						<span style={{ width: `${(hp / session.total) * 100}%` }} />
					</div>
					<p className={styles.hpText}>
						Đã hạ {session.known.length}/{session.total} câu · còn {session.queue.length} câu trong
						lượt
					</p>
				</div>

				<div className={`${arenaStyles.monsterZone} ${styles.bossSlot}`}>
					<div key={entry} className={arenaStyles.monsterEntry}>
						<ArenaMonster boss={boss} mood={mood} size={200} decorative />
					</div>
				</div>

				{card ? (
					<section className={styles.bubble} aria-live="polite">
						<p className={styles.bubbleKicker}>
							<span>{card.deckTitle}</span>
							{timesAgain ? <span className={styles.again}>Hỏi lại lần {timesAgain}</span> : null}
						</p>
						<RecallHtml html={question} />
						{revealed && answerHtml ? (
							<div className={styles.answer}>
								<p className={styles.answerLabel}>Đáp án</p>
								<RecallHtml html={answerHtml} />
							</div>
						) : null}
					</section>
				) : null}

				<nav className={styles.actions} aria-label="Trả lời boss" hidden={!card}>
					{revealed ? (
						<>
							<button type="button" className={styles.againButton} onClick={() => answer('again')}>
								Chưa hiểu, kiểm tra lại tôi sau
								<kbd>1</kbd>
							</button>
							<button type="button" className={styles.knownButton} onClick={() => answer('known')}>
								Đã hiểu, không hỏi lại
								<kbd>2</kbd>
							</button>
							<button type="button" className={styles.ghostButton} onClick={() => answer('skip')}>
								Câu tiếp →
							</button>
						</>
					) : (
						<>
							<button type="button" className={styles.startButton} onClick={reveal}>
								Xem đáp án
							</button>
							<button type="button" className={styles.ghostButton} onClick={() => answer('skip')}>
								Câu tiếp →
							</button>
						</>
					)}
				</nav>
				<p className={styles.keyHint}>
					Space: xem đáp án · 1: kiểm tra lại sau · 2: đã hiểu · →: câu tiếp
				</p>
			</div>
		</main>
	);
}
