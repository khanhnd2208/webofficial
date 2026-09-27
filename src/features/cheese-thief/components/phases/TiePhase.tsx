'use client';

import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onRevote: () => void;
}

export default function TiePhase({ state, busy, onRevote }: Props) {
	const t = useT();
	const names = state.players.filter((player) => (state.voteCandidateIds ?? []).includes(player.id));

	return (
		<div className="flex min-h-[70svh] flex-col items-center justify-center gap-6 text-center">
			<p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted uppercase">{t('cheese.tie.title')}</p>
			<ul className="space-y-2">
				{names.map((player) => (
					<li key={player.id} className="font-display text-4xl font-medium">
						{player.name}
					</li>
				))}
			</ul>
			<p className="text-lg">{t('cheese.tie.defend')}</p>
			<p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
				{t('cheese.tie.round', { n: state.voteRound ?? 1 })}
			</p>
			{state.isHost && (
				<Button fullWidth disabled={busy} loading={busy} onClick={onRevote}>
					{t('cheese.tie.revote')}
				</Button>
			)}
		</div>
	);
}
