'use client';

import { useState } from 'react';

import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onVote: (targetId: string) => void;
}

export default function VotePhase({ state, busy, onVote }: Props) {
	const t = useT();
	const [choice, setChoice] = useState<string | null>(state.self?.voteId ?? null);
	const allowed = new Set(state.voteCandidateIds ?? state.players.map((player) => player.id));
	const options = state.players.filter((player) => player.id !== state.self?.id && allowed.has(player.id));

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<CheeseThiefArt scene="ballot" size={52} className="mx-auto" />
				<h1 className="font-display text-4xl font-medium">{t('cheese.vote.title')}</h1>
				{state.isRunoff && <p className="text-sm text-muted">{t('cheese.vote.runoff')}</p>}
				<p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
					{t('cheese.vote.progress', { done: state.votesCast ?? 0, total: state.playerCount })}
				</p>
			</div>
			<div className="grid gap-2">
				{options.map((player) => (
					<button
						key={player.id}
						type="button"
						disabled={busy || Boolean(state.self?.voteId)}
						className={cn(
							'min-h-14 rounded-2xl border px-4 text-left text-lg',
							choice === player.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-surface',
						)}
						onClick={() => setChoice(player.id)}
					>
						{player.name}
					</button>
				))}
			</div>
			<Button fullWidth disabled={busy || !choice || Boolean(state.self?.voteId)} loading={busy} onClick={() => choice && onVote(choice)}>
				{state.self?.voteId ? t('cheese.vote.done') : t('cheese.vote.cast')}
			</Button>
		</div>
	);
}
