'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import PlayerNameInput from '@/components/spy/PlayerNameInput';
import { Button, ErrorState, Field, Spinner, useToast } from '@/components/ui';
import {
	clearPlayerToken,
	getRecentPlayerName,
	getStoredPlayerToken,
	storePlayerToken,
	storeRecentPlayerName,
} from '@/lib/spy/clientToken';
import { hapticLight } from '@/lib/haptics';
import { isValidPlayerName, normalizePlayerName } from '@/lib/spy/playerName';
import { playConfirm } from '@/lib/sounds';

import GameShell from './GameShell';
import ConnectionBanner from './ConnectionBanner';
import HostGameControls from './HostGameControls';
import { BriefingFab, BriefingSheet } from './MissionBriefing';
import { RoleFab, RoleSheet } from './RoleReview';
import DiscussionPhase from './phases/DiscussionPhase';
import LobbyPhase from './phases/LobbyPhase';
import MrWhiteGuessPhase from './phases/MrWhiteGuessPhase';
import OpeningPhase from './phases/OpeningPhase';
import ResultPhase from './phases/ResultPhase';
import RoleRevealPhase from './phases/RoleRevealPhase';
import RunoffPhase from './phases/RunoffPhase';
import VotePhase from './phases/VotePhase';
import { useSpyRoom } from './hooks/useSpyRoom';

const JOIN_TIMEOUT_MS = 8000;

interface Props {
	code: string;
	initialName?: string;
}

export default function SpyGameClient({ code, initialName }: Props) {
	const t = useT();
	const router = useRouter();
	const { toast } = useToast();
	const [hydrated, setHydrated] = useState(false);
	const [playerToken, setPlayerToken] = useState<string | null>(null);
	const [joinName, setJoinName] = useState(initialName ?? '');
	const [busy, setBusy] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [joinTimedOut, setJoinTimedOut] = useState(false);
	const [briefingOpen, setBriefingOpen] = useState(false);
	const [roleOpen, setRoleOpen] = useState(false);
	const autoJoinStarted = useRef(false);
	const closeBriefing = useCallback(() => setBriefingOpen(false), []);
	const closeRole = useCallback(() => setRoleOpen(false), []);

	const { state, error, loading, api, refresh } = useSpyRoom({
		code,
		playerToken,
		onTokenReceived: setPlayerToken,
	});

	useEffect(() => {
		const stored = getStoredPlayerToken(code);
		setPlayerToken(stored);
		setJoinName((prev) => prev || initialName || getRecentPlayerName() || '');
		setHydrated(true);
	}, [code, initialName]);

	const wrap = useCallback(
		async (fn: () => Promise<unknown>) => {
			setBusy(true);
			try {
				await fn();
			} catch (e) {
				setJoinError(e instanceof Error ? e.message : t('common.unknownError'));
			} finally {
				setBusy(false);
			}
		},
		[t],
	);

	const joinRoom = useCallback(
		async (name: string, existingToken?: string) => {
			const trimmed = normalizePlayerName(name);
			if (!isValidPlayerName(trimmed)) return;
			setJoinError(null);
			setJoinTimedOut(false);
			try {
				const data = await api.join(trimmed, existingToken);
				storePlayerToken(code, data.playerToken);
				storeRecentPlayerName(trimmed);
				setPlayerToken(data.playerToken);
				playConfirm();
				toast(t('spy.join.joined'), 'success');
			} catch (e) {
				setJoinError(e instanceof Error ? e.message : t('spy.join.joinFail'));
				throw e;
			}
		},
		[api, code, t, toast],
	);

	useEffect(() => {
		if (!hydrated || playerToken || autoJoinStarted.current) return;
		const name = normalizePlayerName(initialName ?? '');
		if (!isValidPlayerName(name)) return;

		autoJoinStarted.current = true;
		void joinRoom(name).catch(() => {
			autoJoinStarted.current = false;
		});
	}, [hydrated, playerToken, initialName, joinRoom]);

	const hasCredentials = Boolean(
		playerToken || isValidPlayerName(normalizePlayerName(initialName ?? '')),
	);
	const awaitingSession = hasCredentials && (loading || !state?.self) && !joinError && !joinTimedOut;

	useEffect(() => {
		if (!awaitingSession) return;
		const timer = window.setTimeout(() => setJoinTimedOut(true), JOIN_TIMEOUT_MS);
		return () => window.clearTimeout(timer);
	}, [awaitingSession]);

	async function handleJoin(e: React.FormEvent) {
		e.preventDefault();
		if (!isValidPlayerName(joinName)) return;
		hapticLight();
		await wrap(() => joinRoom(joinName.trim(), playerToken ?? undefined));
	}

	const handleLeave = useCallback(async () => {
		if (!playerToken) {
			router.push('/games/spy');
			return;
		}

		const inGame = state?.phase && state.phase !== 'lobby';
		if (inGame) {
			const ok = window.confirm(t('spy.shell.leaveConfirm'));
			if (!ok) return;
		}

		setBusy(true);
		try {
			await api.leave();
			clearPlayerToken(code);
			toast(t('spy.shell.left'), 'default');
			router.push('/games/spy');
		} catch (e) {
			setJoinError(e instanceof Error ? e.message : t('spy.shell.leaveFail'));
		} finally {
			setBusy(false);
		}
	}, [api, code, playerToken, router, state?.phase, t, toast]);

	if (!hydrated) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
				<Spinner size="lg" />
				<p>{t('spy.join.entering')}</p>
			</div>
		);
	}

	if (awaitingSession) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
				<Spinner size="lg" />
				<p>{t('spy.join.entering')}</p>
			</div>
		);
	}

	if (!state?.self) {
		return (
			<div className="relative min-h-screen bg-background">
				<div className="mx-auto max-w-md px-4 py-10 pb-[max(4rem,env(safe-area-inset-bottom))] lg:max-w-lg">
					<header className="mb-6 text-center">
						<p className="font-mono text-xs uppercase tracking-widest text-muted">
							{t('spy.join.eyebrow')}
						</p>
						<h1 className="font-display mt-2 text-2xl font-bold text-ink">
							{t('spy.join.room', { code })}
						</h1>
					</header>
					<form
						onSubmit={handleJoin}
						className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm"
					>
						<Field label={t('spy.join.name')} htmlFor="join-name">
							<PlayerNameInput
								id="join-name"
								value={joinName}
								onChange={(e) => setJoinName(e.target.value)}
								maxLength={24}
								placeholder={t('spy.join.namePlaceholder')}
								autoFocus
							/>
						</Field>
						{(joinError || error || joinTimedOut) && (
							<ErrorState
								message={joinError ?? error ?? t('spy.join.autoFail')}
								onRetry={() => {
									setJoinError(null);
									setJoinTimedOut(false);
									autoJoinStarted.current = false;
								}}
							/>
						)}
						<Button
							type="submit"
							fullWidth
							loading={busy}
							disabled={!isValidPlayerName(joinName)}
						>
							{t('spy.join.submit')}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							fullWidth
							onClick={() => router.push('/games/spy')}
						>
							{t('spy.join.backMenu')}
						</Button>
					</form>
				</div>
			</div>
		);
	}

	if (!state) {
		return (
			<div className="mx-auto max-w-md px-4 py-12">
				<ErrorState
					title={t('spy.join.loadFailTitle')}
					message={error ?? t('spy.join.loadFailBody')}
					onRetry={() => window.location.reload()}
				/>
			</div>
		);
	}

	const displayError = joinError ?? error;
	const canReviewRole = Boolean(
		(state.self?.keyword || state.self?.role) &&
			!['lobby', 'result', 'role-reveal'].includes(state.phase),
	);

	return (
		<GameShell
			phase={state.phase}
			roomName={state.name}
			code={state.code}
			onLeave={() => void handleLeave()}
			leaveBusy={busy}
		>
			<ConnectionBanner
				error={displayError}
				onRetry={() => {
					setJoinError(null);
					void refresh();
				}}
			/>

			<div className="animate-fade-in">
				{state.phase === 'lobby' && (
					<LobbyPhase
						state={state}
						busy={busy}
						onReady={(r) =>
							wrap(async () => {
								await api.setReady(r);
								toast(r ? t('spy.lobby.readyToast') : t('spy.lobby.unreadyToast'), 'success');
							})
						}
						onStart={() => wrap(() => api.start())}
						onSettings={(s) => wrap(() => api.settings(s))}
						onRename={(name) =>
							wrap(async () => {
								await api.rename(name);
								storeRecentPlayerName(name);
								toast(t('spy.lobby.renamed'), 'success');
							})
						}
						onKick={(targetToken) =>
							wrap(async () => {
								await api.kick(targetToken);
								toast(t('spy.lobby.kicked'), 'success');
							})
						}
					/>
				)}

				{state.phase === 'role-reveal' && state.self && (
					<RoleRevealPhase
						self={state.self}
						busy={busy}
						hideRoles={state.hideRoles}
						onConfirm={() => wrap(() => api.memorized())}
					/>
				)}

				{state.phase === 'opening' && (
					<OpeningPhase
						state={state}
						busy={busy}
						onSpoke={() => wrap(() => api.spoke())}
						onHostMarkSpoke={(tok, s) => wrap(() => api.hostMarkSpoke(tok, s))}
					/>
				)}

				{state.phase === 'discussion' && (
					<DiscussionPhase
						state={state}
						busy={busy}
						onSuspect={(tok) => wrap(() => api.suspect(tok))}
						onNext={() => wrap(() => api.next())}
					/>
				)}

				{state.phase === 'vote' && (
					<VotePhase
						state={state}
						busy={busy}
						onVote={(v1, v2, c) =>
							wrap(() => api.vote({ vote1Token: v1, vote2Token: v2, confirmed: c }))
						}
						onNext={() => wrap(() => api.next())}
					/>
				)}

				{state.phase === 'runoff' && state.runoff && (
					<RunoffPhase
						state={state}
						busy={busy}
						onSubmit={(choices) => wrap(() => api.runoffVote(choices))}
						onNext={() => wrap(() => api.next())}
					/>
				)}

				{state.phase === 'mrwhite-guess' && (
					<MrWhiteGuessPhase
						state={state}
						busy={busy}
						onResult={(correct) =>
							wrap(() => api.mrWhiteResult(correct ? 'correct' : 'incorrect'))
						}
					/>
				)}

				{state.phase === 'result' && state.result && (
					<ResultPhase
						state={state}
						busy={busy}
						onRevealWords={
							state.isHost && !state.result.wordsRevealed
								? () => wrap(() => api.revealWords())
								: undefined
						}
						onPlayAgain={
							state.isHost
								? () =>
										wrap(async () => {
											await api.playAgain();
											toast(t('spy.result.playAgainToast'), 'success');
										})
								: undefined
						}
					/>
				)}
			</div>

			{state.isHost && state.phase !== 'lobby' && state.phase !== 'result' ? (
				<HostGameControls
					phase={state.phase}
					busy={busy}
					onConfirmAll={
						state.phase === 'role-reveal' || state.phase === 'opening'
							? () => wrap(() => api.next())
							: undefined
					}
					onRestart={() =>
						wrap(async () => {
							await api.restart();
							toast(t('spy.host.restarted'), 'success');
						})
					}
				/>
			) : null}

			<BriefingFab onOpen={() => setBriefingOpen(true)} />
			<BriefingSheet open={briefingOpen} onClose={closeBriefing} hideRoles={state.hideRoles} />
			{canReviewRole && state.self ? (
				<>
					<RoleFab onOpen={() => setRoleOpen(true)} />
					<RoleSheet
						open={roleOpen}
						onClose={closeRole}
						self={state.self}
						hideRoles={state.hideRoles}
					/>
				</>
			) : null}
		</GameShell>
	);
}
