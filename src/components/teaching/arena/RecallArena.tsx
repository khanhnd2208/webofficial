'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useMotionTier } from '@/components/motion';
import { AdminApiError } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import { recallVisibleText } from '@/features/active-recall/richText';
import {
	arenaCpSession,
	drawCard,
	drawFromBag,
	returnToBag,
	type ArenaAwardLevel,
} from '@/features/teaching/domain/recallArena';
import type { RecallArenaData } from '@/features/teaching/types';

import { ArenaCaught } from './ArenaCaught';
import { lookToward, useArenaFx } from './ArenaEffects';
import { ArenaMonster, type MonsterMood } from './ArenaFigures';
import { ArenaFloor, type ArenaAttackCue } from './ArenaFloor';
import { ArenaHistory } from './ArenaHistory';
import { ArenaSetup } from './ArenaSetup';
import { ArenaSummary } from './ArenaSummary';
import { ArenaTopBar } from './ArenaTopBar';
import { ArenaVictory } from './ArenaVictory';
import { arenaBossFor } from './arenaBosses';
import {
	ARENA_MAX_HP,
	answeredArenaIds,
	arenaClassLabel,
	arenaGameKey,
	arenaResults,
	arenaRoster,
	callablePlayers,
	displayNames,
	emptyProgress,
	fullName,
	hostSessions,
	initialConfig,
	isManualPlayer,
	loadConfig,
	newAssistTurnId,
	loadProgress,
	manualArenaPlayers,
	passedArenaCards,
	passStreak,
	saveConfig,
	saveProgress,
	type ArenaConfig,
	type ArenaHistoryEntry,
	type ArenaProgress,
	type ArenaResult,
} from './arenaGame';
import { playArenaSound } from './arenaSound';
import { useArenaHeroes } from './useArenaHeroes';
import { useArenaKeyboard } from './useArenaKeyboard';
import { useArenaTurnLog } from './useArenaTurnLog';
import { arenaErrorMessage as errorMessage, awardArenaCp, saveArenaGrade } from './arenaTurnLog';
import { useArenaSessions } from './useArenaSessions';
import { STRIKE_MS, type StrikePower } from './arenaStrikes';
import styles from './arena.module.css';

type Phase = 'idle' | 'hunting' | 'caught' | 'attacking' | 'victory';

/** Spotlight hops while the monster hunts, slowing down before it grabs someone. */
const HUNT_STEPS_MS = [70, 70, 80, 90, 100, 120, 140, 170, 210, 260, 320, 400];
/** After the spotlight stops: reticle, then the beam pulls, the jaws shut, the question opens. */
const GRAB_MS = { pull: 520, chomp: 1170, open: 1620 };
const LOW_HP = 3;
const LOOK_AHEAD = { x: 0, y: 0 };

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
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [phase, setPhase] = useState<Phase>('idle');
	const [mood, setMood] = useState<MonsterMood>('idle');
	const [highlightId, setHighlightId] = useState<string | null>(null);
	const [current, setCurrent] = useState<{
		catchId: string;
		at: number;
		enrollmentId: string;
		cardId: string | null;
	} | null>(null);
	/** After a missed answer: the student, if any, answering the same question instead. */
	const [assist, setAssist] = useState<{
		volunteer: { enrollmentId: string; turnId: string; at: number } | null;
	} | null>(null);
	const [cpOverrides, setCpOverrides] = useState<Record<string, number>>({});
	const [saving, setSaving] = useState(false);
	const submitting = useRef(false);
	const [unconfirmed, setUnconfirmed] = useState<{
		result: 'pass' | 'fail';
		level: ArenaAwardLevel | 0;
	} | null>(null);
	const [retryingId, setRetryingId] = useState<string | null>(null);
	const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
	const { sessions, openingCpId, openCp } = useArenaSessions(data, (text) =>
		setToast({ tone: 'error', text }),
	);
	const [huntAfterSkip, setHuntAfterSkip] = useState(false);
	const [look, setLook] = useState(LOOK_AHEAD);
	const [attackCue, setAttackCue] = useState<ArenaAttackCue | null>(null);
	const timers = useRef<number[]>([]);
	const monsterRef = useRef<HTMLDivElement>(null);
	const hpRef = useRef<HTMLDivElement>(null);
	const { worldRef, suck, layer, shake, flash, pop, sparks, fireworks, lock, grab, hold, release } =
		fx;
	const boss = arenaBossFor(progress.round, config.bossId);
	const { confirm, dialog: confirmDialog } = useAdminConfirm();

	const hosts = useMemo(() => hostSessions(config, sessions), [config, sessions]);
	const allPlayers = useMemo(
		() => [...data.players, ...manualArenaPlayers(config.manualPlayers)],
		[data.players, config.manualPlayers],
	);
	const playersById = useMemo(
		() => new Map(allPlayers.map((player) => [player.enrollmentId, player])),
		[allPlayers],
	);
	/** Everyone on the floor; the spotlight visits all of them. */
	const inRoom = useMemo(
		() => [
			...arenaRoster(data.players, hosts, config),
			...manualArenaPlayers(config.manualPlayers),
		],
		[data.players, hosts, config],
	);
	const heroOf = useArenaHeroes({
		players: inRoom,
		heroIds: config.heroIds,
		progress,
		setProgress,
		ready: progressLoaded,
	});
	/** Each student answers once a day; the floor still shows everyone. */
	const answered = useMemo(() => answeredArenaIds(progress.history), [progress.history]);
	const inGroup = useMemo(() => callablePlayers(inRoom, config.filter), [inRoom, config.filter]);
	const callable = useMemo(
		() => inGroup.filter((player) => !answered.has(player.enrollmentId)),
		[inGroup, answered],
	);
	const activeDeckIds = useMemo(() => new Set(config.deckIds), [config.deckIds]);
	const cards = useMemo(
		() => data.cards.filter((card) => activeDeckIds.has(card.deckId)),
		[data.cards, activeDeckIds],
	);
	const passedCards = useMemo(() => passedArenaCards(progress.history), [progress.history]);
	const availableCardIds = useMemo(
		() => cards.map((card) => card.id).filter((id) => !passedCards.has(id)),
		[cards, passedCards],
	);
	const cardsById = useMemo(() => new Map(data.cards.map((card) => [card.id, card])), [data.cards]);
	const names = useMemo(() => displayNames(inRoom), [inRoom]);
	const nameOf = (enrollmentId: string) => {
		const player = playersById.get(enrollmentId);
		return names.get(enrollmentId) ?? player?.givenName ?? '';
	};
	const results = useMemo(() => arenaResults(progress.history), [progress.history]);

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
		const stored = loadProgress(gameKey);
		setProgress(stored);
		if (stored.hp === 0) {
			setPhase('victory');
			setMood('defeated');
		}
		setProgressLoaded(true);
	}, [gameKey]);

	useEffect(() => {
		if (progressLoaded) saveProgress(gameKey, progress);
	}, [progress, progressLoaded, gameKey]);

	const turnLog = useArenaTurnLog({
		courseId,
		todayIso: data.todayIso,
		progress,
		setProgress,
		ready: progressLoaded,
	});

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
		if (phase !== 'idle' || !progressLoaded || turnLog.loading) return;
		const eligibleIds = callable.map((player) => player.enrollmentId);
		const draw = drawFromBag(progress.bag, eligibleIds, progress.lastPicked);
		if (!draw.picked) {
			setToast({
				tone: 'error',
				text: inGroup.length
					? 'Mọi bạn trong nhóm đang gọi đã trả lời. Bấm “Kết thúc” để xem tổng kết.'
					: 'Không có sinh viên nào trong trận ở nhóm đang chọn.',
			});
			return;
		}
		const picked = draw.picked;
		const cardId = drawCard(availableCardIds, passedCards);
		setProgress((previous) => ({
			...previous,
			bag: draw.bag,
			lastPicked: picked,
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
				catchId: window.crypto.randomUUID(),
				at: Date.now(),
				enrollmentId: picked,
				cardId,
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
		inGroup,
		inRoom,
		progress,
		availableCardIds,
		passedCards,
		progressLoaded,
		turnLog.loading,
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

	function makeEntry(
		result: ArenaResult,
		extra: Partial<ArenaHistoryEntry> = {},
	): ArenaHistoryEntry {
		const volunteer = assist?.volunteer;
		const turn = current!;
		const enrollmentId = volunteer?.enrollmentId ?? turn.enrollmentId;
		const player = playersById.get(enrollmentId);
		return {
			id: volunteer?.turnId ?? (result === 'skip' ? window.crypto.randomUUID() : turn.catchId),
			at: volunteer?.at ?? turn.at,
			enrollmentId,
			name: player ? fullName(player) : '',
			cardId: turn.cardId,
			result,
			...(player && isManualPlayer(player.enrollmentId) && player.group
				? { group: player.group }
				: {}),
			...extra,
		};
	}

	function record(entry: ArenaHistoryEntry) {
		setProgress((previous) => ({ ...previous, history: [...previous.history, entry] }));
	}

	function finishTurn(nextMood: MonsterMood, hpDelta: number) {
		const hp = Math.max(0, Math.min(ARENA_MAX_HP, progress.hp + hpDelta));
		const monster = monsterRef.current;
		const attackerId = assist?.volunteer?.enrollmentId ?? current?.enrollmentId;
		setAssist(null);
		const attacker = attackerId ? playersById.get(attackerId) : null;
		const hero = hpDelta < 0 && attacker ? heroOf(attacker) : null;
		const streak = passStreak(progress.history) + 1;
		const power: StrikePower = hp === 0 ? 3 : streak >= 2 ? 2 : 1;
		setCurrent(null);
		setHighlightId(null);
		setLook(LOOK_AHEAD);
		release();
		// Null when nothing is drawn (reduced motion): the hit then lands at once.
		const shot = hero && attackerId ? fx.strike(attackerId, monster, hero, power) : null;
		const impact = () => {
			setProgress((previous) => ({ ...previous, hp }));
			setMood(nextMood);
			if (hpDelta < 0) {
				shake('hard');
				flash('white');
				pop('−1', 'damage', monster);
				sparks(monster, 'damage', power === 3 ? 90 : 46, hero?.accent);
				playArenaSound(power === 3 ? 'finisher' : 'hit');
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
				if (shot) later(500, victory);
				else victory();
				return;
			}
			if (shot) later(STRIKE_MS.end - STRIKE_MS.impact, () => setPhase('idle'));
			else setPhase('idle');
			later(1100, () => setMood('idle'));
		};
		if (shot && attackerId) {
			setPhase('attacking');
			setAttackCue({ enrollmentId: attackerId, sequence: Date.now(), ...shot });
			playArenaSound('charge');
			later(STRIKE_MS.launch, () => playArenaSound('launch'));
			later(STRIKE_MS.impact, impact);
			later(STRIKE_MS.end, () => setAttackCue(null));
		} else {
			impact();
		}
	}

	async function award(enrollmentId: string, level: ArenaAwardLevel) {
		const result = await awardArenaCp(
			cpSessionFor(enrollmentId),
			hosts[0]?.weekNumber,
			enrollmentId,
			level,
		);
		setCpOverrides((previous) => ({
			...previous,
			[`${result.sessionId}:${result.enrollmentId}`]: result.points,
		}));
		return result;
	}

	async function gradeTurn(result: 'pass' | 'fail', level: ArenaAwardLevel | 0 = 0) {
		if (
			!current ||
			submitting.current ||
			(unconfirmed && (unconfirmed.result !== result || unconfirmed.level !== level))
		)
			return;
		// While a missed question is open to the class, only a chosen volunteer can be graded.
		if (assist && (!assist.volunteer || result !== 'pass')) return;
		const id = assist?.volunteer?.enrollmentId ?? current.enrollmentId;
		const manual = isManualPlayer(id);
		const name = nameOf(id);
		const target = cpSessionFor(id);
		const pass = result === 'pass';
		const savesCp = pass && !manual && level > 0;
		if (savesCp && !target) {
			setToast({ tone: 'error', text: 'Không có buổi chấm CP phù hợp cho sinh viên này.' });
			return;
		}
		let entry = makeEntry(result, pass && !manual ? { award: level } : {});
		const grade = savesCp
			? { kind: 'cp' as const, sessionId: target!.id }
			: !pass && !manual
				? { kind: 'gift' as const }
				: null;
		if (grade) {
			submitting.current = true;
			setSaving(true);
			try {
				const saved = await saveArenaGrade(courseId, entry, grade, name);
				entry = saved.entry;
				if (target && entry.cpAfter != null) {
					const points = entry.cpAfter;
					setCpOverrides((previous) => ({ ...previous, [`${target.id}:${id}`]: points }));
				}
				setUnconfirmed(null);
				setToast({ tone: 'ok', text: saved.message });
			} catch (error) {
				if (!(error instanceof AdminApiError) || error.status >= 500)
					setUnconfirmed({ result, level });
				setToast({
					tone: 'error',
					text: pass ? errorMessage(error) : `Chưa xác nhận Gift: ${errorMessage(error)}`,
				});
				return;
			} finally {
				submitting.current = false;
				setSaving(false);
			}
		} else {
			if (pass && !manual && target) entry.cpBefore = entry.cpAfter = cpFor(id);
			setToast({
				tone: 'ok',
				text: manual ? `${name}: đạt` : `${name}: vừa đủ qua, CP giữ nguyên`,
			});
		}
		record(entry);
		// A missed question goes to the class before the boss heals.
		if (!pass && inRoom.length > 1) {
			setAssist({ volunteer: null });
			setToast(null);
			return;
		}
		finishTurn(pass ? 'hurt' : 'laugh', pass ? -1 : 1);
	}

	function pickVolunteer(enrollmentId: string | null) {
		if (!assist || submitting.current || unconfirmed) return;
		setAssist({
			volunteer: enrollmentId ? { enrollmentId, turnId: newAssistTurnId(), at: Date.now() } : null,
		});
	}

	/** Nobody answered the missed question: the boss heals as after any miss. */
	function endAssist() {
		if (assist && !submitting.current && !unconfirmed) finishTurn('laugh', 1);
	}

	/** The caught student keeps their turn and the card goes back unused. */
	function giveTurnBack() {
		if (!current || assist || submitting.current || unconfirmed) return;
		const { enrollmentId } = current;
		const eligibleIds = callable.map((player) => player.enrollmentId);
		setProgress((previous) => ({
			...previous,
			bag: returnToBag(previous.bag, eligibleIds, enrollmentId),
		}));
		setCurrent(null);
		setHighlightId(null);
		setLook(LOOK_AHEAD);
		release();
		setPhase('idle');
	}

	function handleSkip() {
		if (!current || assist || submitting.current || unconfirmed || callable.length < 2) return;
		record(makeEntry('skip'));
		giveTurnBack();
		setHuntAfterSkip(true);
	}

	function handleChooseStudent(enrollmentId: string) {
		if (!current || assist || submitting.current || unconfirmed) return;
		if (enrollmentId === current.enrollmentId) return;
		if (!callable.some((player) => player.enrollmentId === enrollmentId)) return;
		record(makeEntry('skip'));
		const eligibleIds = callable.map((player) => player.enrollmentId);
		const returnedBag = returnToBag(progress.bag, eligibleIds, current.enrollmentId);
		setProgress((previous) => ({
			...previous,
			bag: returnedBag.filter((id) => id !== enrollmentId),
			lastPicked: enrollmentId,
		}));
		setCurrent({
			catchId: window.crypto.randomUUID(),
			at: Date.now(),
			enrollmentId,
			cardId:
				current.cardId && !passedCards.has(current.cardId)
					? current.cardId
					: drawCard(availableCardIds, passedCards),
		});
		setHighlightId(enrollmentId);
		setLook(lookToward(monsterRef.current, enrollmentId));
		playArenaSound('reveal');
	}

	function handleNextCard() {
		if (!current || assist || submitting.current || unconfirmed) return;
		const cardId = drawCard(
			availableCardIds.filter((id) => id !== current.cardId),
			passedCards,
		);
		if (cardId) setCurrent({ ...current, cardId });
	}

	async function handleRetry(entry: ArenaHistoryEntry) {
		if (!entry.award) return;
		setRetryingId(entry.id);
		try {
			const result = await award(entry.enrollmentId, entry.award as ArenaAwardLevel);
			setProgress((previous) => ({
				...previous,
				history: previous.history.map((item) =>
					item.id === entry.id
						? { ...item, saveError: undefined, cpAfter: result.points, synced: false }
						: item,
				),
			}));
			setToast({ tone: 'ok', text: `Đã ghi CP ${result.points} cho ${entry.name}` });
		} catch (error) {
			setToast({ tone: 'error', text: errorMessage(error) });
		} finally {
			setRetryingId(null);
		}
	}

	/** The boss drops in: name banner, a thud and a shake as it lands. */
	function bossIntro(round: number) {
		fx.announce(`Boss ${round}`, arenaBossFor(round, config.bossId).name);
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
			title: 'Chơi lại từ Boss 1?',
			description:
				'Đặt lại Boss và thứ tự gọi. Các câu đã qua hôm nay vẫn được loại khỏi bộ câu hỏi.',
			confirmLabel: 'Chơi lại',
		});
		if (!ok) return;
		setProgress((previous) => ({ ...emptyProgress(), history: previous.history }));
		setPhase('idle');
		setMood('idle');
	}

	function closeSetup() {
		if (!started && callable.length === 0) return;
		setSetupOpen(false);
		setStarted(true);
		if (!started && phase === 'idle') bossIntro(progress.round);
	}

	useArenaKeyboard({
		setupOpen,
		onCloseSetup: started ? closeSetup : undefined,
		paused: summaryOpen,
		historyOpen,
		onCloseHistory: () => setHistoryOpen(false),
		phase,
		onHunt: startHunt,
		onNewBoss: newBoss,
	});

	const failedPlayer = current ? (playersById.get(current.enrollmentId) ?? null) : null;
	/** The student on the question card: the volunteer once one is chosen. */
	const caughtPlayer =
		(assist?.volunteer ? playersById.get(assist.volunteer.enrollmentId) : failedPlayer) ?? null;
	const caughtCard = current?.cardId ? (cardsById.get(current.cardId) ?? null) : null;
	const caughtCpSession = caughtPlayer ? cpSessionFor(caughtPlayer.enrollmentId) : null;
	const canHunt = phase === 'idle' && callable.length > 0 && progressLoaded && !turnLog.loading;
	const caughtDeck = caughtCard
		? data.decks.find((deck) => deck.deckId === caughtCard.deckId)
		: null;
	const streak = passStreak(progress.history);
	const classLabel = arenaClassLabel(data, config.classIds);
	const enraged = progress.hp <= LOW_HP && phase !== 'victory';

	return (
		<div className={styles.arena} data-phase={phase}>
			<div className={styles.world} ref={worldRef}>
				<ArenaTopBar
					classLabel={`${data.course.courseCode} · ${classLabel}`}
					classHref={routes.mySpaceTeachingCourse(courseId)}
					hp={progress.hp}
					round={progress.round}
					bossName={boss.name}
					low={enraged}
					hpRef={hpRef}
					settingsLabel={`${hosts.length ? `Tuần ${hosts[0]!.weekNumber}` : 'Chưa chọn lớp'} · ${inRoom.length} bạn · ${cards.length ? `${availableCardIds.length}/${cards.length} câu còn lại` : 'câu riêng'}`}
					settingsDisabled={phase === 'hunting' || phase === 'caught' || phase === 'attacking'}
					onSettings={() => setSetupOpen(true)}
					calledCount={answered.size}
					historyOpen={historyOpen}
					onToggleHistory={() => setHistoryOpen((open) => !open)}
					allAnswered={inGroup.length > 0 && callable.length === 0}
					onEnd={() => setSummaryOpen(true)}
					onExit={answered.size ? () => setSummaryOpen(true) : undefined}
				/>

				<main className={styles.stage}>
					<div className={styles.monsterZone}>
						<div
							key={`${progress.round}-${started}-${boss.id}`}
							ref={monsterRef}
							className={styles.monsterEntry}
						>
							<ArenaMonster
								mood={mood}
								size={phase === 'hunting' ? 280 : 240}
								boss={boss}
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
						results={results}
						names={names}
						suck={suck}
						attackCue={attackCue}
						heroOf={heroOf}
					/>
					<div className={styles.actionBar}>
						<button
							type="button"
							className={styles.catchButton}
							data-ready={canHunt || undefined}
							disabled={!canHunt}
							onClick={startHunt}
						>
							{phase === 'hunting'
								? 'Quái vật đang tìm…'
								: inGroup.length && !callable.length
									? 'Đã gọi hết'
									: 'Bắt!'}
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
							courseId={courseId}
							todayIso={data.todayIso}
							sync={turnLog}
							onReset={
								phase === 'idle' || phase === 'victory' ? () => void resetProgress() : undefined
							}
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
						character={heroOf(caughtPlayer)}
						boss={boss}
						card={caughtCard}
						deckLabel={caughtDeck ? caughtDeck.lessonLabel || caughtDeck.title : ''}
						cpNow={cpFor(caughtPlayer.enrollmentId)}
						manual={isManualPlayer(caughtPlayer.enrollmentId)}
						saving={saving}
						unconfirmed={unconfirmed}
						canChangeCard={availableCardIds.some((id) => id !== current?.cardId)}
						cardsExhausted={cards.length > 0 && availableCardIds.length === 0}
						cpSession={caughtCpSession}
						openingCp={openingCpId === caughtCpSession?.id}
						onOpenCp={openCp}
						onPass={(level) => void gradeTurn('pass', level)}
						onBarePass={() => void gradeTurn('pass')}
						onFail={() => void gradeTurn('fail')}
						onSkipStudent={handleSkip}
						onChooseStudent={handleChooseStudent}
						otherPlayers={callable.filter(
							(player) => player.enrollmentId !== caughtPlayer.enrollmentId,
						)}
						onNextCard={handleNextCard}
						onClose={giveTurnBack}
						assist={
							assist && failedPlayer
								? {
										failedName: nameOf(failedPlayer.enrollmentId),
										candidates: inRoom.filter((player) => player !== failedPlayer),
										picked: Boolean(assist.volunteer),
										onPick: pickVolunteer,
										onRepick: () => pickVolunteer(null),
										onEnd: endAssist,
									}
								: null
						}
					/>
				) : null}
				{phase === 'victory' ? (
					<ArenaVictory
						round={progress.round}
						bossName={boss.name}
						onNewBoss={newBoss}
						onSummary={() => setSummaryOpen(true)}
					/>
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
					answered={answered}
					started={started}
					openingCpId={openingCpId}
					onChange={setConfig}
					onOpenCp={openCp}
					onReload={() => window.location.reload()}
					onDone={closeSetup}
					onClose={started ? closeSetup : undefined}
					exitHref={routes.mySpaceTeachingCourse(courseId)}
				/>
			) : null}
			{summaryOpen ? (
				<ArenaSummary
					title={`Kiểm tra bài cũ · ${data.course.courseCode} · ${classLabel} · ${data.todayIso}`}
					sync={turnLog}
					players={inRoom}
					progress={progress}
					names={names}
					classHref={routes.mySpaceTeachingCourse(courseId)}
					onContinue={() => setSummaryOpen(false)}
				/>
			) : null}
			{confirmDialog}
		</div>
	);
}
