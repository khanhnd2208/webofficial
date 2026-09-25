'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Card, Stamp } from '@/features/spy-fall/components/ui';
import { getRoleLabel } from '@/features/spy-fall/lib/spy/i18n';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar, { ActionBarNote } from '../ActionBar';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	onNext?: () => void;
	busy?: boolean;
}

export default function RevealPhase({ state, onNext, busy }: Props) {
	const t = useT();
	const round = state.lastRound;
	const eliminated = round?.token ? state.players.find((p) => p.token === round.token) : undefined;
	const nameByToken = new Map(state.players.map((p) => [p.token, p.name]));
	const counted = (round?.tally ?? []).filter((row) => row.votes > 0).sort((a, b) => b.votes - a.votes);
	const noVotes = counted.length === 0;

	return (
		<>
			<div className="space-y-5">
				<Card elevated className="space-y-3 py-8 text-center">
					{eliminated && round?.role ? (
						<>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted">
								{t('spy.reveal.roundOut', { round: round.round })}
							</p>
							<h2 className="font-display text-3xl font-bold text-ink">
								{t('spy.reveal.eliminated', { name: eliminated.name })}
							</h2>
							<p className="text-sm text-muted-foreground">{t('spy.reveal.wasRole')}</p>
							<Stamp label={getRoleLabel(t, round.role)} variant="suspect" animate />
						</>
					) : (
						<>
							<h2 className="font-display text-3xl font-bold text-ink">{t('spy.reveal.nobodyOut')}</h2>
							<p className="text-sm text-muted-foreground">
								{noVotes ? t('spy.reveal.noVotes') : t('spy.reveal.tieAgain')}
							</p>
						</>
					)}
				</Card>

				{counted.length > 0 ? (
					<section>
						<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
							{t('spy.reveal.tally')}
						</h3>
						<ul className="space-y-1.5">
							{counted.map((row) => (
								<li
									key={row.token}
									className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
								>
									<span className="truncate">{nameByToken.get(row.token) ?? '?'}</span>
									<span className="shrink-0 font-semibold tabular-nums">
										{t('spy.reveal.votes', { count: row.votes })}
									</span>
								</li>
							))}
						</ul>
					</section>
				) : null}

				<StepGuide
					stepsKey={eliminated ? 'spy.steps.reveal' : 'spy.steps.revealTie'}
					tipKey={state.isHost ? 'spy.steps.revealHost' : undefined} />
			</div>

			<ActionBar>
				{state.isHost && onNext ? (
					<Button
						fullWidth
						loading={busy}
						onClick={() => {
							playConfirm();
							onNext();
						}}
					>
						{t('spy.reveal.next', { round: state.round + 1 })}
					</Button>
				) : (
					<ActionBarNote>{t('spy.reveal.waitHost')}</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
