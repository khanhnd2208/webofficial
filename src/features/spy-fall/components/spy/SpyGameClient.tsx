'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/spy-fall/components/spy/PlayerNameInput';
import { Button, ErrorState, Field, Spinner, useToast } from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import {
	clearPlayerToken,
	getRecentPlayerName,
	getStoredPlayerToken,
	storePlayerToken,
	storeRecentPlayerName,
} from '@/features/spy-fall/lib/spy/clientToken';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import { routes } from '@/config/routes';

import GameShell from './GameShell';
import ConnectionBanner from './ConnectionBanner';
import HostGameControls from './HostGameControls';
import { HostToolsContext, WordPeekContext } from './ActionBar';
import { BriefingSheet } from './MissionBriefing';
import { RoleSheet } from './RoleReview';
import DiscussionPhase from './phases/DiscussionPhase';
import LobbyPhase from './phases/LobbyPhase';
import ResultPhase from './phases/ResultPhase';
import RevealPhase from './phases/RevealPhase';
import RoleRevealPhase from './phases/RoleRevealPhase';
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
	const awaitingSession =
		hasCredentials && (loading || !state?.self) && !joinError && !joinTimedOut;

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
			router.push(routes.spyFall);
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
			router.push(routes.spyFall);
		} catch (e) {
			setJoinError(e instanceof Error ? e.message : t('spy.shell.leaveFail'));
		} finally {
			setBusy(false);
		}
	}, [api, code, playerToken, router, state?.phase, t, toast]);

	if (!hydrated) {
		return (
			<div className="game-theme game-theme-spy flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
				<div className="game-theme-mark mb-2">
					<GameIcon name="spy" size={25} />
				</div>
				<Spinner size="lg" />
				<p>{t('spy.join.entering')}</p>
			</div>
		);
	}

	if (awaitingSession) {
		return (
			<div className="game-theme game-theme-spy flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
				<div className="game-theme-mark mb-2">
					<GameIcon name="spy" size={25} />
				</div>
				<Spinner size="lg" />
				<p>{t('spy.join.entering')}</p>
			</div>
		);
	}

	if (!state?.self) {
		return (
			<div className="game-theme game-theme-spy">
				<div className="relative mx-auto max-w-xl px-4 py-8 pb-[max(4rem,env(safe-area-inset-bottom))]">
					<header className="game-theme-hero rounded-[1.25rem]">
						<Image
							src="/brand/myspace/spy-fall-menu-poster.png"
							alt={t('spy.menu.posterAlt')}
							fill
							className="game-theme-hero-image"
							sizes="(max-width: 576px) 100vw, 576px"
						/>
						<div className="relative z-10 flex min-h-[18rem] flex-col justify-between p-6 sm:p-8">
							<div className="game-theme-mark">
								<GameIcon name="spy" size={27} />
							</div>
							<div>
								<p className="game-theme-kicker">{t('spy.join.eyebrow')}</p>
								<h1 className="mt-2 font-display text-3xl font-bold text-ink">
									{t('spy.join.room', { code })}
								</h1>
							</div>
						</div>
					</header>
					<form
						onSubmit={handleJoin}
						className="game-theme-panel relative z-10 mx-4 -mt-6 space-y-4 rounded-2xl p-6 shadow-sm"
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
						<Button type="submit" fullWidth loading={busy} disabled={!isValidPlayerName(joinName)}>
							<GameIcon name="lock" size={17} />
							{t('spy.join.submit')}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							fullWidth
							onClick={() => router.push(routes.spyFall)}
						>
							<GameIcon name="arrow-left" size={16} />
							{t('spy.join.backMenu')}
						</Button>
					</form>
				</div>
			</div>
		);
	}

	if (!state) {
		return (
			<div className="game-theme game-theme-spy mx-auto max-w-md px-4 py-12">
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

	const openRole = () => setRoleOpen(true);
	const hostTools =
		state.isHost && state.phase !== 'lobby' && state.phase !== 'result' ? (
			<HostGameControls
				phase={state.phase}
				busy={busy}
				onConfirmAll={() => wrap(() => api.next())}
				onRestart={() =>
					wrap(async () => {
						await api.restart();
						toast(t('spy.host.restarted'), 'success');
					})
				}
			/>
		) : null;

	return (
		<GameShell
			phase={state.phase}
			roomName={state.name}
			code={state.code}
			round={state.round}
			onLeave={() => void handleLeave()}
			leaveBusy={busy}
			onOpenGuide={() => setBriefingOpen(true)}
		>
			<ConnectionBanner
				error={displayError}
				onRetry={() => {
					setJoinError(null);
					void refresh();
				}}
			/>

			<WordPeekContext.Provider value={canReviewRole ? openRole : null}>
				<HostToolsContext.Provider value={hostTools}>
					<div key={state.phase} className="flex flex-1 flex-col animate-fade-in">
						{state.phase === 'lobby' && (
							<LobbyPhase
								state={state}
								busy={busy}
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
								state={state}
								busy={busy}
								onConfirm={() => wrap(() => api.memorized())}
							/>
						)}

						{state.phase === 'discussion' && (
							<DiscussionPhase state={state} busy={busy} onNext={() => wrap(() => api.next())} />
						)}

						{state.phase === 'vote' && (
							<VotePhase
								state={state}
								busy={busy}
								onVote={(target) => wrap(() => api.vote(target))}
								onNext={() => wrap(() => api.next())}
							/>
						)}

						{state.phase === 'reveal' && (
							<RevealPhase state={state} busy={busy} onNext={() => wrap(() => api.next())} />
						)}

						{state.phase === 'result' && state.result && (
							<ResultPhase
								state={state}
								busy={busy}
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
				</HostToolsContext.Provider>
			</WordPeekContext.Provider>

			<BriefingSheet open={briefingOpen} onClose={closeBriefing} />
			{canReviewRole && state.self ? (
				<RoleSheet open={roleOpen} onClose={closeRole} self={state.self} />
			) : null}
		</GameShell>
	);
}
