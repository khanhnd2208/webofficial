'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';

import {
	CLASSIC_MAX_PLAYERS,
	TWO_NIGHT_MIN_PLAYERS,
	isPlayerCountAllowed,
	type CheeseMode,
} from '@/features/cheese-thief/config/cheeseThief';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { routes } from '@/config/routes';
import { BASE_PATH } from '@/features/spy-fall/lib/basePath';
import HourLengthSetting from '@/features/cheese-thief/components/HourLengthSetting';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import {
	CheeseRulesButton,
	TableRulesCard,
} from '@/features/cheese-thief/components/CheeseRulesGuide';
import { cn } from '@/features/spy-fall/lib/cn';
import PassportAvatar from '@/features/spy-fall/components/spy/PassportAvatar';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onStart: () => void;
	onScapegoat: (enabled: boolean) => void;
	onMode: (mode: CheeseMode) => void;
	onHourSeconds: (seconds: number) => void;
	onKick: (id: string) => void;
}

export default function LobbyPhase({
	state,
	busy,
	onStart,
	onScapegoat,
	onMode,
	onHourSeconds,
	onKick,
}: Props) {
	const t = useT();
	const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);
	const twoNight = state.mode === 'two-night';
	const twoNightBlocked = twoNight && state.playerCount < TWO_NIGHT_MIN_PLAYERS;
	const classicFull = !twoNight && state.playerCount > CLASSIC_MAX_PLAYERS;
	const ready = isPlayerCountAllowed(state.playerCount, state.mode);
	const modeLabel = twoNight ? t('cheese.lobby.mode.twoNight') : t('cheese.lobby.mode.classic');
	const url =
		typeof window !== 'undefined'
			? `${window.location.origin}${BASE_PATH}${routes.cheeseThiefRoom(state.code)}`
			: routes.cheeseThiefRoom(state.code);
	async function copyInvite() {
		try {
			await navigator.clipboard.writeText(url);
			setCopyStatus('copied');
		} catch {
			setCopyStatus('failed');
		}
	}

	return (
		<div className="space-y-5 pb-28">
			<div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="game-theme-kicker font-mono text-[0.68rem] tracking-[0.18em] uppercase">
							{t('cheese.lobby.title')}
						</p>
						<h1 className="mt-1 break-words font-display text-3xl font-medium leading-tight">
							{state.name}
						</h1>
						<p className="mt-3 font-mono text-xl font-semibold tracking-[0.18em] text-foreground">
							{state.code}
						</p>
					</div>
					<div className="shrink-0 rounded-2xl bg-white p-2" aria-label={t('cheese.lobby.invite')}>
						<QRCode value={url} size={88} />
					</div>
				</div>
				<div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
					<p className="text-xs text-muted">{t('cheese.lobby.invite')}</p>
					<button
						type="button"
						onClick={() => void copyInvite()}
						className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						{copyStatus === 'copied' ? t('cheese.lobby.copied') : t('cheese.lobby.copyLink')}
					</button>
				</div>
				{copyStatus === 'failed' && (
					<p className="mt-2 text-xs text-danger" role="status">
						{t('cheese.lobby.copyFailed')}
					</p>
				)}
			</div>

			<ul className="space-y-2">
				{state.players.map((player) => (
					<li
						key={player.id}
						className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2"
					>
						<PassportAvatar name={player.name} avatarSeed={player.avatarSeed} size="sm" />
						<span className="min-w-0 flex-1 truncate font-medium">
							{player.name}
							{player.id === state.self?.id ? ` · ${t('cheese.lobby.you')}` : ''}
						</span>
						{player.isHost && (
							<span className="font-mono text-[0.65rem] tracking-[0.14em] text-muted uppercase">
								{t('cheese.lobby.host')}
							</span>
						)}
						{state.isHost && player.id !== state.self?.id && (
							<button
								type="button"
								className="text-sm text-muted underline-offset-2 hover:underline"
								onClick={() => onKick(player.id)}
							>
								{t('cheese.lobby.kick', { name: player.name })}
							</button>
						)}
					</li>
				))}
			</ul>

			<p className="rounded-2xl bg-accent-subtle px-4 py-3 text-sm leading-relaxed text-foreground">
				{t('cheese.lobby.need', { count: state.playerCount })}
			</p>

			{state.isHost ? (
				<div
					className="grid grid-cols-2 gap-2"
					role="radiogroup"
					aria-label={t('cheese.lobby.mode.label')}
				>
					{(['classic', 'two-night'] as const).map((mode) => (
						<button
							key={mode}
							type="button"
							role="radio"
							aria-checked={state.mode === mode}
							disabled={busy}
							className={cn(
								'min-h-16 rounded-2xl border px-3 py-2 text-sm font-medium',
								state.mode === mode
									? 'border-foreground bg-foreground text-background'
									: 'border-border bg-surface',
							)}
							onClick={() => onMode(mode)}
						>
							<span className="flex flex-col items-center gap-1">
								<CheeseThiefArt scene={mode === 'classic' ? 'moon' : 'two-moons'} size={32} />
								<span>
									{mode === 'classic'
										? t('cheese.lobby.mode.classic')
										: t('cheese.lobby.mode.twoNight')}
								</span>
							</span>
						</button>
					))}
				</div>
			) : (
				<p className="text-sm text-muted">
					{t('cheese.lobby.mode.label')}: {modeLabel}
				</p>
			)}

			<HourLengthSetting
				hourSeconds={state.hourSeconds}
				isHost={state.isHost}
				busy={busy}
				onChange={onHourSeconds}
			/>

			{state.isHost && (
				<label className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
					<input
						type="checkbox"
						className="mt-1 h-5 w-5"
						checked={state.scapegoatEnabled}
						onChange={(event) => onScapegoat(event.target.checked)}
					/>
					<span>
						<span className="block text-sm font-medium">{t('cheese.menu.scapegoat')}</span>
						<span className="mt-1 block text-sm text-muted">{t('cheese.menu.scapegoatHint')}</span>
					</span>
				</label>
			)}

			<details className="rounded-2xl border border-border bg-surface px-4 py-3">
				<summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground">
					{t('cheese.lobby.rulesHint')}
				</summary>
				<div className="space-y-4 border-t border-border pt-4 text-sm leading-relaxed text-foreground/80">
					<TableRulesCard
						playerCount={state.playerCount}
						mode={state.mode}
						scapegoatEnabled={state.scapegoatEnabled}
					/>
					<h2 className="font-mono text-[0.68rem] tracking-[0.16em] text-muted uppercase">
						{t('cheese.lobby.rulesTitle')}
					</h2>
					<p>{t('cheese.lobby.rule1')}</p>
					{twoNight ? (
						<>
							<p>{t('cheese.lobby.twoNight.rule1')}</p>
							<p>{t('cheese.lobby.twoNight.rule2')}</p>
							<p>{t('cheese.lobby.twoNight.rule3')}</p>
							<p>{t('cheese.lobby.twoNight.rule4')}</p>
						</>
					) : (
						<>
							<p>{t('cheese.lobby.rule2')}</p>
							<p>{t('cheese.lobby.rule3')}</p>
							<p>{t('cheese.lobby.rule4')}</p>
						</>
					)}
					<p>{t('cheese.lobby.rule5')}</p>
					<CheeseRulesButton
						playerCount={state.playerCount}
						mode={state.mode}
						scapegoatEnabled={state.scapegoatEnabled}
						className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4"
					/>
				</div>
			</details>

			{!state.isHost && (
				<p className="text-center text-sm text-muted">{t('cheese.lobby.waitingHost')}</p>
			)}

			{state.isHost && (
				<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgb(0_0_0_/_0.08)] backdrop-blur">
					<div className="mx-auto max-w-md">
						{twoNightBlocked && (
							<p className="mb-2 text-center text-xs text-muted">
								{t('cheese.lobby.twoNight.need')}
							</p>
						)}
						{classicFull && (
							<p className="mb-2 text-center text-xs text-muted">{t('cheese.lobby.classicFull')}</p>
						)}
						<Button fullWidth disabled={!ready || busy} loading={busy} onClick={onStart}>
							{t('cheese.lobby.start')}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
