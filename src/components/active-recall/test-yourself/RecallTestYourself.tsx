'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { recallHasContent, recallToStoredHtml } from '@/features/active-recall/richText';
import type { RecallTestDeck } from '@/features/active-recall/testYourself';

import { Icon } from '@/components/ui/Icon';
import { ArenaMonster, type MonsterMood } from '@/components/teaching/arena/ArenaFigures';
import type { ArenaBoss } from '@/components/teaching/arena/arenaBosses';
import arenaStyles from '@/components/teaching/arena/arena.module.css';
import {
	isArenaMuted,
	playArenaSound,
	setArenaMuted,
	subscribeArenaMuted,
} from '@/components/teaching/arena/arenaSound';

import { markCardKnown } from '../deckProgress';

import { splitAnswerExample } from './answerParts';
import {
	bossForRun,
	RANDOM_BOSS,
	readBossChoice,
	subscribeBossChoice,
	TEST_BOSSES,
	writeBossChoice,
} from './bossChoice';
import BossSwitch from './BossSwitch';
import stage from './battleScene.module.css';
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

type Phase = 'setup' | 'battle' | 'paused' | 'summary';
type TestCard = RecallTestDeck['cards'][number] & { deckId: string; deckTitle: string };

const MOOD_MS: Partial<Record<MonsterMood, number>> = { roar: 900, hurt: 750, laugh: 1200 };
const VICTORY_MS = 1300;
const CHEER_MS = 1400;

function LanguageSwitch({ vi, onChange }: { vi: boolean; onChange: (vi: boolean) => void }) {
	return (
		<div className={styles.langSwitch} role="group" aria-label="Ngôn ngữ thẻ">
			<button type="button" aria-pressed={!vi} onClick={() => onChange(false)}>
				EN
			</button>
			<button type="button" aria-pressed={vi} onClick={() => onChange(true)}>
				VI
			</button>
		</div>
	);
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
	const [cheer, setCheer] = useState(0);
	const moodTimer = useRef(0);
	const victoryTimer = useRef(0);
	const cheerTimer = useRef(0);
	const muted = useSyncExternalStore(subscribeArenaMuted, isArenaMuted, () => false);
	const bossChoice = useSyncExternalStore(subscribeBossChoice, readBossChoice, () => RANDOM_BOSS);

	const cards = useMemo(() => {
		const map = new Map<string, TestCard>();
		for (const deck of decks) {
			for (const card of deck.cards) {
				map.set(card.id, { ...card, deckId: deck.id, deckTitle: deck.title });
			}
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
			window.clearTimeout(cheerTimer.current);
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
		(previousBossId?: string, onlyIds?: readonly string[]) => {
			const ids =
				onlyIds ??
				decks
					.filter((deck) => selected.has(deck.id))
					.flatMap((deck) => deck.cards.map((card) => card.id));
			if (!ids.length) return;
			window.clearTimeout(victoryTimer.current);
			window.clearTimeout(cheerTimer.current);
			setCheer(0);
			setSession(createTestSession(ids));
			setBoss(bossForRun(readBossChoice(), previousBossId));
			setRevealed(false);
			setEntry((value) => value + 1);
			setPhase('battle');
			showMood('roar');
			playArenaSound('boss');
			window.scrollTo?.({ top: 0 });
		},
		[decks, selected, showMood],
	);

	/** Mid-run swap: same cards, same HP, a new face (and the next runs keep it). */
	const switchBoss = useCallback(
		(bossId: string) => {
			const next = TEST_BOSSES.find((candidate) => candidate.id === bossId);
			if (!next) return;
			writeBossChoice(next.id);
			setBoss(next);
			setEntry((value) => value + 1);
			showMood('roar');
			playArenaSound('boss');
		},
		[showMood],
	);

	const reveal = useCallback(() => {
		if (revealed) return;
		setRevealed(true);
		playArenaSound('reveal');
	}, [revealed]);

	const answer = useCallback(
		(kind: 'known' | 'again' | 'skip') => {
			if (!session || phase !== 'battle') return;
			const head = currentCard(session);
			const recalled = kind === 'known' && head !== null && (session.again[head] ?? 0) > 0;
			const next =
				kind === 'known'
					? markKnown(session)
					: kind === 'again'
						? markAgain(session)
						: skipCard(session);
			setSession(next);
			setRevealed(false);
			// A test answer counts toward the deck's progress, like grading in study.
			const graded = head ? cards.get(head) : undefined;
			if (graded && kind !== 'skip') markCardKnown(graded.deckId, graded.id, kind === 'known');
			if (recalled) {
				// Remembering a card that once slipped is the win active recall is
				// for: it gets its own label, even on the finishing blow.
				window.clearTimeout(cheerTimer.current);
				setCheer((value) => value + 1);
				cheerTimer.current = window.setTimeout(() => setCheer(0), CHEER_MS);
			}
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
			if (recalled) {
				// The boss reels: a combo hit instead of the plain one.
				showMood('hurt');
				playArenaSound('combo');
			} else if (kind === 'known') {
				showMood('hurt');
				playArenaSound('hit');
			} else {
				// An honest "not yet" stays quiet: the card simply comes back later.
				showMood('idle');
			}
		},
		[cards, phase, session, showMood],
	);

	useEffect(() => {
		if (phase !== 'battle') return;
		const onKey = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest('a, button, input, textarea, select, dialog, [contenteditable="true"]')
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

	const questionOf = useCallback(
		(cardId: string) => {
			const card = cards.get(cardId);
			if (!card) return '';
			return viMode && recallHasContent(card.questionVi) ? card.questionVi : card.question;
		},
		[cards, viMode],
	);

	if (phase === 'setup' || !session) {
		return (
			<main className={styles.root}>
				<TestYourselfSetup
					title={title}
					decks={decks}
					selected={selected}
					onToggle={toggleDeck}
					onSelectAll={selectAll}
					initialDeckSlug={initialDeckSlug}
					bossChoice={bossChoice}
					onBossChange={writeBossChoice}
					onStart={() => start()}
					backHref={backHref}
					backLabel={backLabel}
				/>
			</main>
		);
	}

	if (phase === 'summary' || phase === 'paused') {
		return (
			<main className={styles.root}>
				<TestYourselfSummary
					boss={boss}
					session={session}
					paused={phase === 'paused'}
					sameBoss={bossChoice !== RANDOM_BOSS}
					questionOf={questionOf}
					onResume={() => setPhase('battle')}
					onEnd={() => setPhase('summary')}
					onReplay={() => start(boss.id, [...session.known, ...session.queue])}
					onPractice={(ids) => start(boss.id, ids)}
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
	const parts = revealed && answerHtml ? splitAnswerExample(recallToStoredHtml(answerHtml)) : null;
	const timesAgain = cardId ? (session.again[cardId] ?? 0) : 0;
	const enraged = session.total >= 2 && hp > 0 && hp <= session.total / 2;

	return (
		<main className={styles.root} data-phase="battle">
			<div className={styles.battle} data-revealed={revealed || undefined}>
				<div className={styles.topBar}>
					<button
						type="button"
						className={styles.ghostButton}
						disabled={!card}
						onClick={() => setPhase('paused')}
					>
						Dừng trận
					</button>
					<div className={styles.topTools}>
						<BossSwitch bossId={boss.id} onPick={switchBoss} disabled={!card} crowded={hasVi} />
						{hasVi ? <LanguageSwitch vi={viMode} onChange={setViMode} /> : null}
						<button
							type="button"
							className={styles.chip}
							aria-label="Âm thanh"
							title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
							aria-pressed={!muted}
							onClick={() => setArenaMuted(!muted)}
						>
							<Icon name={muted ? 'volume_off' : 'volume_up'} size={20} aria-hidden="true" />
						</button>
					</div>
				</div>

				<div className={styles.bossColumn}>
					<div className={styles.bossHud} data-enraged={enraged || undefined}>
						{revealed ? (
							<div className={styles.miniBoss}>
								<ArenaMonster boss={boss} mood="idle" size={56} enraged={enraged} decorative />
							</div>
						) : null}
						<div className={styles.hudText}>
							<p className={styles.bossName} aria-live="polite">
								{boss.name}
							</p>
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
								Đã nhớ {session.known.length}/{session.total} câu · còn {session.queue.length} câu
								trong lượt
							</p>
						</div>
					</div>

					<div
						className={`${styles.bossSlot} ${stage.scene}`}
						data-enraged={enraged || undefined}
						data-stunned={cheer ? true : undefined}
					>
						<div key={entry} className={`${arenaStyles.monsterEntry} ${stage.actor}`}>
							<ArenaMonster boss={boss} mood={mood} size={200} enraged={enraged} decorative />
						</div>
						{cheer ? (
							<p key={`cheer-${cheer}`} className={styles.cheer} role="status">
								Đã nhớ lại!
							</p>
						) : null}
					</div>
				</div>

				{card ? (
					<section className={styles.bubble} aria-live="polite">
						<p className={styles.bubbleKicker}>
							<span>{card.deckTitle}</span>
							{timesAgain ? <span className={styles.again}>Hỏi lại lần {timesAgain}</span> : null}
						</p>
						<RecallHtml html={question} />
						{revealed && parts ? (
							<div className={styles.answer}>
								<p className={styles.answerLabel}>Ý cần nhớ</p>
								<RecallHtml html={parts.main} />
								{parts.example ? (
									<div className={styles.example}>
										<p className={styles.exampleLabel}>Ví dụ</p>
										<RecallHtml html={parts.example} />
									</div>
								) : null}
							</div>
						) : null}
						{!revealed ? (
							<p className={styles.recallPrompt}>Thử trả lời thành tiếng trước khi xem đáp án.</p>
						) : null}
					</section>
				) : null}

				<nav className={styles.actions} aria-label="Trả lời boss" hidden={!card}>
					{revealed ? (
						<>
							<div className={styles.gradeRow}>
								<button
									type="button"
									className={styles.againButton}
									onClick={() => answer('again')}
								>
									<Icon name="retry" size={18} aria-hidden="true" /> Cần ôn lại
									<kbd aria-hidden="true">1</kbd>
								</button>
								<button
									type="button"
									className={styles.knownButton}
									onClick={() => answer('known')}
								>
									<Icon name="check" size={18} aria-hidden="true" /> Nhớ được
									<kbd aria-hidden="true">2</kbd>
								</button>
							</div>
							<button type="button" className={styles.laterButton} onClick={() => answer('skip')}>
								Để cuối lượt →
							</button>
						</>
					) : (
						<>
							<button type="button" className={styles.startButton} onClick={reveal}>
								Xem đáp án
							</button>
							<button type="button" className={styles.laterButton} onClick={() => answer('skip')}>
								Để cuối lượt →
							</button>
						</>
					)}
				</nav>
				<p className={styles.keyHint}>
					{revealed ? '1 · Cần ôn lại　 2 · Nhớ được' : 'Space · Xem đáp án'}　 → · Để cuối lượt
				</p>
			</div>
		</main>
	);
}
