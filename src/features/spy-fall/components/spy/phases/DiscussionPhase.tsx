'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar, { ActionBarNote } from '../ActionBar';
import PlayerList from '../PlayerList';
import StakesBanner from '../StakesBanner';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	onNext?: () => void;
	busy?: boolean;
}

export default function DiscussionPhase({ state, onNext, busy }: Props) {
	const t = useT();
	const self = state.self;
	const speaker = state.firstSpeaker?.name ?? '—';
	const living = state.players.filter((p) => !p.isEliminated).length;

	return (
		<>
			<div className="space-y-4">
				{self?.isEliminated ? (
					<StepGuide stepsKey="spy.steps.discussionOut" />
				) : (
					<StepGuide
						stepsKey="spy.steps.discussion"
						params={{ name: speaker }}
						tipKey="spy.steps.discussionTip"
					/>
				)}

				<StakesBanner state={state} />

				<div className="rounded-2xl border border-warning/40 bg-warning-subtle px-4 py-4 text-center">
					<p className="text-xs font-semibold uppercase tracking-wider text-warning">
						<GameIcon name="sound" size={15} className="mr-1 inline" /> {t('spy.discussion.firstLabel')}
					</p>
					<p className="mt-1 font-display text-2xl font-bold text-ink">{speaker}</p>
					<p className="mt-1 text-xs text-muted-foreground">{t('spy.discussion.clockwise')}</p>
				</div>

				<PlayerList
					players={state.players}
					selfId={self?.id}
					firstSpeakerId={state.firstSpeaker?.id}
				/>
				<p className="text-center text-xs text-muted-foreground">
					{t('spy.discussion.alive', { count: living })}
				</p>
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
						{t('spy.discussion.startVote')}
					</Button>
				) : (
					<ActionBarNote>{t('spy.discussion.waitHost')}</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
