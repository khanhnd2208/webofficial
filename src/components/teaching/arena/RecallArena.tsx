'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useMotionTier } from '@/components/motion';
import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import { recallVisibleText } from '@/features/active-recall/richText';
import {
	arenaCpSession,
	drawCard,
	drawFromBag,
	returnToBag,
	type ArenaAwardLevel,
} from '@/features/teaching/domain/recallArena';
import type {
	RecallArenaAwardResult,
	RecallArenaData,
	TeachingParticipationMutationResult,
} from '@/features/teaching/types';

import { ArenaCaught } from './ArenaCaught';
import { ArenaCharacterPreview } from './ArenaCharacterPreview';
import { lookToward, useArenaFx } from './ArenaEffects';
import { ArenaMonster, type MonsterMood } from './ArenaFigures';
import { ArenaFloor, type ArenaAttackCue } from './ArenaFloor';
import { ArenaHistory } from './ArenaHistory';
import { ArenaSetup } from './ArenaSetup';
import { ArenaTopBar } from './ArenaTopBar';
import {
	ARENA_MAX_HP,
	arenaGameKey,
	arenaRoster,
	bossName,
	callablePlayers,
	displayNames,
	emptyProgress,
	fullName,
	hostSessions,
	initialConfig,
	isCpFinalized,
	loadConfig,
	loadProgress,
	passStreak,
	saveConfig,
	saveProgress,
	type ArenaConfig,
	type ArenaHistoryEntry,
	type ArenaProgress,
	type ArenaResult,
} from './arenaGame';
import { playArenaSound } from './arenaSound';
import styles from './arena.module.css';

type Phase = 'idle' | 'hunting' | 'caught' | 'attacking' | 'victory';

/** Spotlight hops while the monster hunts, slowing down before it grabs someone. */
const HUNT_STEPS_MS = [70, 70, 80, 90, 100, 120, 140, 170, 210, 260, 320, 400];
/** After the spotlight stops: reticle, then the beam pulls, the jaws shut, the question opens. */
const GRAB_MS = { pull: 520, chomp: 1170, open: 1620 };
const LOW_HP = 3;
const LOOK_AHEAD = { x: 0, y: 0 };

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'Không lưu được, thử lại.';
}

export function RecallArena({
	data,
	initialClassId = null,
}: {
	data: RecallArenaData;
	/** Class the lecturer came from: it starts ticked. */
	initialClassId?: string | null;
}) {
	const { reduced: reducedMotion } = useMotionTier();
	const fx = useArenaFx(!reducedMotion);
	const courseId = data.course.id;
	const gameKey = arenaGameKey(courseId, data.todayIso);
	const [sessions, setSessions] = useState(() => data.classes.flatMap((item) => item.sessions));
	const [config, setConfig] = useState<ArenaConfig>(() =>
		initialConfig(data, initialClassId, null),
	);
	/** False until this browser's saved choices are read, so they are not overwritten first. */
	const [restored, setRestored] = useState(false);
	const [progress, setProgress] = useState<ArenaProgress>(emptyProgress);
	const [progressLoaded, setProgressLoaded] = useState(false);
	const [setupOpen, setSetupOpen] = useState(true);
	const [started, setStarted] = useState(false);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [phase, setPhase] = useState<Phase>('idle');
	const [mood, setMood] = useState<MonsterMood>('idle');
	const [highlightId, setHighlightId] = useState<string | null>(null);
	const [current, setCurrent] = useState<{
		catchId: string;
		enrollmentId: string;
		cardId: string | null;
	} | null>(null);
	const [cpOverrides, setCpOverrides] = useState<Record<string, number>>({});
	const [saving, setSaving] = useState(false);
	const [retryingId, setRetryingId] = useState<string | null>(null);
	const [openingCpId, setOpeningCpId] = useState<string | null>(null);
	const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
	const [huntAfterSkip, setHuntAfterSkip] = useState(false);
	const [look, setLook] = useState(LOOK_AHEAD);
	const [attackCue, setAttackCue] = useState<ArenaAttackCue | null>(null);
	const timers = useRef<number[]>([]);
	const monsterRef = useRef<HTMLDivElement>(null);
	const hpRef = useRef<HTMLDivElement>(null);
	const { worldRef, suck, layer, shake, flash, pop, sparks, fireworks, lock, grab, hold, release } =
		fx;
	const { confirm, dialog: confirmDialog } = useAdminConfirm();

	const hosts = useMemo(() => hostSessions(config, sessions), [config, sessions]);
	const playersById = useMemo(
		() => new Map(data.players.map((player) => [player.enrollmentId, player])),
		[data.players],
	);
	/** Everyone on the floor; the spotlight visits all of them. */
	const inRoom = useMemo(
		() => arenaRoster(data.players, hosts, config),
		[data.players, hosts, config],
	);
	const callable = useMemo(() => callablePlayers(inRoom, config.filter), [inRoom, config.filter]);
	const activeDeckIds = useMemo(() => new Set(config.deckIds), [config.deckIds]);
	const cards = useMemo(
		() => data.cards.filter((card) => activeDeckIds.has(card.deckId)),
		[data.cards, activeDeckIds],
	);
	const cardsById = useMemo(() => new Map(data.cards.map((card) => [card.id, card])), [data.cards]);
	const names = useMemo(() => displayNames(inRoom), [inRoom]);
	const nameOf = (enrollmentId: string) => {
		const player = playersById.get(enrollmentId);
		return names.get(enrollmentId) ?? player?.givenName ?? '';
	};
	const calledIds = useMemo(
		() =>
			new Set(
				progress.history
					.filter((entry) => entry.result !== 'skip')
					.map((entry) => entry.enrollmentId),
			),
		[progress.history],
	);

	// Restore this browser's choices once, after hydration. Sessions always
	// start at each class's default (today's), so they are not restored.
	useEffect(() => {
		setConfig(initialConfig(data, initialClassId, loadConfig(courseId)));
		setRestored(true);
		// Only on first load: later data changes come from the lecturer's own edits.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (restored) saveConfig(courseId, config, data.todayIso);
	}, [config, courseId, data.todayIso, restored]);

	// One game per course per day: who was called, boss HP and history.
	useEffect(() => {
		setProgress(loadProgress(gameKey));
		setProgressLoaded(true);
	}, [gameKey]);

	useEffect(() => {
		if (progressLoaded) saveProgress(gameKey, progress);
	}, [progress, progressLoaded, gameKey]);

	useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

	useEffect(() => {
		if (!toast) return;
		const timer = window.setTimeout(() => setToast(null), 3200);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const later = useCallback((ms: number, run: () => void) => {
		timers.current.push(window.setTimeout(run, ms));
	}, []);

	/** The session a correct answer is written to: always the student's own class. */
	const cpSessionFor = (enrollmentId: string) => {
		const player = playersById.get(enrollmentId);
		return player ? arenaCpSession(player, hosts, sessions) : null;
	};

	const cpFor = (enrollmentId: string) => {
		const target = cpSessionFor(enrollmentId);
		if (!target) return 0;
		return (
			cpOverrides[`${target.id}:${enrollmentId}`] ??
			playersById.get(enrollmentId)?.cp[target.id] ??
			0
		);
	};

	const startHunt = useCallback(() => {
		if (phase !== 'idle') return;
		const eligibleIds = callable.map((player) => player.enrollmentId);
		const draw = drawFromBag(progress.bag, eligibleIds, progress.lastPicked);
		if (!draw.picked) {
			setToast({ tone: 'error', text: 'Không có sinh viên nào trong trận ở nhóm đang chọn.' });
			return;
		}
		const picked = draw.picked;
		const card = drawCard(
			cards.map((item) => item.id),
			progress.usedCards,
		);
		setProgress((previous) => ({
			...previous,
			bag: draw.bag,
			lastPicked: picked,
			usedCards: card.used,
		}));
		setPhase('hunting');
		setMood('roar');
		playArenaSound('roar');
		shake('soft');
		const spot = (id: string | null) => {
			setHighlightId(id);
			setLook(lookToward(monsterRef.current, id));
		};
		const open = () => {
			setCurrent({
				catchId: `${Date.now().toString(36)}-${picked}`,
				enrollmentId: picked,
				cardId: card.cardId,
			});
			setPhase('caught');
			setMood('idle');
			playArenaSound('reveal');
		};
		// The spotlight visits everyone in the room, not only the chosen group,
		// so the class cannot tell who is in which group.
		const roomIds = inRoom.map((player) => player.enrollmentId);
		const steps = reducedMotion ? [] : HUNT_STEPS_MS;
		let elapsed = 0;
		let previousId: string | null = null;
		steps.forEach((step, index) => {
			elapsed += step;
			later(elapsed, () => {
				const pool = roomIds.length > 1 ? roomIds.filter((id) => id !== previousId) : roomIds;
				previousId = pool[Math.floor(Math.random() * pool.length)] ?? null;
				spot(previousId);
				playArenaSound('tick', index);
			});
		});
		const lockAt = elapsed + 120;
		later(lockAt, () => {
			spot(picked);
			lock(picked);
			playArenaSound('lock');
		});
		if (reducedMotion) {
			later(200, open);
			return;
		}
		later(lockAt + GRAB_MS.pull, () => {
			setMood('inhale');
			grab(picked, monsterRef.current);
			playArenaSound('suck');
		});
		later(lockAt + GRAB_MS.chomp, () => {
			setMood('chomp');
			hold();
			shake('hard');
			flash('white');
			sparks(monsterRef.current, 'gold', 28);
			playArenaSound('chomp');
		});
		later(lockAt + GRAB_MS.open, open);
	}, [
		phase,
		callable,
		inRoom,
		progress,
		cards,
		reducedMotion,
		later,
		shake,
		flash,
		sparks,
		lock,
		grab,
		hold,
	]);

	useEffect(() => {
		if (huntAfterSkip && phase === 'idle') {
			setHuntAfterSkip(false);
			startHunt();
		}
	}, [huntAfterSkip, phase, startHunt]);

	function record(result: ArenaResult, extra: Partial<ArenaHistoryEntry> = {}) {
		if (!current) return null;
		const player = playersById.get(current.enrollmentId);
		const entry: ArenaHistoryEntry = {
			id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
			at: Date.now(),
			enrollmentId: current.enrollmentId,
			name: player ? fullName(player) : '',
			cardId: current.cardId,
			result,
			...extra,
		};
		setProgress((previous) => ({ ...previous, history: [...previous.history, entry] }));
		return entry;
	}

	function finishTurn(nextMood: MonsterMood, hpDelta: number) {
		const hp = Math.max(0, Math.min(ARENA_MAX_HP, progress.hp + hpDelta));
		const monster = monsterRef.current;
		const attackerId = current?.enrollmentId;
		const delayed = hpDelta < 0 && Boolean(attackerId) && !reducedMotion;
		setCurrent(null);
		setHighlightId(null);
		setLook(LOOK_AHEAD);
		release();
		const impact = () => {
			setProgress((previous) => ({ ...previous, hp }));
			setMood(nextMood);
			if (hpDelta < 0) {
				const streak = passStreak(progress.history) + 1;
				shake('hard');
				flash('white');
				pop('−1', 'damage', monster);
				sparks(monster, 'damage');
				playArenaSound('hit');
				hpRef.current?.animate?.(
					[
						{ transform: 'translateX(-6px)' },
						{ transform: 'translateX(6px)' },
						{ transform: 'translateX(-3px)' },
						{ transform: 'none' },
					],
					{ duration: 260 },
				);
				if (streak >= 2 && hp > 0) {
					pop(`COMBO ×${streak}`, 'gold', monster, -0.08);
					playArenaSound('combo', streak);
				}
			} else {
				playArenaSound('laugh');
				if (hp !== progress.hp) {
					pop('+1', 'heal', monster);
					flash('heal');
					playArenaSound('heal');
				}
			}
			if (hp === 0) {
				const victory = () => {
					setPhase('victory');
					setMood('defeated');
					fireworks();
					playArenaSound('victory');
				};
				if (delayed) later(500, victory);
				else victory();
				return;
			}
			if (delayed) later(500, () => setPhase('idle'));
			else setPhase('idle');
			later(1100, () => setMood('idle'));
		};
		if (delayed && attackerId) {
			setPhase('attacking');
			setAttackCue({ enrollmentId: attackerId, sequence: Date.now() });
			later(1540, impact);
			later(2040, () => setAttackCue(null));
		} else {
			impact();
		}
	}

	async function award(enrollmentId: string, level: ArenaAwardLevel) {
		const target = cpSessionFor(enrollmentId);
		if (!target) {
			const week = hosts[0] ? ` tuần ${hosts[0].weekNumber}` : '';
			throw new Error(`Lớp gốc không có buổi${week}, không ghi được CP.`);
		}
		const result = await teachingApi<RecallArenaAwardResult>(
			`/api/admin/teaching/sessions/${target.id}/recall-arena`,
			{ method: 'POST', body: JSON.stringify({ enrollmentId, points: level }) },
		);
		setCpOverrides((previous) => ({
			...previous,
			[`${result.sessionId}:${result.enrollmentId}`]: result.points,
		}));
		return result;
	}

	async function handlePass(level: ArenaAwardLevel) {
		if (!current || saving) return;
		const name = nameOf(current.enrollmentId);
		setSaving(true);
		try {
			const result = await award(current.enrollmentId, level);
			record('pass', { award: level, cpAfter: result.points });
			setToast({
				tone: 'ok',
				text: result.changed
					? `${name}: CP ${result.previous} → ${result.points}`
					: `${name}: giữ CP ${result.points} (đã bằng hoặc cao hơn)`,
			});
		} catch (error) {
			record('pass', { award: level, saveError: errorMessage(error) });
			setToast({ tone: 'error', text: errorMessage(error) });
		} finally {
			setSaving(false);
		}
		finishTurn('hurt', -1);
	}

	function handleFail() {
		if (!current) return;
		record('fail');
		finishTurn('laugh', 1);
	}

	/** The caught student keeps their turn and the card goes back unused. */
	function giveTurnBack() {
		if (!current) return;
		const { enrollmentId, cardId } = current;
		const eligibleIds = callable.map((player) => player.enrollmentId);
		setProgress((previous) => ({
			...previous,
			bag: returnToBag(previous.bag, eligibleIds, enrollmentId),
			usedCards: cardId ? previous.usedCards.filter((id) => id !== cardId) : previous.usedCards,
		}));
		setCurrent(null);
		setHighlightId(null);
		setLook(LOOK_AHEAD);
		release();
		setPhase('idle');
	}

	function handleSkip() {
		if (!current) return;
		record('skip');
		giveTurnBack();
		setHuntAfterSkip(true);
	}

	function handleNextCard() {
		if (!current) return;
		const next = drawCard(
			cards.map((item) => item.id).filter((id) => id !== current.cardId),
			progress.usedCards,
		);
		if (!next.cardId) return;
		setProgress((previous) => ({
			...previous,
			usedCards: [...new Set([...previous.usedCards, next.cardId!])],
		}));
		setCurrent({ ...current, cardId: next.cardId });
	}

	async function handleRetry(entry: ArenaHistoryEntry) {
		if (!entry.award) return;
		setRetryingId(entry.id);
		try {
			const result = await award(entry.enrollmentId, entry.award as ArenaAwardLevel);
			setProgress((previous) => ({
				...previous,
				history: previous.history.map((item) =>
					item.id === entry.id ? { ...item, saveError: undefined, cpAfter: result.points } : item,
				),
			}));
			setToast({ tone: 'ok', text: `Đã ghi CP ${result.points} cho ${entry.name}` });
		} catch (error) {
			setToast({ tone: 'error', text: errorMessage(error) });
		} finally {
			setRetryingId(null);
		}
	}

	async function openCp(sessionId: string) {
		const session = sessions.find((item) => item.id === sessionId);
		if (!session) return;
		setOpeningCpId(sessionId);
		try {
			const result = await teachingApi<TeachingParticipationMutationResult>(
				`/api/admin/teaching/sessions/${session.id}/participation/lock`,
				{
					method: 'PATCH',
					body: JSON.stringify({ action: isCpFinalized(session) ? 'unfinalize' : 'open' }),
				},
			);
			setSessions((previous) =>
				previous.map((item) => (item.id === result.session.id ? result.session : item)),
			);
		} catch (error) {
			setToast({ tone: 'error', text: errorMessage(error) });
		} finally {
			setOpeningCpId(null);
		}
	}

	/** The boss drops in: name banner, a thud and a shake as it lands. */
	function bossIntro(round: number) {
		fx.announce(`Boss ${round}`, bossName(round));
		playArenaSound('boss');
		later(420, () => shake('hard'));
	}

	function newBoss() {
		setProgress((previous) => ({ ...previous, hp: ARENA_MAX_HP, round: previous.round + 1 }));
		setMood('idle');
		setPhase('idle');
		bossIntro(progress.round + 1);
	}

	async function resetProgress() {
		const ok = await confirm({
			title: 'Bắt đầu lượt mới?',
			description:
				'Xóa lịch sử gọi và máu boss của hôm nay trên máy này. Điểm CP đã ghi vẫn giữ nguyên.',
			confirmLabel: 'Bắt đầu lượt mới',
		});
		if (!ok) return;
		setProgress(emptyProgress());
		setPhase('idle');
		setMood('idle');
	}

	function closeSetup() {
		if (!started && callable.length === 0) return;
		setSetupOpen(false);
		setStarted(true);
		if (!started && phase === 'idle') bossIntro(progress.round);
	}

	// Keyboard: Space hunts; in a question, keys press the matching button.
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest('input, select, textarea, [contenteditable="true"]')
			)
				return;
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (setupOpen) {
				if (event.key === 'Escape' && started) closeSetup();
				return;
			}
			const key = event.key.toLowerCase();
			if (key === 'escape' && historyOpen && phase !== 'caught') {
				setHistoryOpen(false);
				return;
			}
			if (phase === 'idle' && (key === ' ' || key === 'enter')) {
				event.preventDefault();
				startHunt();
				return;
			}
			if (phase === 'victory' && (key === ' ' || key === 'enter')) {
				event.preventDefault();
				newBoss();
				return;
			}
			if (phase === 'caught') {
				const button = document.querySelector<HTMLButtonElement>(
					`[data-arena-key="${CSS.escape(key)}"]`,
				);
				if (button && !button.disabled) {
					event.preventDefault();
					button.click();
				}
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const caughtPlayer = current ? (playersById.get(current.enrollmentId) ?? null) : null;
	const caughtCard = current?.cardId ? (cardsById.get(current.cardId) ?? null) : null;
	const caughtDeck = caughtCard
		? data.decks.find((deck) => deck.deckId === caughtCard.deckId)
		: null;
	const streak = passStreak(progress.history);
	const classLabel =
		config.classIds
			.map((id) => data.classes.find((item) => item.id === id)?.classCode)
			.filter(Boolean)
			.join(', ') || 'Chưa chọn lớp';
	const enraged = progress.hp <= LOW_HP && phase !== 'victory';

	return (
		<div className={styles.arena} data-phase={phase}>
			<div className={styles.world} ref={worldRef}>
				<ArenaTopBar
					classLabel={`${data.course.courseCode} · ${classLabel}`}
					classHref={routes.mySpaceTeachingCourse(courseId)}
					hp={progress.hp}
					round={progress.round}
					low={enraged}
					hpRef={hpRef}
					settingsLabel={`${hosts.length ? `Tuần ${hosts[0]!.weekNumber}` : 'Chưa chọn lớp'} · ${inRoom.length} bạn · ${cards.length ? `${cards.length} câu` : 'câu riêng'}`}
					settingsDisabled={phase === 'hunting' || phase === 'caught' || phase === 'attacking'}
					onSettings={() => setSetupOpen(true)}
					calledCount={progress.history.filter((entry) => entry.result !== 'skip').length}
					historyOpen={historyOpen}
					onToggleHistory={() => setHistoryOpen((open) => !open)}
				/>

				<main className={styles.stage}>
					<div className={styles.monsterZone}>
						<div
							key={`${progress.round}-${started}`}
							ref={monsterRef}
							className={styles.monsterEntry}
						>
							<ArenaMonster
								mood={mood}
								size={phase === 'hunting' ? 280 : 240}
								round={progress.round}
								enraged={enraged}
								look={look}
							/>
						</div>
						{streak >= 2 && phase !== 'victory' ? (
							<span key={streak} className={styles.combo}>
								Combo ×{streak}
							</span>
						) : null}
					</div>
					<ArenaFloor
						players={inRoom}
						highlightId={highlightId}
						caughtId={phase === 'caught' ? (current?.enrollmentId ?? null) : null}
						hunting={phase === 'hunting'}
						calledIds={calledIds}
						names={names}
						suck={suck}
						attackCue={attackCue}
						monsterRef={monsterRef}
					/>
					<div className={styles.actionBar}>
						<ArenaCharacterPreview />
						<button
							type="button"
							className={styles.catchButton}
							data-ready={(phase === 'idle' && callable.length > 0) || undefined}
							disabled={phase !== 'idle' || callable.length === 0}
							onClick={startHunt}
						>
							{phase === 'hunting' ? 'Quái vật đang tìm…' : 'Bắt!'}
							<kbd>Space</kbd>
						</button>
					</div>
					{historyOpen ? (
						<ArenaHistory
							entries={progress.history}
							questionText={(cardId) => {
								const card = cardId ? cardsById.get(cardId) : null;
								return card ? recallVisibleText(card.question) : 'Câu hỏi riêng';
							}}
							retryingId={retryingId}
							onRetry={handleRetry}
							onReset={() => void resetProgress()}
							onClose={() => setHistoryOpen(false)}
						/>
					) : null}
				</main>
			</div>

			<AnimatePresence>
				{phase === 'caught' && caughtPlayer ? (
					<ArenaCaught
						key={current?.catchId}
						player={caughtPlayer}
						card={caughtCard}
						deckLabel={caughtDeck ? caughtDeck.lessonLabel || caughtDeck.title : ''}
						cpNow={cpFor(caughtPlayer.enrollmentId)}
						saving={saving}
						canChangeCard={cards.length > 1}
						onPass={handlePass}
						onFail={handleFail}
						onSkipStudent={handleSkip}
						onNextCard={handleNextCard}
						onClose={giveTurnBack}
					/>
				) : null}
				{phase === 'victory' ? (
					<m.div
						className={styles.victory}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
					>
						<span className={styles.victoryRays} aria-hidden="true" />
						<m.span
							className={styles.victoryKo}
							aria-hidden="true"
							initial={{ scale: 4, opacity: 0, rotate: -12 }}
							animate={{ scale: 1, opacity: 1, rotate: -6 }}
							transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }}
						>
							K.O.!
						</m.span>
						<h2>Cả lớp đã hạ gục Boss {progress.round}!</h2>
						<p className={styles.victorySub}>{bossName(progress.round)} đã bị đánh bại</p>
						<button type="button" className={styles.startButton} onClick={newBoss}>
							Gọi Boss mới <kbd>Space</kbd>
						</button>
					</m.div>
				) : null}
			</AnimatePresence>

			{layer}

			{toast ? (
				<div className={styles.toast} data-tone={toast.tone} role="status">
					{toast.text}
				</div>
			) : null}

			{setupOpen ? (
				<ArenaSetup
					data={data}
					config={config}
					sessions={sessions}
					hosts={hosts}
					roster={inRoom}
					started={started}
					openingCpId={openingCpId}
					onChange={setConfig}
					onOpenCp={openCp}
					onReload={() => window.location.reload()}
					onDone={closeSetup}
					onClose={started ? closeSetup : undefined}
				/>
			) : null}
			{confirmDialog}
		</div>
	);
}
