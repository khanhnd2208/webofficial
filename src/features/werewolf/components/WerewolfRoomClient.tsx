'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { routes } from '@/config/routes';
import SiteAuthChip from '@/components/site/SiteAuthChip';
import LiveBotControls from '@/features/board-game-bots/LiveBotControls';
import PrefsToggleGroup from '@/features/board-game-shared/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import ConnectionBanner from '@/features/board-game-shared/components/ConnectionBanner';
import ConnectionDot from '@/features/board-game-shared/components/ConnectionDot';
import PassportAvatar from '@/features/board-game-shared/components/PassportAvatar';
import PlayerNameInput from '@/features/board-game-shared/components/PlayerNameInput';
import { Button, Field, Spinner } from '@/features/board-game-shared/components/ui';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';
import { hapticLight } from '@/features/board-game-shared/lib/haptics';
import {
	isValidPlayerName,
	normalizePlayerName,
} from '@/features/board-game-shared/lib/playerName';
import HostBoard from '@/features/werewolf/components/HostBoard';
import InviteCard from '@/features/werewolf/components/InviteCard';
import CardDeckSelector from '@/features/werewolf/components/CardDeckSelector';
import { getCardDeck } from '@/features/werewolf/config/cardDecks';
import type { CardDeck } from '@/features/werewolf/types';
import RoleCard from '@/features/werewolf/components/RoleCard';
import RoleSetupPanel, {
	useDebouncedRoleCounts,
} from '@/features/werewolf/components/RoleSetupPanel';
import { useWerewolfRoom } from '@/features/werewolf/components/hooks/useWerewolfRoom';
import {
	clearPlayerToken,
	getRecentPlayerName,
	getStoredPlayerToken,
	storeRecentPlayerName,
} from '@/features/werewolf/lib/clientToken';
import type { RoleCount } from '@/features/werewolf/types';
import { TEST_VIEWER_TOKEN } from '@/features/board-game-test/clientApi';

interface Props {
	code: string;
	initialName?: string;
	adminTest?: boolean;
}

export default function WerewolfRoomClient({ code, initialName, adminTest = false }: Props) {
	const t = useT();
	const router = useRouter();
	const [hydrated, setHydrated] = useState(false);
	const [playerToken, setPlayerToken] = useState<string | null>(null);
	const [joinName, setJoinName] = useState(initialName ?? '');
	const [busy, setBusy] = useState(false);
	const [removed, setRemoved] = useState(false);
	const [wasSeated, setWasSeated] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);
	const autoJoinStarted = useRef(false);

	const { state, error, errorCode, loading, refresh, api } = useWerewolfRoom({
		code,
		playerToken: adminTest ? TEST_VIEWER_TOKEN : playerToken,
		onTokenReceived: setPlayerToken,
		adminTest,
	});

	const saveRoles = useCallback(
		(counts: RoleCount[]) =>
			api.setRoles(counts).catch((cause: unknown) => {
				setJoinError(cause instanceof Error ? cause.message : t('common.unknownError'));
				throw cause;
			}),
		[api, t],
	);

	const { counts, setCounts, saving } = useDebouncedRoleCounts(state?.roleCounts ?? [], saveRoles);

	const keepAwake = Boolean(state && (state.isHost || state.self));
	useEffect(() => {
		if (!keepAwake) return;
		let cancelled = false;
		let sentinel: WakeLockSentinel | null = null;
		const acquire = () => {
			if (!('wakeLock' in navigator)) return;
			void navigator.wakeLock
				.request('screen')
				.then((lock) => {
					// The effect may have been torn down while the request was pending.
					if (cancelled) {
						void lock.release();
						return;
					}
					void sentinel?.release();
					sentinel = lock;
				})
				.catch(() => undefined);
		};
		acquire();
		const onVisible = () => {
			if (document.visibilityState === 'visible') acquire();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			cancelled = true;
			document.removeEventListener('visibilitychange', onVisible);
			void sentinel?.release();
		};
	}, [keepAwake]);

	useEffect(() => {
		setPlayerToken(adminTest ? TEST_VIEWER_TOKEN : getStoredPlayerToken(code));
		setJoinName((prev) => prev || initialName || getRecentPlayerName() || '');
		setHydrated(true);
	}, [adminTest, code, initialName]);

	const joinRoom = useCallback(
		async (name: string, existingToken?: string) => {
			const trimmed = normalizePlayerName(name);
			if (!isValidPlayerName(trimmed)) return;
			setJoinError(null);
			const data = await api.join(trimmed, existingToken);
			storeRecentPlayerName(trimmed);
			setPlayerToken(data.playerToken);
		},
		[api],
	);

	useEffect(() => {
		if (!removed) return;
		clearPlayerToken(code);
	}, [removed, code]);

	useEffect(() => {
		if (!hydrated || playerToken || autoJoinStarted.current || removed) return;
		const name = normalizePlayerName(initialName ?? '');
		if (!isValidPlayerName(name)) return;
		autoJoinStarted.current = true;
		void joinRoom(name).catch((cause: unknown) => {
			autoJoinStarted.current = false;
			setJoinError(cause instanceof Error ? cause.message : t('mafia.room.joinFail'));
		});
	}, [hydrated, playerToken, initialName, joinRoom, removed, t]);

	async function handleLeave() {
		if (adminTest) return;
		if (state?.isHost && !window.confirm(t('mafia.host.leaveConfirm'))) return;
		setBusy(true);
		try {
			if (playerToken) await api.leave();
			clearPlayerToken(code);
			router.push(routes.maSoi);
		} catch (cause) {
			setJoinError(cause instanceof Error ? cause.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}

	async function handleCardDeck(cardDeck: CardDeck) {
		setBusy(true);
		setJoinError(null);
		try {
			await api.setCardDeck(cardDeck);
		} catch (cause) {
			setJoinError(cause instanceof Error ? cause.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}

	async function handleDeal() {
		setBusy(true);
		setJoinError(null);
		try {
			if (state?.phase === 'lobby') await api.setRoles(counts);
			await api.deal();
		} catch (cause) {
			setJoinError(cause instanceof Error ? cause.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}

	if (!hydrated || (loading && !state && errorCode !== 'ROOM_NOT_FOUND')) {
		return (
			<div className="game-theme game-theme-werewolf flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
				<div className="game-theme-mark mb-2">
					<GameIcon name="wolf" size={25} />
				</div>
				<Spinner size="lg" />
				<p>{t('mafia.room.entering')}</p>
			</div>
		);
	}

	if (errorCode === 'ROOM_NOT_FOUND') {
		return (
			<div className="game-theme game-theme-werewolf mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
				<h1 className="font-display text-2xl font-semibold text-ink">{t('mafia.room.closed')}</h1>
				<p className="text-sm text-muted-foreground">{t('mafia.room.closedBody')}</p>
				<Button type="button" onClick={() => router.push(routes.maSoi)}>
					{t('mafia.room.backToMenu')}
				</Button>
			</div>
		);
	}

	if (state?.self && !state.self.left && !wasSeated) setWasSeated(true);
	const sessionRemoved = wasSeated && Boolean(state && !state.isHost && !state.self);
	if ((state?.self?.left || sessionRemoved) && !removed) setRemoved(true);

	if (removed) {
		return (
			<div className="game-theme game-theme-werewolf mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
				<h1 className="font-display text-2xl font-semibold text-ink">{t('mafia.room.kicked')}</h1>
				<p className="text-sm text-muted-foreground">{t('mafia.room.kickedBody')}</p>
				<Button type="button" onClick={() => router.push(routes.maSoi)}>
					{t('mafia.room.backToMenu')}
				</Button>
			</div>
		);
	}

	const inRoom = Boolean(state && (state.isHost || (state.self && !state.self.left)));
	if (!inRoom) {
		return (
			<div className="game-theme game-theme-werewolf mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
				<h1 className="font-display text-2xl font-semibold text-ink">
					{t('mafia.room.joinTitle')}
				</h1>
				<p className="mt-1 font-mono text-sm tracking-widest text-muted">{code}</p>
				<form
					className="mt-6 space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						if (!isValidPlayerName(joinName)) {
							setJoinError(t('spy.lobby.nameInvalid'));
							return;
						}
						hapticLight();
						setBusy(true);
						void joinRoom(joinName)
							.catch((cause: unknown) => {
								setJoinError(cause instanceof Error ? cause.message : t('mafia.room.joinFail'));
							})
							.finally(() => setBusy(false));
					}}
				>
					<Field label={t('mafia.menu.yourName')} htmlFor="room-join-name" error={joinError}>
						<PlayerNameInput
							id="room-join-name"
							value={joinName}
							maxLength={24}
							error={Boolean(joinError)}
							onChange={(e) => {
								setJoinName(e.target.value);
								setJoinError(null);
							}}
						/>
					</Field>
					<Button type="submit" fullWidth loading={busy}>
						{t('mafia.menu.join')}
					</Button>
				</form>
			</div>
		);
	}

	if (!state) return null;

	return (
		<div className="game-theme game-theme-werewolf">
			<div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 lg:max-w-3xl">
				<header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
					<button
						type="button"
						className="game-theme-icon-button"
						onClick={() => void handleLeave()}
						disabled={busy}
						aria-label={t('mafia.lobby.leave')}
						title={t('mafia.lobby.leave')}
					>
						<GameIcon name="arrow-left" size={17} />
					</button>
					<span className="game-theme-mark h-9 w-9 rounded-lg shadow-none">
						<GameIcon name="wolf" size={17} />
					</span>
					<div className="min-w-0 flex-1 text-center">
						<p className="font-display text-sm font-semibold text-ink">{state.hostName}</p>
						<p className="font-mono text-xs tracking-widest text-muted">{state.code}</p>
					</div>
					<PrefsToggleGroup />
					<SiteAuthChip variant="badge" showSignIn={false} />
				</header>

				<ConnectionBanner error={error ?? joinError} onRetry={() => void refresh()} />

				{state.isHost && state.phase === 'lobby' ? (
					<div className="space-y-8">
						<InviteCard code={state.code} />
						{adminTest ? null : (
							<LiveBotControls
								game="ma-soi"
								code={state.code}
								hostToken={playerToken}
								full={state.playerCount >= state.maxPlayers}
								onChanged={refresh}
							/>
						)}
						<PlayerList
							state={state}
							selfToken={null}
							busy={busy}
							onKick={(token, name) => {
								if (!window.confirm(t('mafia.host.kickConfirm', { name }))) return;
								setBusy(true);
								void api.kick(token).finally(() => setBusy(false));
							}}
						/>
						<CardDeckSelector
							value={getCardDeck(state.cardDeck)}
							disabled={busy || saving}
							onChange={(deck) => void handleCardDeck(deck)}
						/>
						<RoleSetupPanel
							cardDeck={getCardDeck(state.cardDeck)}
							playerCount={state.playerCount}
							roleCounts={counts}
							saving={saving}
							onChange={setCounts}
							onDeal={() => void handleDeal()}
							dealBusy={busy}
						/>
					</div>
				) : null}

				{!state.isHost && state.phase === 'lobby' ? (
					<div className="space-y-6">
						<p className="text-center text-sm text-muted-foreground">
							{t('mafia.lobby.joined', { host: state.hostName })}
						</p>
						<PlayerList state={state} selfToken={state.self?.token ?? null} />
						<p className="text-center text-sm text-ink">{t('mafia.lobby.waiting')}</p>
					</div>
				) : null}

				{state.isHost && state.phase === 'dealt' ? (
					<HostBoard
						cardDeck={getCardDeck(state.cardDeck)}
						code={state.code}
						players={state.players}
						busy={busy}
						canRedeal={!state.players.some((player) => player.left)}
						onRedeal={() => void handleDeal()}
						onBackToLobby={() => {
							setBusy(true);
							void api.lobby().finally(() => setBusy(false));
						}}
						onKick={(token, name) => {
							if (!window.confirm(t('mafia.host.kickConfirm', { name }))) return;
							setBusy(true);
							void api.kick(token).finally(() => setBusy(false));
						}}
					/>
				) : null}

				{!state.isHost && state.phase === 'dealt' && state.self ? (
					<RoleCard
						key={`${state.dealRound}:${getCardDeck(state.cardDeck)}`}
						cardDeck={getCardDeck(state.cardDeck)}
						roleId={state.self.roleId}
						onViewed={() => api.viewed()}
					/>
				) : null}
			</div>
		</div>
	);
}

function PlayerList({
	state,
	selfToken,
	busy = false,
	onKick,
}: {
	state: {
		players: {
			token: string;
			name: string;
			avatarSeed: string;
			connected: boolean;
			left?: boolean;
		}[];
		hostName: string;
		hostConnected: boolean;
	};
	selfToken: string | null;
	busy?: boolean;
	onKick?: (token: string, name: string) => void;
}) {
	const t = useT();
	return (
		<section>
			<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
				{t('mafia.lobby.players')}
			</h2>
			{state.players.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t('mafia.lobby.empty')}</p>
			) : null}
			<ul className="space-y-2">
				<li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
					<ConnectionDot connected={state.hostConnected} />
					<span className="text-sm text-ink">{state.hostName}</span>
					<span className="text-xs text-muted">{t('mafia.header.hostAria')}</span>
				</li>
				{state.players.map((player) => (
					<li
						key={player.token}
						className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
					>
						<PassportAvatar name={player.name} avatarSeed={player.avatarSeed} size="sm" />
						<ConnectionDot connected={player.connected} />
						<span className="truncate text-sm text-ink">{player.name}</span>
						{player.token === selfToken ? (
							<span className="text-xs text-muted">{t('mafia.lobby.you')}</span>
						) : null}
						{onKick && !player.left ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="ml-auto"
								disabled={busy}
								onClick={() => onKick(player.token, player.name)}
							>
								{t('mafia.host.kick')}
							</Button>
						) : null}
					</li>
				))}
			</ul>
		</section>
	);
}
