'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button, Card, Stamp } from '@/features/board-game-shared/components/ui';
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
	const eliminated = round?.id ? state.players.find((p) => p.id === round.id) : undefined;
	const nameById = new Map(state.players.map((p) => [p.id, p.name]));
	const counted = (round?.tally ?? [])
		.filter((row) => row.votes > 0)
		.sort((a, b) => b.votes - a.votes);
	const spiesLeft = state.spiesRemaining;
	const finalGuess = spiesLeft <= 1;

	return (
		<>
			<div className="space-y-5">
				{/* Reached only in multi-Spy games, after a Spy is voted out and others are still hidden. */}
				<Card elevated className="space-y-3 py-8 text-center">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted">
						{t('spy.reveal.roundOut', { round: round?.round ?? state.round })}
					</p>
					<h2 className="font-display text-3xl font-bold text-success">{t('spy.reveal.caught')}</h2>
					{eliminated ? (
						<p className="font-display text-xl font-semibold text-ink">
							{t('spy.reveal.eliminated', { name: eliminated.name })}
						</p>
					) : null}
					{round?.role ? (
						<>
							<p className="text-sm text-muted-foreground">{t('spy.reveal.wasRole')}</p>
							<Stamp label={getRoleLabel(t, round.role)} variant="suspect" animate />
						</>
					) : null}
					<p className="px-4 pt-2 text-sm font-medium text-ink">
						{t('spy.reveal.spiesLeft', { count: spiesLeft })}
					</p>
				</Card>

				{counted.length > 0 ? (
					<section>
						<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
							{t('spy.reveal.tally')}
						</h3>
						<ul className="space-y-1.5">
							{counted.map((row) => (
								<li
									key={row.id}
									className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
								>
									<span className="truncate">{nameById.get(row.id) ?? '?'}</span>
									<span className="shrink-0 font-semibold tabular-nums">
										{t('spy.reveal.votes', { count: row.votes })}
									</span>
								</li>
							))}
						</ul>
					</section>
				) : null}

				<StepGuide
					stepsKey={finalGuess ? 'spy.steps.reveal' : 'spy.steps.revealMore'}
					params={{ count: spiesLeft }}
					tipKey={state.isHost ? 'spy.steps.revealHost' : undefined}
				/>
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
						{t(finalGuess ? 'spy.reveal.nextFinal' : 'spy.reveal.nextMore', {
							round: state.round + 1,
						})}
					</Button>
				) : (
					<ActionBarNote>{t('spy.reveal.waitHost')}</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
