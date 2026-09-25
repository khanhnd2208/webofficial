'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import { cn } from '@/features/spy-fall/lib/cn';
import { playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar, { ActionBarNote } from '../ActionBar';
import PlayerList from '../PlayerList';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	onVote: (targetToken: string | null) => void;
	onNext?: () => void;
	busy?: boolean;
}

export default function VotePhase({ state, onVote, onNext, busy }: Props) {
	const t = useT();
	const self = state.self;
	const living = state.players.filter((p) => !p.isEliminated);
	const voted = living.filter((p) => p.hasVoted).length;
	const candidateSet = new Set(state.voteCandidates);
	const restricted = state.isRevote && candidateSet.size > 0;
	const choices = living.filter(
		(p) => p.token !== self?.token && (!restricted || candidateSet.has(p.token)),
	);
	const tiedNames = state.voteCandidates
		.map((token) => state.players.find((p) => p.token === token)?.name)
		.filter(Boolean)
		.join(', ');
	const pickedName = choices.find((p) => p.token === self?.voteToken)?.name;
	const progress = living.length > 0 ? Math.round((voted / living.length) * 100) : 0;
	const out = Boolean(self?.isEliminated);

	return (
		<>
			<div className="space-y-4">
				<StepGuide
					stepsKey={out ? 'spy.steps.voteOut' : state.isRevote ? 'spy.steps.revote' : 'spy.steps.vote'}
				/>

				{state.isRevote ? (
					<div className="rounded-xl border border-warning/40 bg-warning-subtle px-4 py-3 text-center text-sm font-semibold text-warning">
						<GameIcon name="target" size={15} className="mr-1 inline" /> {t('spy.vote.revote', { names: tiedNames })}
					</div>
				) : null}

				<div>
					<div className="flex items-baseline justify-between text-sm">
						<span className="font-semibold text-ink">
							{t('spy.vote.count', { done: voted, total: living.length })}
						</span>
						{pickedName ? (
							<span className="truncate pl-3 text-muted-foreground">
								{t('spy.vote.yourPick', { name: pickedName })}
							</span>
						) : null}
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
						<div
							className={cn('h-full rounded-full bg-accent transition-[width] duration-300')}
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{out ? (
					<PlayerList players={living} selfToken={self?.token} showVoted />
				) : (
					<PlayerList
						players={choices}
						selectable
						disabled={busy}
						selectedToken={self?.voteToken}
						onSelect={(token) => {
							playTap();
							onVote(token === self?.voteToken ? null : token);
						}}
					/>
				)}
			</div>

			<ActionBar>
				{state.isHost && onNext ? (
					<Button
						variant="secondary"
						fullWidth
						loading={busy}
						onClick={() => {
							if (voted < living.length && !window.confirm(t('spy.vote.lockConfirm'))) return;
							onNext();
						}}
					>
						{t('spy.vote.lock')}
					</Button>
				) : (
					<ActionBarNote>
						{out
							? t('spy.vote.watching')
							: pickedName
								? t('spy.vote.waitOthers')
								: t('spy.vote.pickOne')}
					</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
