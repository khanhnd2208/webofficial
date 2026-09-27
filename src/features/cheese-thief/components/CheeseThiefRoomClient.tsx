'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import { useCheeseThiefRoom } from '@/features/cheese-thief/components/hooks/useCheeseThiefRoom';
import DayPhase from '@/features/cheese-thief/components/phases/DayPhase';
import DealPhase from '@/features/cheese-thief/components/phases/DealPhase';
import LobbyPhase from '@/features/cheese-thief/components/phases/LobbyPhase';
import NightPhase from '@/features/cheese-thief/components/phases/NightPhase';
import RevealPhase from '@/features/cheese-thief/components/phases/RevealPhase';
import SecretPhase from '@/features/cheese-thief/components/phases/SecretPhase';
import SecretResultPhase from '@/features/cheese-thief/components/phases/SecretResultPhase';
import VotePhase from '@/features/cheese-thief/components/phases/VotePhase';
import { clearPlayerToken, getStoredPlayerToken, storePlayerToken } from '@/features/cheese-thief/lib/clientToken';
import CheeseCheckPhase from '@/features/cheese-thief/components/phases/CheeseCheckPhase';
import TiePhase from '@/features/cheese-thief/components/phases/TiePhase';
import { unlockTableAudio } from '@/features/cheese-thief/lib/narration';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/spy-fall/components/spy/PlayerNameInput';
import { Button, Field, Spinner } from '@/features/spy-fall/components/ui';
import { getRecentPlayerName, storeRecentPlayerName } from '@/features/spy-fall/lib/spy/clientToken';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';

interface Props {
	code: string;
	initialName?: string;
}

export default function CheeseThiefRoomClient({ code, initialName }: Props) {
	const t = useT();
	const router = useRouter();
	const [hydrated, setHydrated] = useState(false);
	const [playerToken, setPlayerToken] = useState<string | null>(null);
	const [joinName, setJoinName] = useState(initialName ?? '');
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const { state, error, loading, fetchedAt, api } = useCheeseThiefRoom({
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

	const run = useCallback(async (fn: () => Promise<unknown>) => {
		setBusy(true);
		setActionError(null);
		try {
			await fn();
		} catch (caught) {
			setActionError(caught instanceof Error ? caught.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}, [t]);

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
			<div className="game-theme game-theme-cheese mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-5">
				<p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted uppercase">{code}</p>
				<h1 className="font-display text-4xl font-medium">{t('cheese.join.title')}</h1>
				<form className="space-y-4" onSubmit={join}>
					<Field label={t('cheese.menu.yourName')} htmlFor="cheese-seat">
						<PlayerNameInput
							id="cheese-seat"
							value={joinName}
							onChange={(event) => setJoinName(event.target.value)}
							maxLength={24}
						/>
					</Field>
					{(actionError || error) && <p className="text-sm text-danger">{actionError || error}</p>}
					<Button fullWidth type="submit" loading={busy}>
						{t('cheese.menu.enter')}
					</Button>
				</form>
				<Button variant="ghost" onClick={() => router.push(routes.cheeseThief)}>
					{t('cheese.join.back')}
				</Button>
			</div>
		);
	}

	const phase = state.phase;

	return (
		<div className="game-theme game-theme-cheese min-h-svh">
			{phase !== 'night' && phase !== 'cheese-check' && phase !== 'secret' && phase !== 'secret-result' && (
				<header className="mx-auto flex max-w-md items-center justify-between px-5 pt-5">
					<Link href={routes.cheeseThief} className="font-mono text-[0.68rem] tracking-[0.16em] text-muted uppercase">
						{state.code}
					</Link>
					<button
						type="button"
						className="text-sm text-muted"
						onClick={() => {
							void api.leave().finally(() => {
								clearPlayerToken(code);
								router.push(routes.cheeseThief);
							});
						}}
					>
						{t('cheese.join.back')}
					</button>
				</header>
			)}
			<main className="mx-auto max-w-md px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
				{actionError && phase !== 'night' && <p className="mb-4 text-sm text-danger">{actionError}</p>}
				{phase === 'lobby' && (
					<LobbyPhase
						state={state}
						busy={busy}
						onStart={() => void run(api.start)}
						onScapegoat={(enabled) => void run(() => api.settings({ scapegoat: enabled }))}
						onMode={(mode) => void run(() => api.settings({ mode }))}
						onKick={(id) => void run(() => api.kick(id))}
					/>
				)}
				{phase === 'deal' && (
					<DealPhase
						state={state}
						busy={busy}
						onRemember={(hour) => void run(() => api.memorized(hour))}
						onBeginNight={() => {
							unlockTableAudio();
							void run(api.beginNight);
						}}
					/>
				)}
				{phase === 'night' && <NightPhase state={state} fetchedAt={fetchedAt} />}
				{phase === 'cheese-check' && (
					<CheeseCheckPhase isHost={state.isHost} busy={busy} onConfirm={(present) => void run(() => api.cheese(present))} />
				)}
				{phase === 'secret' && <SecretPhase state={state} busy={busy} onSubmit={(picks) => void run(() => api.secret(picks))} />}
				{phase === 'secret-result' && (
					<SecretResultPhase
						card={state.self.secretCard}
						seen={state.self.hasSeenSecret}
						busy={busy}
						onSeen={() => void run(api.seen)}
					/>
				)}
				{phase === 'day' && <DayPhase state={state} fetchedAt={fetchedAt} busy={busy} onVote={() => void run(api.startVote)} />}
				{phase === 'vote' && (
					<VotePhase key={`vote-${state.voteRound ?? 1}`} state={state} busy={busy} onVote={(id) => void run(() => api.vote(id))} />
				)}
				{phase === 'tie' && <TiePhase state={state} busy={busy} onRevote={() => void run(api.revote)} />}
				{phase === 'reveal' && <RevealPhase state={state} busy={busy} onAgain={() => void run(api.playAgain)} />}
			</main>
		</div>
	);
}
