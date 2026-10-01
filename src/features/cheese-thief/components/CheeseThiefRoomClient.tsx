'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import SiteAuthChip from '@/components/site/SiteAuthChip';
import { routes } from '@/config/routes';
import LiveBotControls from '@/features/board-game-bots/LiveBotControls';
import { CheeseRulesButton } from '@/features/cheese-thief/components/CheeseRulesGuide';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import { useCheeseThiefRoom } from '@/features/cheese-thief/components/hooks/useCheeseThiefRoom';
import { TEST_VIEWER_TOKEN } from '@/features/board-game-test/clientApi';
import DayPhase from '@/features/cheese-thief/components/phases/DayPhase';
import DealPhase from '@/features/cheese-thief/components/phases/DealPhase';
import LobbyPhase from '@/features/cheese-thief/components/phases/LobbyPhase';
import NightPhase from '@/features/cheese-thief/components/phases/NightPhase';
import RevealPhase from '@/features/cheese-thief/components/phases/RevealPhase';
import SecretPhase from '@/features/cheese-thief/components/phases/SecretPhase';
import SecretResultPhase from '@/features/cheese-thief/components/phases/SecretResultPhase';
import VotePhase from '@/features/cheese-thief/components/phases/VotePhase';
import {
	clearPlayerToken,
	getStoredPlayerToken,
	storePlayerToken,
} from '@/features/cheese-thief/lib/clientToken';
import CheeseCheckPhase from '@/features/cheese-thief/components/phases/CheeseCheckPhase';
import TiePhase from '@/features/cheese-thief/components/phases/TiePhase';
import { startNightTrack, unlockTableAudio } from '@/features/cheese-thief/lib/narration';
import { prepareNightTrack } from '@/features/cheese-thief/lib/nightTrack';
import { useLocale, useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/board-game-shared/components/PlayerNameInput';
import { Button, Field, Spinner } from '@/features/board-game-shared/components/ui';
import {
	getRecentPlayerName,
	storeRecentPlayerName,
} from '@/features/board-game-shared/lib/clientToken';
import {
	isValidPlayerName,
	normalizePlayerName,
} from '@/features/board-game-shared/lib/playerName';

interface Props {
	code: string;
	initialName?: string;
	adminTest?: boolean;
}

export default function CheeseThiefRoomClient({ code, initialName, adminTest = false }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const router = useRouter();
	const [hydrated, setHydrated] = useState(false);
	const [playerToken, setPlayerToken] = useState<string | null>(null);
	const [joinName, setJoinName] = useState(initialName ?? '');
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const { state, error, loading, fetchedAt, api, refresh } = useCheeseThiefRoom({
		code,
		playerToken: adminTest ? TEST_VIEWER_TOKEN : playerToken,
		onTokenReceived: setPlayerToken,
		adminTest,
	});

	// The host phone builds the recorded night while the table reads roles or looks at the cheese,
	// so the tap that starts the night can also start the sound.
	const hostPhase = state?.isHost ? state?.phase : null;
	const tableMode = state?.mode ?? 'classic';
	const hourSeconds = state?.hourSeconds;
	useEffect(() => {
		if (hourSeconds === undefined) return;
		if (hostPhase === 'deal')
			void prepareNightTrack({ locale, mode: tableMode, night: 1, hourSeconds });
		if (hostPhase === 'cheese-check')
			void prepareNightTrack({ locale, mode: tableMode, night: 2, hourSeconds });
	}, [hostPhase, tableMode, hourSeconds, locale]);

	useEffect(() => {
		const stored = getStoredPlayerToken(code);
		setPlayerToken(adminTest ? TEST_VIEWER_TOKEN : stored);
		setJoinName((prev) => prev || initialName || getRecentPlayerName() || '');
		setHydrated(true);
	}, [adminTest, code, initialName]);

	const run = useCallback(
		async (fn: () => Promise<unknown>) => {
			setBusy(true);
			setActionError(null);
			try {
				await fn();
			} catch (caught) {
				setActionError(caught instanceof Error ? caught.message : t('common.unknownError'));
			} finally {
				setBusy(false);
			}
		},
		[t],
	);

	async function join(event: React.FormEvent) {
		event.preventDefault();
		const name = normalizePlayerName(joinName);
		if (!isValidPlayerName(name)) {
			setActionError(t('cheese.join.missing'));
			return;
		}
		await run(async () => {
			const data = await api.join(name, playerToken ?? undefined);
			storePlayerToken(code, data.playerToken);
			storeRecentPlayerName(name);
			setPlayerToken(data.playerToken);
		});
	}

	if (!hydrated || (loading && !state)) {
		return (
			<div className="game-theme game-theme-cheese flex min-h-svh items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!state?.self) {
		return (
			<div className="game-theme game-theme-cheese flex min-h-svh items-center px-5 py-8">
				<div className="mx-auto w-full max-w-sm">
					<CheeseThiefArt scene="mouse" size={76} className="mb-5" />
					<p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted uppercase">{code}</p>
					<h1 className="mt-2 font-display text-4xl font-medium">{t('cheese.join.title')}</h1>
					<p className="mt-2 text-sm leading-relaxed text-muted">{t('cheese.join.hint')}</p>
					<form
						className="mt-6 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm"
						onSubmit={join}
					>
						<Field label={t('cheese.menu.yourName')} htmlFor="cheese-seat">
							<PlayerNameInput
								id="cheese-seat"
								value={joinName}
								onChange={(event) => setJoinName(event.target.value)}
								maxLength={24}
							/>
						</Field>
						{(actionError || error) && (
							<p className="text-sm text-danger">{actionError || error}</p>
						)}
						<Button fullWidth type="submit" loading={busy}>
							{t('cheese.menu.enter')}
						</Button>
					</form>
					<Button className="mt-3" variant="ghost" onClick={() => router.push(routes.cheeseThief)}>
						{t('cheese.join.back')}
					</Button>
				</div>
			</div>
		);
	}

	const phase = state.phase;

	return (
		<div className="game-theme game-theme-cheese min-h-svh">
			{phase !== 'night' &&
				phase !== 'cheese-check' &&
				phase !== 'secret' &&
				phase !== 'secret-result' && (
					<header className="mx-auto flex max-w-md items-center justify-between gap-2 px-5 pt-3">
						<Link
							href={routes.cheeseThief}
							className="inline-flex min-h-11 items-center font-mono text-[0.68rem] tracking-[0.08em] text-muted uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							{state.code}
						</Link>
						<CheeseRulesButton
							playerCount={state.maxPlayers}
							mode={state.mode}
							scapegoatEnabled={state.scapegoatEnabled}
							followers={{ count: state.followers.count, knowledge: state.followers.knowledge }}
							className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						/>
						<button
							type="button"
							className="inline-flex min-h-11 items-center text-sm text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							onClick={() => {
								if (phase !== 'lobby' && !window.confirm(t('cheese.join.leaveConfirm'))) return;
								void api.leave().finally(() => {
									if (adminTest) return;
									clearPlayerToken(code);
									router.push(routes.cheeseThief);
								});
							}}
						>
							{t('cheese.join.back')}
						</button>
						<SiteAuthChip variant="badge" showSignIn={false} />
					</header>
				)}
			<main className="mx-auto max-w-md px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
				{actionError && phase !== 'night' && (
					<p className="mb-4 text-sm text-danger">{actionError}</p>
				)}
				{phase === 'lobby' && state.isHost && !adminTest ? (
					<div className="mb-4">
						<LiveBotControls
							game="cheese-thief"
							code={state.code}
							hostToken={playerToken}
							full={state.players.length >= state.maxPlayers}
							onChanged={refresh}
						/>
					</div>
				) : null}
				{phase === 'lobby' && (
					<LobbyPhase
						state={state}
						busy={busy}
						onStart={() => void run(api.start)}
						onSettings={(input) => void run(() => api.settings(input))}
						onHourSeconds={(hourSeconds) => void run(() => api.settings({ hourSeconds }))}
						onKick={(id) => void run(() => api.kick(id))}
					/>
				)}
				{phase === 'deal' && (
					<DealPhase
						state={state}
						busy={busy}
						onRemember={(hour) => void run(() => api.memorized(hour))}
						onBeginNight={() => {
							if (
								!startNightTrack({
									locale,
									mode: state.mode,
									night: 1,
									hourSeconds: state.hourSeconds,
								})
							)
								unlockTableAudio();
							void run(api.beginNight);
						}}
					/>
				)}
				{phase === 'night' && <NightPhase state={state} fetchedAt={fetchedAt} />}
				{phase === 'cheese-check' && (
					<CheeseCheckPhase
						isHost={state.isHost}
						hourSeconds={state.hourSeconds}
						busy={busy}
						onConfirm={(present) => void run(() => api.cheese(present))}
					/>
				)}
				{phase === 'secret' && (
					<SecretPhase
						state={state}
						busy={busy}
						onSubmit={(picks) => void run(() => api.secret(picks))}
						onDraft={api.secretDraft}
					/>
				)}
				{phase === 'secret-result' && (
					<SecretResultPhase
						card={state.self.secretCard}
						seen={state.self.hasSeenSecret}
						busy={busy}
						onSeen={() => void run(api.seen)}
					/>
				)}
				{phase === 'day' && (
					<DayPhase
						state={state}
						fetchedAt={fetchedAt}
						busy={busy}
						onVote={() => void run(api.startVote)}
					/>
				)}
				{phase === 'vote' && (
					<VotePhase
						key={`vote-${state.voteRound ?? 1}`}
						state={state}
						busy={busy}
						onVote={(id) => void run(() => api.vote(id))}
					/>
				)}
				{phase === 'tie' && (
					<TiePhase state={state} busy={busy} onRevote={() => void run(api.revote)} />
				)}
				{phase === 'reveal' && (
					<RevealPhase state={state} busy={busy} onAgain={() => void run(api.playAgain)} />
				)}
			</main>
		</div>
	);
}
