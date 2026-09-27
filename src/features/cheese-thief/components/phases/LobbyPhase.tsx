'use client';

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
import { CheeseRulesButton, TableRulesCard } from '@/features/cheese-thief/components/CheeseRulesGuide';
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

export default function LobbyPhase({ state, busy, onStart, onScapegoat, onMode, onHourSeconds, onKick }: Props) {
	const t = useT();
	const twoNight = state.mode === 'two-night';
	const twoNightBlocked = twoNight && state.playerCount < TWO_NIGHT_MIN_PLAYERS;
	const classicFull = !twoNight && state.playerCount > CLASSIC_MAX_PLAYERS;
	const ready = isPlayerCountAllowed(state.playerCount, state.mode);
	const modeLabel = twoNight ? t('cheese.lobby.mode.twoNight') : t('cheese.lobby.mode.classic');
	const url =
		typeof window !== 'undefined'
			? `${window.location.origin}${BASE_PATH}${routes.cheeseThiefRoom(state.code)}`
			: routes.cheeseThiefRoom(state.code);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted uppercase">{state.code}</p>
					<h1 className="mt-1 font-display text-4xl font-medium">{state.name}</h1>
				</div>
				<div className="rounded-2xl bg-white p-2">
					<QRCode value={url} size={88} />
				</div>
			</div>

			<ul className="space-y-2">
				{state.players.map((player) => (
					<li key={player.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
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

			<p className="text-sm text-muted">{t('cheese.lobby.need', { count: state.playerCount })}</p>

			{state.isHost ? (
				<div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('cheese.lobby.mode.label')}>
					{( ['classic', 'two-night'] as const).map((mode) => (
						<button
							key={mode}
							type="button"
							role="radio"
							aria-checked={state.mode === mode}
							disabled={busy}
							className={cn(
								'min-h-16 rounded-2xl border px-3 py-2 text-sm font-medium',
								state.mode === mode ? 'border-foreground bg-foreground text-background' : 'border-border bg-surface',
							)}
							onClick={() => onMode(mode)}
						>
							<span className="flex flex-col items-center gap-1">
								<CheeseThiefArt scene={mode === 'classic' ? 'moon' : 'two-moons'} size={32} />
								<span>{mode === 'classic' ? t('cheese.lobby.mode.classic') : t('cheese.lobby.mode.twoNight')}</span>
							</span>
						</button>
					))}
				</div>
			) : (
				<p className="text-sm text-muted">
					{t('cheese.lobby.mode.label')}: {modeLabel}
				</p>
			)}

			<HourLengthSetting hourSeconds={state.hourSeconds} isHost={state.isHost} busy={busy} onChange={onHourSeconds} />

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

			<TableRulesCard playerCount={state.playerCount} mode={state.mode} scapegoatEnabled={state.scapegoatEnabled} />

			<section className="space-y-2 text-sm leading-relaxed text-foreground/80">
				<div className="flex items-baseline justify-between gap-3">
					<h2 className="font-mono text-[0.68rem] tracking-[0.16em] text-muted uppercase">{t('cheese.lobby.rulesTitle')}</h2>
					<CheeseRulesButton
						playerCount={state.playerCount}
						mode={state.mode}
						scapegoatEnabled={state.scapegoatEnabled}
						className="text-sm font-medium underline underline-offset-4"
					/>
				</div>
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
			</section>

			{state.isHost && (
				<>
					{twoNightBlocked && <p className="text-center text-sm text-muted">{t('cheese.lobby.twoNight.need')}</p>}
					{classicFull && <p className="text-center text-sm text-muted">{t('cheese.lobby.classicFull')}</p>}
					<Button fullWidth disabled={!ready || busy} loading={busy} onClick={onStart}>
						{t('cheese.lobby.start')}
					</Button>
				</>
			)}
		</div>
	);
}
