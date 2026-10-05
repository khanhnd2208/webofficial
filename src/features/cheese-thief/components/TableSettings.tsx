'use client';

import {
	CHEESE_HOUR_LEVELS,
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	SCAPEGOAT_MIN_PLAYERS,
} from '@/features/cheese-thief/config/cheeseThief';
import HourLengthSetting from '@/features/cheese-thief/components/HourLengthSetting';
import type { FollowerKnows } from '@/features/cheese-thief/config/cheeseThief';
import type { RoomStateDTO, UpdateSettingsInput } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onSettings: (input: UpdateSettingsInput) => void;
	onHourSeconds: (seconds: number) => void;
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
			<span aria-live="polite" className="font-display text-3xl font-medium tabular-nums">
				{value}
			</span>
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

function knowsKey(count: number, knowledge: FollowerKnows): string {
	if (count <= 1) return knowledge === 'all' ? 'knowAllOne' : 'knowTeamOne';
	return knowledge === 'all' ? 'knowAll' : 'knowTeam';
}

function hourPhrase(t: ReturnType<typeof useT>, seconds: number): string {
	const level = CHEESE_HOUR_LEVELS.find((item) => item.seconds === seconds);
	const preset = t('cheese.lobby.hour.preset', { seconds });
	if (!level) return preset;
	return `${t(`cheese.lobby.hour.${level.id}`)} ${preset}`;
}

function followerPhrase(t: ReturnType<typeof useT>, count: number): string {
	if (count <= 0) return t('cheese.lobby.settings.followerNone');
	const key = count === 1 ? 'followerShortOne' : 'followerShort';
	return t(`cheese.lobby.settings.${key}`, { count });
}

/** Host edits the table. Everyone else sees one line. */
export default function TableSettings({ state, busy, onSettings, onHourSeconds }: Props) {
	const t = useT();
	const host = state.isHost;
	const size = state.maxPlayers;
	const followers = state.followers;
	const sizeMin = Math.max(CHEESE_MIN_PLAYERS, state.playerCount);
	const scapegoatLocked = size < SCAPEGOAT_MIN_PLAYERS;
	const canTuneFollowers = followers.max > 0;

	function setSize(next: number) {
		const clamped = Math.min(CHEESE_MAX_PLAYERS, Math.max(sizeMin, next));
		onSettings({
			maxPlayers: clamped,
			...(clamped < SCAPEGOAT_MIN_PLAYERS && state.scapegoatEnabled ? { scapegoat: false } : {}),
		});
	}

	const followerLine =
		followers.count > 0
			? t('cheese.lobby.settings.followerSummary', {
					count: followers.count,
					knows: t(`cheese.lobby.settings.${knowsKey(followers.count, followers.knowledge)}`),
				})
			: t('cheese.lobby.settings.followerNone');

	if (!host) {
		const scapegoat = t(
			state.scapegoatEnabled && !scapegoatLocked
				? 'cheese.lobby.settings.scapegoatOn'
				: 'cheese.lobby.settings.scapegoatOff',
		);
		return (
			<p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed">
				{t('cheese.lobby.settings.guestSummary', {
					size,
					scapegoat,
					hour: hourPhrase(t, state.hourSeconds),
					followers: followerPhrase(t, followers.count),
				})}
			</p>
		);
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
					</div>
				)}
			</div>

			<button
				type="button"
				role="switch"
				aria-checked={state.scapegoatEnabled && !scapegoatLocked}
				disabled={busy || scapegoatLocked}
				className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:opacity-80"
				onClick={() => onSettings({ scapegoat: !state.scapegoatEnabled })}
			>
				<span>
					<span className="block text-sm font-medium">{t('cheese.menu.scapegoat')}</span>
					<span className="mt-1 block text-sm text-muted">
						{scapegoatLocked
							? t('cheese.lobby.settings.scapegoatNeeds')
							: t('cheese.menu.scapegoatHint')}
					</span>
				</span>
				<span
					aria-hidden
					className={cn(
						'relative h-7 w-12 shrink-0 rounded-full',
						state.scapegoatEnabled && !scapegoatLocked ? 'bg-foreground' : 'bg-border',
					)}
				>
					<span
						className={cn(
							'absolute top-0.5 h-6 w-6 rounded-full bg-background',
							state.scapegoatEnabled && !scapegoatLocked ? 'left-5' : 'left-0.5',
						)}
					/>
				</span>
			</button>

			<HourLengthSetting
				hourSeconds={state.hourSeconds}
				isHost={host}
				busy={busy}
				onChange={onHourSeconds}
			/>

			<div className="px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<p className="text-sm leading-relaxed">{followerLine}</p>
					{canTuneFollowers && (
						<span className="shrink-0 rounded-full border border-border px-2 py-1 font-mono text-[0.62rem] tracking-[0.08em] text-muted uppercase">
							{followers.customized
								? t('cheese.lobby.settings.badgeCustom')
								: t('cheese.lobby.settings.badgeDefault')}
						</span>
					)}
				</div>
				{host && canTuneFollowers && (
					<details className="mt-3">
						<summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
							{t('cheese.lobby.settings.advanced')}
						</summary>
						<div className="space-y-4 border-t border-border pt-3">
							<div>
								<p className="text-sm text-muted">
									{t('cheese.lobby.settings.max', { max: followers.max })}
								</p>
								<div className="mt-3">
									<Stepper
										value={followers.count}
										min={0}
										max={followers.max}
										busy={busy}
										lessLabel={t('cheese.lobby.settings.lessFollowers')}
										moreLabel={t('cheese.lobby.settings.moreFollowers')}
										onChange={(count) =>
											onSettings({
												followerCount: count === followers.defaultCount ? null : count,
											})
										}
									/>
								</div>
							</div>
							{followers.count > 0 && (
								<div
									className="space-y-2"
									role="radiogroup"
									aria-label={t('cheese.lobby.settings.knowledge')}
								>
									<p className="text-sm font-medium">{t('cheese.lobby.settings.knowledge')}</p>
									{(['team', 'all'] as const).map((knowledge) => {
										const selected = followers.knowledge === knowledge;
										const label = t(
											`cheese.lobby.settings.${knowsKey(followers.count, knowledge)}`,
										);
										return (
											<button
												key={knowledge}
												type="button"
												role="radio"
												aria-checked={selected}
												disabled={busy}
												className={cn(
													'min-h-11 w-full rounded-2xl border px-3 py-2 text-left text-sm leading-snug',
													selected
														? 'border-foreground bg-foreground text-background'
														: 'border-border',
												)}
												onClick={() =>
													onSettings({
														followerKnowledge:
															knowledge === followers.defaultKnowledge ? null : knowledge,
													})
												}
											>
												{label}
											</button>
										);
									})}
									<p className="text-sm text-muted">{t('cheese.lobby.settings.thiefKnows')}</p>
								</div>
							)}
							{followers.customized && (
								<button
									type="button"
									disabled={busy}
									className="text-sm font-medium underline underline-offset-4 disabled:opacity-40"
									onClick={() => onSettings({ followerCount: null, followerKnowledge: null })}
								>
									{t('cheese.lobby.settings.reset')}
								</button>
							)}
						</div>
					</details>
				)}
			</div>
		</div>
	);
}
