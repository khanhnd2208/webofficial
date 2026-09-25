'use client';

import { useMemo, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Badge, Button, Card, Panel, Stamp } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';
import { getPhaseHint } from '@/features/spy-fall/lib/spy/i18n';
import { playConfirm, playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import PlayerList from '../PlayerList';

interface Props {
	state: RoomStateDTO;
	onVote: (vote1: string | null, vote2: string | null, confirmed: boolean) => void;
	onNext?: () => void;
	busy?: boolean;
}

function initialSelected(self: RoomStateDTO['self']): string[] {
	if (!self) return [];
	return [self.vote1Token, self.vote2Token].filter((tok): tok is string => Boolean(tok));
}

export default function VotePhase({ state, onVote, onNext, busy }: Props) {
	const t = useT();
	const self = state.self;
	const needed = state.votesRequired ?? 2;
	const [selected, setSelected] = useState<string[]>(() => initialSelected(self));

	const others = state.players.filter((p) => p.token !== self?.token);
	const sealedCount = state.players.filter((p) => p.voteConfirmed === true).length;
	const totalPlayers = state.players.length;
	const allConfirmed = totalPlayers > 0 && sealedCount === totalPlayers;
	const selectionComplete = selected.length === needed;

	const selectedPlayers = useMemo(
		() =>
			selected.map((token) => ({
				token,
				name: others.find((p) => p.token === token)?.name ?? '?',
			})),
		[selected, others],
	);

	function persist(next: string[]) {
		onVote(next[0] ?? null, next[1] ?? null, false);
	}

	function handleToggle(token: string) {
		if (self?.voteConfirmed) return;
		playTap();
		setSelected((prev) => {
			if (prev.includes(token)) {
				const next = prev.filter((tok) => tok !== token);
				persist(next);
				return next;
			}
			if (prev.length >= needed) return prev;
			const next = [...prev, token];
			persist(next);
			return next;
		});
	}

	function handleClear() {
		setSelected([]);
		void onVote(null, null, false);
	}

	return (
		<div className="space-y-4">
			<Card className="text-center">
				<p className="font-mono text-[10px] uppercase tracking-widest text-muted">
					{t('spy.vote.sealed')}
				</p>
				<p className="font-display mt-1 text-3xl font-bold tabular-nums text-ink">
					{sealedCount}/{totalPlayers}
				</p>
				<p
					className={cn(
						'mt-1 text-sm',
						allConfirmed ? 'font-semibold text-success' : 'text-muted-foreground',
					)}
				>
					{allConfirmed ? t('spy.discussion.enough') : t('spy.opening.waitOthers')}
				</p>
			</Card>

			<Panel title={t('spy.vote.title')} description={getPhaseHint(t, 'vote')}>
				<div className="flex justify-center">
					<Stamp label={t('spy.vote.sealed')} variant="classified" />
				</div>
				<p
					className={cn(
						'mt-3 text-center text-sm font-medium',
						selectionComplete && 'font-semibold text-success',
					)}
				>
					{selectionComplete ? '✓ ' : ''}
					{selected.length}/{needed}
				</p>
			</Panel>

			{selectedPlayers.length > 0 ? (
				<div className="flex flex-wrap justify-center gap-2">
					{selectedPlayers.map((p) => (
						<Badge key={p.token} variant="accent">
							{p.name}
						</Badge>
					))}
				</div>
			) : null}

			<PlayerList
				players={others}
				selectable={!self?.voteConfirmed}
				selectedTokens={selected}
				onSelect={handleToggle}
			/>

			{self && !self.voteConfirmed ? (
				<div className="space-y-2">
					<Button
						fullWidth
						loading={busy}
						disabled={selected.length !== needed}
						onClick={() => {
							playConfirm();
							onVote(selected[0] ?? null, selected[1] ?? null, true);
						}}
					>
						{t('spy.vote.seal')}
					</Button>
					{selected.length > 0 ? (
						<Button variant="ghost" size="sm" fullWidth onClick={handleClear}>
							{t('common.back')}
						</Button>
					) : null}
				</div>
			) : null}

			{self?.voteConfirmed && !state.isHost ? (
				<p className="text-center text-sm text-muted">{t('spy.vote.waitHost')}</p>
			) : null}

			{state.isHost && onNext ? (
				<Button
					variant={allConfirmed ? 'primary' : 'secondary'}
					fullWidth
					loading={busy}
					className={cn(allConfirmed && 'animate-pulse')}
					onClick={onNext}
				>
					{t('spy.vote.open')}
				</Button>
			) : null}
		</div>
	);
}
