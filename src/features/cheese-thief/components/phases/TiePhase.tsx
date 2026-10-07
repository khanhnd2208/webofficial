'use client';

import ActionBar, { WaitingForHost } from '@/features/cheese-thief/components/ActionBar';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import RoundSteps from '@/features/cheese-thief/components/RoundSteps';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onRevote: () => void;
}

export default function TiePhase({ state, busy, onRevote }: Props) {
	const t = useT();
	const tied = state.players.filter((player) => (state.voteCandidateIds ?? []).includes(player.id));

	return (
		<div className="space-y-6 pb-40">
			<RoundSteps current="vote" />

			<section className="flex flex-col items-center gap-3 text-center">
				<CheeseThiefArt scene="tie" size={84} />
				<p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
					{t('cheese.tie.round', { n: state.voteRound ?? 1 })}
				</p>
				<h1 className="font-display text-4xl font-medium">{t('cheese.tie.title')}</h1>
				<p className="max-w-sm text-sm leading-relaxed text-muted">{t('cheese.tie.body')}</p>
			</section>

			<ul className="grid gap-2">
				{tied.map((player) => (
					<li
						key={player.id}
						className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-accent/60! bg-accent-subtle px-4 py-3"
					>
						<span className="min-w-0 break-words font-display text-2xl font-medium">
							{player.name}
						</span>
						{player.id === state.self?.id && (
							<span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
								{t('cheese.vote.you')}
							</span>
						)}
					</li>
				))}
			</ul>

			<section className="rounded-3xl border border-border bg-surface px-5 py-4">
				<h2 className="text-sm font-semibold">{t('cheese.tie.next')}</h2>
				<ol className="mt-3 space-y-2.5">
					{(['step1', 'step2', 'step3'] as const).map((key, index) => (
						<li key={key} className="flex gap-3 text-[0.95rem] leading-snug">
							<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle font-mono text-xs font-semibold">
								{index + 1}
							</span>
							<span className="pt-0.5">{t(`cheese.tie.${key}`)}</span>
						</li>
					))}
				</ol>
			</section>

			<ActionBar>
				{state.isHost ? (
					<Button fullWidth disabled={busy} loading={busy} onClick={onRevote}>
						{t('cheese.tie.revote')}
					</Button>
				) : (
					<WaitingForHost>{t('cheese.tie.waitHost')}</WaitingForHost>
				)}
			</ActionBar>
		</div>
	);
}
