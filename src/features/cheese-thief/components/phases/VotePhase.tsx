'use client';

import { useState } from 'react';

import ActionBar from '@/features/cheese-thief/components/ActionBar';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import RoundSteps from '@/features/cheese-thief/components/RoundSteps';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onVote: (targetId: string) => void;
}

export default function VotePhase({ state, busy, onVote }: Props) {
	const t = useT();
	const voted = state.self?.voteId ?? null;
	const [choice, setChoice] = useState<string | null>(voted);
	const allowed = new Set(state.voteCandidateIds ?? state.players.map((player) => player.id));
	const options = state.players.filter(
		(player) => player.id !== state.self?.id && allowed.has(player.id),
	);
	const selfTied = Boolean(state.isRunoff && state.self && allowed.has(state.self.id));
	const cast = state.votesCast ?? 0;
	const total = state.playerCount;
	const nameOf = (id: string | null) => state.players.find((player) => player.id === id)?.name ?? '';

	return (
		<div className="space-y-6 pb-40">
			<RoundSteps current="vote" />

			<section className="space-y-3 text-center">
				<CheeseThiefArt scene="ballot" size={56} className="mx-auto" />
				<h1 className="font-display text-4xl font-medium">{t('cheese.vote.title')}</h1>
				{state.isRunoff && (
					<p className="mx-auto max-w-sm rounded-2xl bg-accent-subtle px-4 py-2 text-sm font-medium text-foreground">
						{t('cheese.vote.runoff', { n: state.voteRound ?? 1 })}
					</p>
				)}
				<p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
					{selfTied ? t('cheese.vote.runoffSelf') : t('cheese.vote.hint')}
				</p>
			</section>

			<section className="space-y-1.5" aria-live="polite">
				<div className="flex items-baseline justify-between text-xs text-muted">
					<span>{t('cheese.vote.progress', { done: cast, total })}</span>
				</div>
				<div
					className="h-1.5 overflow-hidden rounded-full bg-border"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={total}
					aria-valuenow={cast}
				>
					<div
						className="h-full rounded-full bg-accent transition-[width] duration-300"
						style={{ width: `${total > 0 ? (cast / total) * 100 : 0}%` }}
					/>
				</div>
			</section>

			<div className="grid gap-2" role="radiogroup" aria-label={t('cheese.vote.title')}>
				{options.map((player) => {
					const picked = choice === player.id;
					return (
						<button
							key={player.id}
							type="button"
							role="radio"
							aria-checked={picked}
							disabled={busy || Boolean(voted)}
							className={cn(
								'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-lg transition-colors disabled:cursor-default',
								picked
									? 'border-accent! bg-accent-subtle ring-1 ring-accent'
									: 'border-border bg-surface',
								voted && !picked && 'opacity-50',
							)}
							onClick={() => setChoice(player.id)}
						>
							<span
								className={cn(
									'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
									picked ? 'border-accent!' : 'border-border',
								)}
								aria-hidden
							>
								{picked && <span className="h-3 w-3 rounded-full bg-accent" />}
							</span>
							<span className="min-w-0 flex-1 break-words">{player.name}</span>
							{voted === player.id && (
								<span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
									{t('cheese.vote.yourVote')}
								</span>
							)}
						</button>
					);
				})}
			</div>

			<ActionBar>
				{voted ? (
					<p className="flex min-h-12 items-center justify-center rounded-xl bg-surface-secondary px-4 text-center text-sm">
						{t('cheese.vote.waiting', { name: nameOf(voted), left: Math.max(0, total - cast) })}
					</p>
				) : (
					<Button
						fullWidth
						disabled={busy || !choice}
						loading={busy}
						onClick={() => choice && onVote(choice)}
					>
						<span className="truncate">
							{choice ? t('cheese.vote.castFor', { name: nameOf(choice) }) : t('cheese.vote.pick')}
						</span>
					</Button>
				)}
			</ActionBar>
		</div>
	);
}
