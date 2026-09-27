'use client';

import {
	CHEESE_MAX_PLAYERS,
	SCAPEGOAT_MIN_PLAYERS,
	TWO_NIGHT_MIN_PLAYERS,
	playerRangeFor,
	type CheeseMode,
} from '@/features/cheese-thief/config/cheeseThief';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import type { RoomStateDTO, UpdateSettingsInput } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onSettings: (input: UpdateSettingsInput) => void;
}

function Stepper({
	value,
	min,
	max,
	busy,
	lessLabel,
	moreLabel,
	onChange,
}: {
	value: number;
	min: number;
	max: number;
	busy: boolean;
	lessLabel: string;
	moreLabel: string;
	onChange: (next: number) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-2">
			<button
				type="button"
				aria-label={lessLabel}
				disabled={busy || value <= min}
				className="h-11 w-11 shrink-0 rounded-full border border-border text-xl disabled:opacity-40"
				onClick={() => onChange(value - 1)}
			>
				−
			</button>
			<span className="font-display text-3xl font-medium tabular-nums">{value}</span>
			<button
				type="button"
				aria-label={moreLabel}
				disabled={busy || value >= max}
				className="h-11 w-11 shrink-0 rounded-full border border-border text-xl disabled:opacity-40"
				onClick={() => onChange(value + 1)}
			>
				+
			</button>
		</div>
	);
}

/** Host edits the table. Everyone else sees the same numbers, without the controls. */
export default function TableSettings({ state, busy, onSettings }: Props) {
	const t = useT();
	const host = state.isHost;
	const size = state.maxPlayers;
	const followers = state.followers;
	const range = playerRangeFor(state.mode);
	const sizeMin = Math.max(range.min, state.playerCount);
	const twoNightLocked = size < TWO_NIGHT_MIN_PLAYERS;
	const scapegoatLocked = size < SCAPEGOAT_MIN_PLAYERS;
	const oneFollower = followers.count === 1;

	function setSize(next: number) {
		const clamped = Math.min(CHEESE_MAX_PLAYERS, Math.max(sizeMin, next));
		onSettings({
			maxPlayers: clamped,
			...(clamped < SCAPEGOAT_MIN_PLAYERS && state.scapegoatEnabled ? { scapegoat: false } : {}),
		});
	}

	function setMode(mode: CheeseMode) {
		if (mode === 'two-night' && twoNightLocked) return;
		onSettings({ mode });
	}

	return (
		<div className="divide-y divide-border rounded-2xl border border-border bg-surface">
			<div className="px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-medium">{t('cheese.lobby.settings.size')}</p>
						<p className="mt-0.5 text-sm text-muted">
							{t('cheese.lobby.settings.seated', { count: state.playerCount, size })}
						</p>
					</div>
					{!host && <span className="font-display text-3xl font-medium tabular-nums">{size}</span>}
				</div>
				{host && (
					<div className="mt-3">
						<Stepper
							value={size}
							min={sizeMin}
							max={CHEESE_MAX_PLAYERS}
							busy={busy}
							lessLabel={t('cheese.lobby.settings.lessPlayers')}
							moreLabel={t('cheese.lobby.settings.morePlayers')}
							onChange={setSize}
						/>
						{state.mode === 'two-night' && size <= TWO_NIGHT_MIN_PLAYERS && (
							<p className="mt-2 text-sm text-muted">{t('cheese.lobby.settings.twoNightMin')}</p>
						)}
					</div>
				)}
			</div>

			<div className="px-4 py-3">
				<p className="text-sm font-medium">{t('cheese.lobby.mode.label')}</p>
				{host ? (
					<div
						className="mt-3 grid grid-cols-2 gap-2"
						role="radiogroup"
						aria-label={t('cheese.lobby.mode.label')}
					>
						{(['classic', 'two-night'] as const).map((mode) => {
							const locked = mode === 'two-night' && twoNightLocked;
							const selected = state.mode === mode;
							return (
								<button
									key={mode}
									type="button"
									role="radio"
									aria-checked={selected}
									disabled={busy || locked}
									className={cn(
										'min-h-16 rounded-2xl border px-3 py-2 text-sm font-medium disabled:opacity-40',
										selected
											? 'border-foreground bg-foreground text-background'
											: 'border-border bg-surface',
									)}
									onClick={() => setMode(mode)}
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
							);
						})}
					</div>
				) : (
					<p className="mt-1 text-sm text-muted">
						{state.mode === 'two-night'
							? t('cheese.lobby.mode.twoNight')
							: t('cheese.lobby.mode.classic')}
					</p>
				)}
				{twoNightLocked && <p className="mt-2 text-sm text-muted">{t('cheese.lobby.twoNight.need')}</p>}
			</div>

			<div className="px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-medium">{t('cheese.lobby.settings.followers')}</p>
						<p className="mt-0.5 text-sm text-muted">
							{t('cheese.lobby.settings.max', { max: followers.max })}
						</p>
					</div>
					{!host && (
						<span className="font-display text-3xl font-medium tabular-nums">{followers.count}</span>
					)}
				</div>
				{host && (
					<div className="mt-3">
						<Stepper
							value={followers.count}
							min={0}
							max={followers.max}
							busy={busy}
							lessLabel={t('cheese.lobby.settings.lessFollowers')}
							moreLabel={t('cheese.lobby.settings.moreFollowers')}
							// Landing back on the default clears the override, so a later size change follows the new default.
							onChange={(count) =>
								onSettings({ followerCount: count === followers.defaultCount ? null : count })
							}
						/>
					</div>
				)}
				<div className="mt-2">
					{followers.customized && host ? (
						<button
							type="button"
							disabled={busy}
							className="text-sm font-medium underline underline-offset-4 disabled:opacity-40"
							onClick={() => onSettings({ followerCount: null, followerKnowledge: null })}
						>
							{t('cheese.lobby.settings.reset', { count: followers.defaultCount })}
						</button>
					) : (
						<p className="text-sm text-muted">
							{followers.customized
								? t('cheese.lobby.settings.customNote', { count: followers.defaultCount })
								: t('cheese.lobby.settings.default')}
						</p>
					)}
				</div>
			</div>

			{followers.count > 0 && (
				<div className="px-4 py-3">
					<p className="text-sm font-medium">{t('cheese.lobby.settings.knowledge')}</p>
					<div
						className="mt-3 space-y-2"
						role="radiogroup"
						aria-label={t('cheese.lobby.settings.knowledge')}
					>
						{(['team', 'all'] as const).map((knowledge) => {
							const selected = followers.knowledge === knowledge;
							const label = t(
								oneFollower
									? knowledge === 'team'
										? 'cheese.lobby.settings.knowTeamOne'
										: 'cheese.lobby.settings.knowAllOne'
									: knowledge === 'team'
										? 'cheese.lobby.settings.knowTeam'
										: 'cheese.lobby.settings.knowAll',
							);
							if (!host) {
								return selected ? (
									<p key={knowledge} className="text-sm leading-relaxed">
										{label}
									</p>
								) : null;
							}
							return (
								<button
									key={knowledge}
									type="button"
									role="radio"
									aria-checked={selected}
									disabled={busy}
									className={cn(
										'min-h-11 w-full rounded-2xl border px-3 py-2 text-left text-sm leading-snug',
										selected ? 'border-foreground bg-foreground text-background' : 'border-border',
									)}
									onClick={() =>
										onSettings({
											followerKnowledge: knowledge === followers.defaultKnowledge ? null : knowledge,
										})
									}
								>
									{label}
								</button>
							);
						})}
					</div>
					<p className="mt-2 text-sm text-muted">{t('cheese.lobby.settings.thiefKnows')}</p>
				</div>
			)}

			<label className={cn('flex items-start gap-3 px-4 py-3', (scapegoatLocked || !host) && 'opacity-80')}>
				<input
					type="checkbox"
					className="mt-1 h-5 w-5"
					checked={state.scapegoatEnabled && !scapegoatLocked}
					disabled={!host || busy || scapegoatLocked}
					onChange={(event) => onSettings({ scapegoat: event.target.checked })}
				/>
				<span>
					<span className="block text-sm font-medium">{t('cheese.menu.scapegoat')}</span>
					<span className="mt-1 block text-sm text-muted">{t('cheese.menu.scapegoatHint')}</span>
				</span>
			</label>
		</div>
	);
}
