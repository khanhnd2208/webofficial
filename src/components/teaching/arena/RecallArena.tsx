'use client';

import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useMotionTier } from '@/components/motion';
import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import { recallVisibleText } from '@/features/active-recall/richText';
import { McIcon } from '@/components/myclass/ui';
import {
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
import { ArenaMonster, type MonsterMood } from './ArenaFigures';
import { ArenaFloor } from './ArenaFloor';
import { ArenaHistory } from './ArenaHistory';
import { ArenaSetup } from './ArenaSetup';
import {
	ARENA_MAX_HP,
	displayNames,
	eligiblePlayers,
	emptyProgress,
	fullName,
	isCpFinalized,
	loadConfig,
	loadProgress,
	saveConfig,
	saveProgress,
	sessionLabel,
	type ArenaConfig,
	type ArenaHistoryEntry,
	type ArenaProgress,
	type ArenaResult,
} from './arenaGame';
import styles from './arena.module.css';

type Phase = 'idle' | 'hunting' | 'caught' | 'victory';

/** Spotlight hops while the monster hunts, slowing down before it grabs someone. */
const HUNT_STEPS_MS = [70, 70, 80, 90, 100, 120, 140, 170, 210, 260, 320, 400];

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'Không lưu được, thử lại.';
}

export function RecallArena({ data }: { data: RecallArenaData }) {
	const { reduced: reducedMotion } = useMotionTier();
	const [sessions, setSessions] = useState(data.sessions);
	const [config, setConfig] = useState<ArenaConfig>({
		sessionId: data.defaultSessionId,
		filter: 'ALL',
		deckIds: [],
	});
	const [progress, setProgress] = useState<ArenaProgress>(emptyProgress);
	/** Session whose progress is in state; saving waits until it matches. */
	const [progressSession, setProgressSession] = useState<string | null>(null);
	const [setupOpen, setSetupOpen] = useState(true);
	const [started, setStarted] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
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
	const [openingCp, setOpeningCp] = useState(false);
	const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
	const [huntAfterSkip, setHuntAfterSkip] = useState(false);
	const timers = useRef<number[]>([]);
	const { confirm, dialog: confirmDialog } = useAdminConfirm();

	const session = sessions.find((item) => item.id === config.sessionId) ?? null;
	const playersById = useMemo(
		() => new Map(data.players.map((player) => [player.enrollmentId, player])),
		[data.players],
	);
	const inRoom = useMemo(
		() => eligiblePlayers(data.players, session, 'ALL'),
		[data.players, session],
	);
	const callable = useMemo(
		() => eligiblePlayers(data.players, session, config.filter),
		[data.players, session, config.filter],
	);
	const activeDeckIds = useMemo(
		() => new Set(config.deckIds.length ? config.deckIds : data.decks.map((deck) => deck.deckId)),
		[config.deckIds, data.decks],
	);
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

	// Restore this browser's group filter and decks once, after hydration. The
	// session always starts at today's class, so it is not restored.
	useEffect(() => {
		const stored = loadConfig(data.class.id);
		if (!stored) return;
		const deckIds = (stored.deckIds ?? []).filter((id) =>
			data.decks.some((deck) => deck.deckId === id),
		);
		setConfig((previous) => ({ ...previous, filter: stored.filter ?? previous.filter, deckIds }));
	}, [data.class.id, data.decks]);

	useEffect(() => {
		saveConfig(data.class.id, config);
	}, [config, data.class.id]);

	// Each session keeps its own progress (who was called, boss HP, history).
	useEffect(() => {
		if (!config.sessionId) return;
		setProgress(loadProgress(config.sessionId));
		setProgressSession(config.sessionId);
	}, [config.sessionId]);

	useEffect(() => {
		if (progressSession && progressSession === config.sessionId) {
			saveProgress(progressSession, progress);
		}
	}, [progress, progressSession, config.sessionId]);

	useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

	useEffect(() => {
		const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, []);

	useEffect(() => {
		if (!toast) return;
		const timer = window.setTimeout(() => setToast(null), 3200);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const later = useCallback((ms: number, run: () => void) => {
		timers.current.push(window.setTimeout(run, ms));
	}, []);

	const cpFor = (enrollmentId: string) => {
		if (!session) return 0;
		return (
			cpOverrides[`${session.id}:${enrollmentId}`] ??
			playersById.get(enrollmentId)?.cp[session.id] ??
			0
		);
	};

	const startHunt = useCallback(() => {
		if (phase !== 'idle' || !session) return;
		const eligibleIds = callable.map((player) => player.enrollmentId);
		const draw = drawFromBag(progress.bag, eligibleIds, progress.lastPicked);
		if (!draw.picked) {
			setToast({ tone: 'error', text: 'Không có sinh viên nào có mặt trong nhóm đang chọn.' });
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
		// The spotlight visits everyone in the room, not only the chosen group,
		// so the class cannot tell who is in which group.
		const roomIds = inRoom.map((player) => player.enrollmentId);
		const steps = reducedMotion ? [] : HUNT_STEPS_MS;
		let elapsed = 0;
		let previousId: string | null = null;
		for (const step of steps) {
			elapsed += step;
			later(elapsed, () => {
				const pool = roomIds.length > 1 ? roomIds.filter((id) => id !== previousId) : roomIds;
				previousId = pool[Math.floor(Math.random() * pool.length)] ?? null;
				setHighlightId(previousId);
			});
		}
		later(elapsed + 120, () => setHighlightId(picked));
		later(elapsed + (reducedMotion ? 200 : 750), () => {
			setCurrent({
				catchId: `${Date.now().toString(36)}-${picked}`,
				enrollmentId: picked,
				cardId: card.cardId,
			});
			setPhase('caught');
			setMood('idle');
		});
	}, [phase, session, callable, inRoom, progress, cards, reducedMotion, later]);

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
		setProgress((previous) => ({ ...previous, hp }));
		setCurrent(null);
		setHighlightId(null);
		setMood(nextMood);
		if (hp === 0) {
			setPhase('victory');
			later(700, () => setMood('defeated'));
			void import('canvas-confetti').then(({ default: confetti }) => {
				confetti({ particleCount: 160, spread: 90, origin: { y: 0.35 } });
			});
			return;
		}
		setPhase('idle');
		later(1100, () => setMood('idle'));
	}

	async function award(enrollmentId: string, level: ArenaAwardLevel) {
		if (!session) throw new Error('Chưa chọn buổi học');
		const result = await teachingApi<RecallArenaAwardResult>(
			`/api/admin/teaching/sessions/${session.id}/recall-arena`,
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

	async function openCp() {
		if (!session) return;
		setOpeningCp(true);
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
			setOpeningCp(false);
		}
	}

	function newBoss() {
		setProgress((previous) => ({ ...previous, hp: ARENA_MAX_HP, round: previous.round + 1 }));
		setMood('idle');
		setPhase('idle');
	}

	async function resetProgress() {
		const ok = await confirm({
			title: 'Bắt đầu lượt mới?',
			description:
				'Xóa lịch sử gọi và máu boss của buổi này trên máy này. Điểm CP đã ghi vẫn giữ nguyên.',
			confirmLabel: 'Bắt đầu lượt mới',
		});
		if (!ok) return;
		setProgress(emptyProgress());
		setPhase('idle');
		setMood('idle');
	}

	function closeSetup() {
		if (!session) return;
		setSetupOpen(false);
		setStarted(true);
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) void document.exitFullscreen?.();
		else void document.documentElement.requestFullscreen?.().catch(() => undefined);
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
	const hpPercent = (progress.hp / ARENA_MAX_HP) * 100;

	return (
		<div className={styles.arena}>
			<header className={styles.topBar}>
				<div className={styles.titleBlock}>
					<h1 className={styles.title}>Kiểm tra bài cũ</h1>
					<p className={styles.eyebrow}>
						{data.class.courseCode} · {data.class.classCode}
					</p>
				</div>
				<div className={styles.hp} aria-label={`Máu quái vật ${progress.hp}/${ARENA_MAX_HP}`}>
					<span className={styles.hpLabel}>Boss {progress.round}</span>
					<span className={styles.hpTrack}>
						<span className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
					</span>
					<span className={styles.hpValue}>
						{progress.hp}/{ARENA_MAX_HP}
					</span>
				</div>
				<nav className={styles.toolbar} aria-label="Điều khiển">
					<button
						type="button"
						className={styles.settingsChip}
						onClick={() => setSetupOpen(true)}
						disabled={phase === 'hunting' || phase === 'caught'}
						title="Thiết lập"
					>
						<McIcon name="settings" size={16} />
						<span>
							{session ? sessionLabel(session, data.tutorials) : 'Chưa chọn buổi'} · {cards.length}{' '}
							câu
						</span>
					</button>
					<button
						type="button"
						className={styles.chipButton}
						aria-pressed={historyOpen}
						onClick={() => setHistoryOpen((open) => !open)}
					>
						Đã gọi {progress.history.filter((entry) => entry.result !== 'skip').length}
					</button>
					<button
						type="button"
						className={styles.iconButton}
						onClick={toggleFullscreen}
						aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
						title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
					>
						<McIcon name={fullscreen ? 'fullscreen_exit' : 'fullscreen'} size={20} />
					</button>
					<Link
						href={routes.mySpaceTeachingClass(data.class.id)}
						className={styles.iconButton}
						aria-label="Về trang lớp"
						title="Về trang lớp"
					>
						<McIcon name="close" size={20} />
					</Link>
				</nav>
			</header>

			<main className={styles.stage}>
				<div className={styles.monsterZone}>
					<ArenaMonster mood={mood} size={phase === 'hunting' ? 280 : 240} />
				</div>
				<ArenaFloor
					players={inRoom}
					highlightId={highlightId}
					caughtId={phase === 'caught' ? (current?.enrollmentId ?? null) : null}
					hunting={phase === 'hunting'}
					calledIds={calledIds}
					names={names}
				/>
				<div className={styles.actionBar}>
					<button
						type="button"
						className={styles.catchButton}
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
						<h2>Cả lớp đã hạ gục Boss {progress.round}!</h2>
						<button type="button" className={styles.startButton} onClick={newBoss}>
							Gọi Boss mới <kbd>Space</kbd>
						</button>
					</m.div>
				) : null}
			</AnimatePresence>

			{toast ? (
				<div className={styles.toast} data-tone={toast.tone} role="status">
					{toast.text}
				</div>
			) : null}

			{setupOpen ? (
				<ArenaSetup
					config={config}
					sessions={sessions}
					tutorials={data.tutorials}
					decks={data.decks}
					players={data.players}
					session={session}
					started={started}
					openingCp={openingCp}
					recallHref={routes.mySpaceTeachingClassTab(data.class.id, 'recall')}
					onChange={setConfig}
					onOpenCp={openCp}
					onReload={() => window.location.reload()}
					onDone={closeSetup}
					onClose={session && started ? closeSetup : undefined}
				/>
			) : null}
			{confirmDialog}
		</div>
	);
}
