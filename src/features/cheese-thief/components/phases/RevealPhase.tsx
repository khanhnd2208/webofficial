'use client';

import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onAgain: () => void;
}

export default function RevealPhase({ state, busy, onAgain }: Props) {
	const t = useT();
	const roster = state.roster ?? [];
	const flipped = roster.filter((row) => row.flipped);
	const thief = roster.find((row) => row.role === 'thief');
	const followers = roster.filter((row) => row.follower);
	const scapegoat = roster.find((row) => row.role === 'scapegoat');
	const night2 = roster.some((row) => row.wakeHours2 !== null && row.wakeHours2 !== undefined);

	return (
		<div className="space-y-6 pb-6">
			<CheeseThiefArt scene="reveal" size={84} className="mx-auto" />
			{state.winner && (
				<section className="rounded-3xl border border-[color:var(--game-line)] bg-accent-subtle px-5 py-6 text-center">
					<p className="game-theme-kicker">{t('cheese.reveal.winnerLabel')}</p>
					<h1 className="mt-2 font-display text-3xl font-medium leading-tight">
						{t(`cheese.reveal.winner.${state.winner}`)}
					</h1>
				</section>
			)}
			<section className="space-y-2 text-center">
				<p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
					{t('cheese.reveal.flipped')}
				</p>
				{flipped.map((row) => (
					<div key={row.id}>
						<p className="font-display text-4xl font-medium">{row.name}</p>
						<p className="text-sm text-muted">{t(`cheese.deal.role.${row.role}`)}</p>
					</div>
				))}
			</section>

			<section className="space-y-1 text-center">
				<p className="text-sm text-muted">{t('cheese.reveal.thief')}</p>
				<p className="font-display text-3xl font-medium">{thief?.name}</p>
				<p className="pt-3 text-sm text-muted">
					{followers.length > 0 ? t('cheese.reveal.followers') : t('cheese.reveal.noFollowers')}
				</p>
				{followers.length > 0 && (
					<p className="text-lg">{followers.map((row) => row.name).join(', ')}</p>
				)}
				{scapegoat && (
					<p className="pt-3 text-sm text-muted">
						{t('cheese.reveal.scapegoat')} {scapegoat.name}
					</p>
				)}
			</section>

			{state.theftHour !== undefined && (
				<p className="text-center text-sm text-muted">
					{state.mode === 'two-night' && state.theftNight
						? t('cheese.reveal.theftNight', { night: state.theftNight, hour: state.theftHour })
						: t('cheese.reveal.theft', { hour: state.theftHour })}
				</p>
			)}

			<section className="space-y-3">
				<h2 className="font-display text-xl font-medium">{t('cheese.reveal.rosterTitle')}</h2>
				{roster.map((row) => (
					<article key={row.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
						<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<h3 className="min-w-0 break-words font-display text-xl font-medium">{row.name}</h3>
							<span className="text-sm text-muted">{t(`cheese.deal.role.${row.role}`)}</span>
						</div>
						{row.follower && (
							<p className="mt-2 inline-flex rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-foreground">
								{t('cheese.reveal.followerBadge')}
							</p>
						)}
						<dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
							<div>
								<dt className="text-xs text-muted">
									{t(night2 ? 'cheese.reveal.colNight1' : 'cheese.reveal.colHour')}
								</dt>
								<dd className="mt-1 font-medium tabular-nums">{row.wakeHours.join(', ')}</dd>
							</div>
							{night2 && (
								<div>
									<dt className="text-xs text-muted">{t('cheese.reveal.colNight2')}</dt>
									<dd className="mt-1 font-medium tabular-nums">
										{(row.wakeHours2 ?? []).join(', ')}
									</dd>
								</div>
							)}
							<div>
								<dt className="text-xs text-muted">{t('cheese.reveal.colHunch')}</dt>
								<dd className="mt-1 font-medium">
									{row.hunchCorrect === null
										? t('cheese.reveal.hunchNone')
										: row.hunchCorrect
											? t('cheese.reveal.hunchYes')
											: t('cheese.reveal.hunchNo')}
								</dd>
							</div>
						</dl>
					</article>
				))}
			</section>

			{state.isHost && (
				<Button fullWidth disabled={busy} loading={busy} onClick={onAgain}>
					{t('cheese.reveal.again')}
				</Button>
			)}
		</div>
	);
}
