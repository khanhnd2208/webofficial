'use client';

import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useMotionTier } from '@/components/motion';
import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import { recallVisibleText } from '@/features/active-recall/richText';
import {
	drawCard,
	drawFromBag,
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
	const [historyOpen, setHistoryOpen] = useState(false);
	const [phase, setPhase] = useState<Phase>('idle');
	const [mood, setMood] = useState<MonsterMood>('idle');
	const [highlightId, setHighlightId] = useState<string | null>(null);
	const [current, setCurrent] = useState<{ enrollmentId: string; cardId: string | null } | null>(
		null,
	);
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
		const steps = reducedMotion ? [] : HUNT_STEPS_MS;
		let elapsed = 0;
		let previousId: string | null = null;
		for (const step of steps) {
			elapsed += step;
			later(elapsed, () => {
				const pool =
					eligibleIds.length > 1 ? eligibleIds.filter((id) => id !== previousId) : eligibleIds;
				previousId = pool[Math.floor(Math.random() * pool.length)] ?? null;
				setHighlightId(previousId);
			});
		}
		later(elapsed + 120, () => setHighlightId(picked));
		later(elapsed + (reducedMotion ? 200 : 750), () => {
			setCurrent({ enrollmentId: picked, cardId: card.cardId });
			setPhase('caught');
			setMood('idle');
		});
	}, [phase, session, callable, progress, cards, reducedMotion, later]);

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
		const player = playersById.get(current.enrollmentId);
		setSaving(true);
		try {
			const result = await award(current.enrollmentId, level);
			record('pass', { award: level, cpAfter: result.points });
			setToast({
				tone: 'ok',
				text: result.changed
					? `${player?.givenName ?? ''}: CP ${result.previous} → ${result.points}`
					: `${player?.givenName ?? ''}: giữ CP ${result.points} (đã bằng hoặc cao hơn)`,
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

	function handleSkip() {
		if (!current) return;
		const skippedId = current.enrollmentId;
		record('skip');
		// The skipped student keeps their turn: back to the end of the bag.
		setProgress((previous) => ({ ...previous, bag: [...previous.bag, skippedId] }));
		setCurrent(null);
		setHighlightId(null);
		setPhase('idle');
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

	function toggleFullscreen() {
		if (document.fullscreenElement) void document.exitFullscreen?.();
		else void document.documentElement.requestFullscreen?.().catch(() => undefined);
	}

	// Keyboard: Space hunts; in a question, keys press the matching button.
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (target?.closest('input, select, textarea, [contenteditable="true"]')) return;
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (setupOpen) {
				if (event.key === 'Escape' && session) setSetupOpen(false);
				return;
			}
			const key = event.key.toLowerCase();
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
					<p className={styles.eyebrow}>
						{data.class.courseCode} · {data.class.classCode}
					</p>
					<h1 className={styles.title}>
						Kiểm tra bài cũ
						{session ? <span> · {sessionLabel(session, data.tutorials)}</span> : null}
					</h1>
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
					<button type="button" className={styles.ghostButton} onClick={() => setSetupOpen(true)}>
						Thiết lập
					</button>
					<button
						type="button"
						className={styles.ghostButton}
						aria-pressed={historyOpen}
						onClick={() => setHistoryOpen((open) => !open)}
					>
						Đã gọi ({progress.history.filter((entry) => entry.result !== 'skip').length})
					</button>
					<button type="button" className={styles.ghostButton} onClick={toggleFullscreen}>
						Toàn màn hình
					</button>
					<Link href={routes.mySpaceTeachingClass(data.class.id)} className={styles.ghostButton}>
						Về lớp
					</Link>
				</nav>
			</header>

			<main className={styles.stage}>
				<div className={styles.monsterZone}>
					<ArenaMonster mood={mood} size={phase === 'hunting' ? 280 : 240} />
					<p className={styles.stageNote}>
						{inRoom.length} có mặt · {callable.length} có thể bị bắt
					</p>
				</div>
				<ArenaFloor
					players={inRoom}
					highlightId={highlightId}
					caughtId={phase === 'caught' ? (current?.enrollmentId ?? null) : null}
					hunting={phase === 'hunting'}
					calledIds={calledIds}
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
						key={`${caughtPlayer.enrollmentId}-${current?.cardId ?? 'none'}`}
						player={caughtPlayer}
						card={caughtCard}
						deckLabel={caughtDeck ? caughtDeck.lessonLabel || caughtDeck.title : ''}
						cpNow={cpFor(caughtPlayer.enrollmentId)}
						saving={saving}
						onPass={handlePass}
						onFail={handleFail}
						onSkipStudent={handleSkip}
						onNextCard={handleNextCard}
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
					openingCp={openingCp}
					recallHref={routes.mySpaceTeachingClassTab(data.class.id, 'recall')}
					onChange={setConfig}
					onOpenCp={openCp}
					onStart={() => setSetupOpen(false)}
					onClose={session ? () => setSetupOpen(false) : undefined}
				/>
			) : null}
			{confirmDialog}
		</div>
	);
}
