'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import { cn } from '@/features/spy-fall/lib/cn';
import { playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar, { ActionBarNote } from '../ActionBar';
import PlayerList from '../PlayerList';
import StakesBanner from '../StakesBanner';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	onVote: (targetId: string | null) => void;
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
		(p) => p.id !== self?.id && (!restricted || candidateSet.has(p.id)),
	);
	const tiedNames = state.voteCandidates
		.map((id) => state.players.find((p) => p.id === id)?.name)
		.filter(Boolean)
		.join(', ');
	const pickedName = choices.find((p) => p.id === self?.voteId)?.name;
	const progress = living.length > 0 ? Math.round((voted / living.length) * 100) : 0;
	const out = Boolean(self?.isEliminated);
	const missing = living.length - voted;

	function lockWarning(): string {
		if (voted === 0) return t('spy.vote.lockConfirmNone');
		const tie = state.isRevote ? t('spy.vote.lockTieEnds') : t('spy.vote.lockTieRevote');
		return t('spy.vote.lockConfirmSome', { missing, tie });
	}

	return (
		<>
			<div className="space-y-4">
				<StepGuide
					stepsKey={
						out ? 'spy.steps.voteOut' : state.isRevote ? 'spy.steps.revote' : 'spy.steps.vote'
					}
				/>

				<StakesBanner state={state} />

				{state.isRevote ? (
					<div className="rounded-xl border border-warning/40 bg-warning-subtle px-4 py-3 text-center text-sm font-semibold text-warning">
						<GameIcon name="target" size={15} className="mr-1 inline" />{' '}
						{t('spy.vote.revote', { names: tiedNames })}
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
					<PlayerList players={living} selfId={self?.id} showVoted />
				) : (
					<PlayerList
						players={choices}
						selectable
						disabled={busy}
						selectedId={self?.voteId}
						onSelect={(id) => {
							playTap();
							onVote(id === self?.voteId ? null : id);
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
							if (voted < living.length && !window.confirm(lockWarning())) return;
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
