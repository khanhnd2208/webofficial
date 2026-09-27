'use client';

import ActionBar, { WaitingForHost } from '@/features/cheese-thief/components/ActionBar';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import RoundSteps from '@/features/cheese-thief/components/RoundSteps';
import type { CheeseWinner, NightNumber, RevealRowDTO, RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onAgain: () => void;
}

/** Same sides as `decideOutcome`: the Scapegoat only ever wins alone, even as a Follower. */
function wonGame(row: RevealRowDTO, winner: CheeseWinner): boolean {
	if (row.role === 'scapegoat') return winner === 'scapegoat';
	const thiefSide = row.role === 'thief' || row.follower;
	if (winner === 'thief') return thiefSide;
	if (winner === 'sleepyheads') return !thiefSide;
	return false;
}

function whyKey(row: RevealRowDTO): string {
	if (row.role === 'thief') return 'cheese.reveal.why.thief';
	if (row.role === 'scapegoat') return 'cheese.reveal.why.scapegoat';
	return row.follower ? 'cheese.reveal.why.follower' : 'cheese.reveal.why.sleepyhead';
}

function sideRank(row: RevealRowDTO): number {
	if (row.role === 'thief') return 0;
	if (row.follower) return 1;
	if (row.role === 'scapegoat') return 2;
	return 3;
}

const ROLE_BADGE: Record<RevealRowDTO['role'], string> = {
	thief: 'bg-accent text-accent-foreground',
	scapegoat: 'bg-info-subtle text-info',
	sleepyhead: 'bg-surface-secondary text-foreground-secondary',
};

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
				className,
			)}
		>
			{children}
		</span>
	);
}

export default function RevealPhase({ state, busy, onAgain }: Props) {
	const t = useT();
	const roster = state.roster ?? [];
	const flipped = roster.filter((row) => row.flipped);
	const thief = roster.find((row) => row.role === 'thief');
	const followers = roster.filter((row) => row.follower);
	const scapegoat = roster.find((row) => row.role === 'scapegoat');
	const night2 = roster.some((row) => row.wakeHours2 !== null && row.wakeHours2 !== undefined);
	const theftNight: NightNumber = state.theftNight ?? 1;
	const me = roster.find((row) => row.id === state.self?.id);
	const won = me && state.winner ? wonGame(me, state.winner) : null;
	const ordered = roster
		.map((row, index) => ({ row, index }))
		.sort((a, b) => sideRank(a.row) - sideRank(b.row) || a.index - b.index)
		.map(({ row }) => row);

	const awakeAtTheft = (night: NightNumber, hour: number) =>
		state.theftHour !== undefined && night === theftNight && hour === state.theftHour;
	const theftValue =
		state.theftHour === undefined
			? null
			: state.mode === 'two-night' && state.theftNight
				? t('cheese.reveal.theftValueNight', { night: state.theftNight, hour: state.theftHour })
				: t('cheese.reveal.theftValue', { hour: state.theftHour });

	const who: { label: string; value: string }[] = [
		{ label: t('cheese.deal.role.thief'), value: thief?.name ?? '—' },
		{
			label: t('cheese.reveal.followers'),
			value:
				followers.length > 0
					? followers.map((row) => row.name).join(', ')
					: t('cheese.reveal.noFollowers'),
		},
		...(scapegoat ? [{ label: t('cheese.deal.role.scapegoat'), value: scapegoat.name }] : []),
		...(theftValue ? [{ label: t('cheese.reveal.theftLabel'), value: theftValue }] : []),
	];

	return (
		<div className="space-y-6 pb-40">
			<RoundSteps current="reveal" />

			{state.winner && (
				<section className="flex flex-col items-center gap-2 rounded-3xl border border-[color:var(--game-line)] bg-accent-subtle px-5 py-6 text-center">
					<CheeseThiefArt scene="reveal" size={72} />
					<p className="game-theme-kicker">{t('cheese.reveal.winnerLabel')}</p>
					<h1 className="font-display text-3xl leading-tight font-medium">
						{t(`cheese.reveal.winner.${state.winner}`)}
					</h1>
					{flipped.map((row) => (
						<p key={row.id} className="max-w-sm text-sm leading-relaxed text-foreground-secondary">
							{t(whyKey(row), { name: row.name })}
						</p>
					))}
					{won !== null && (
						<Tag
							className={cn(
								'mt-2 px-4 py-1.5 text-sm',
								won ? 'bg-success text-success-foreground' : 'bg-surface-secondary text-foreground',
							)}
						>
							{won ? t('cheese.reveal.youWin') : t('cheese.reveal.youLose')}
						</Tag>
					)}
				</section>
			)}

			<section className="rounded-3xl border border-border bg-surface px-5 py-2">
				<h2 className="sr-only">{t('cheese.reveal.whoTitle')}</h2>
				<dl className="divide-y divide-border">
					{who.map((item) => (
						<div key={item.label} className="flex items-baseline justify-between gap-4 py-3">
							<dt className="shrink-0 text-sm text-muted">{item.label}</dt>
							<dd className="min-w-0 break-words text-right text-base font-medium">{item.value}</dd>
						</div>
					))}
				</dl>
			</section>

			<section className="space-y-3">
				<div className="space-y-1">
					<h2 className="font-display text-xl font-medium">{t('cheese.reveal.rosterTitle')}</h2>
					{state.theftHour !== undefined && (
						<p className="text-xs text-muted">{t('cheese.reveal.rosterHint')}</p>
					)}
				</div>
				<ul className="space-y-2">
					{ordered.map((row) => {
						const nights: { night: NightNumber; hours: number[] }[] = [
							{ night: 1, hours: row.wakeHours },
							...(night2 ? [{ night: 2 as const, hours: row.wakeHours2 ?? [] }] : []),
						];
						const sawTheft = nights.some(({ night, hours }) =>
							hours.some((hour) => awakeAtTheft(night, hour)),
						);
						return (
							<li
								key={row.id}
								className={cn(
									'rounded-2xl border bg-surface px-4 py-3',
									sawTheft ? 'border-accent!' : 'border-border',
									row.id === me?.id && 'ring-2 ring-foreground/15',
								)}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 space-y-1.5">
										<p className="break-words font-display text-xl leading-tight font-medium">
											{row.name}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{row.id === me?.id && (
												<Tag className="bg-foreground text-background">{t('cheese.reveal.youTag')}</Tag>
											)}
											{row.flipped && (
												<Tag className="bg-danger-subtle text-danger">{t('cheese.reveal.flippedTag')}</Tag>
											)}
											{row.follower && (
												<Tag className="border border-accent! bg-accent-subtle text-foreground">
													{t('cheese.reveal.roleFollower')}
												</Tag>
											)}
										</div>
									</div>
									<Tag className={ROLE_BADGE[row.role]}>{t(`cheese.deal.role.${row.role}`)}</Tag>
								</div>
								<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
									{nights.map(({ night, hours }) => (
										<div key={night} className="flex items-center gap-2">
											<span className="text-xs text-muted">
												{night2
													? t(night === 1 ? 'cheese.reveal.colNight1' : 'cheese.reveal.colNight2')
													: t('cheese.reveal.wakeLabel')}
											</span>
											<span className="flex gap-1">
												{hours.map((hour) => (
													<span
														key={hour}
														className={cn(
															'flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 font-mono text-sm tabular-nums',
															awakeAtTheft(night, hour)
																? 'bg-accent font-semibold text-accent-foreground'
																: 'bg-surface-secondary',
														)}
														title={
															awakeAtTheft(night, hour)
																? t('cheese.reveal.awakeAtTheft')
																: undefined
														}
													>
														{hour}
													</span>
												))}
											</span>
										</div>
									))}
									{row.hunchCorrect !== null && (
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted">{t('cheese.reveal.colHunch')}</span>
											<span
												className={cn(
													'font-medium',
													row.hunchCorrect ? 'text-success' : 'text-danger',
												)}
											>
												{row.hunchCorrect ? t('cheese.reveal.hunchYes') : t('cheese.reveal.hunchNo')}
											</span>
										</div>
									)}
								</div>
								{sawTheft && (
									<p className="sr-only">{t('cheese.reveal.awakeAtTheft')}</p>
								)}
							</li>
						);
					})}
				</ul>
			</section>

			<ActionBar>
				{state.isHost ? (
					<Button fullWidth disabled={busy} loading={busy} onClick={onAgain}>
						{t('cheese.reveal.again')}
					</Button>
				) : (
					<WaitingForHost>{t('cheese.reveal.waitHost')}</WaitingForHost>
				)}
			</ActionBar>
		</div>
	);
}
