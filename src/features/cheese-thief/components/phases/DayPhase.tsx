'use client';

import ActionBar, { WaitingForHost } from '@/features/cheese-thief/components/ActionBar';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import RoundSteps from '@/features/cheese-thief/components/RoundSteps';
import { SCAPEGOAT_MIN_PLAYERS } from '@/features/cheese-thief/config/cheeseThief';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onVote: () => void;
}

export default function DayPhase({ state, busy, onVote }: Props) {
	const t = useT();
	const scapegoat = state.scapegoatEnabled && state.playerCount >= SCAPEGOAT_MIN_PLAYERS;
	const table = [
		t('cheese.day.tablePlayers', { count: state.playerCount }),
		t('cheese.day.tableThief'),
		state.followers.count > 0
			? t('cheese.day.tableFollowers', { count: state.followers.count })
			: t('cheese.day.tableNoFollowers'),
		...(scapegoat ? [t('cheese.day.tableScapegoat')] : []),
	];

	return (
		<div className="space-y-6 pb-40">
			<RoundSteps current="day" />

			<section className="flex flex-col items-center gap-3 text-center">
				<CheeseThiefArt scene="sunrise" size={84} />
				<h1 className="max-w-md font-display text-3xl leading-tight font-medium">
					{t('cheese.day.title')}
				</h1>
				<p className="max-w-sm text-base leading-relaxed text-muted">{t('cheese.day.body')}</p>
			</section>

			<section className="rounded-3xl border border-border bg-surface px-5 py-4">
				<h2 className="text-sm font-semibold">{t('cheese.day.promptsTitle')}</h2>
				<ul className="mt-3 space-y-2.5">
					{(['prompt1', 'prompt2', 'prompt3'] as const).map((key) => (
						<li key={key} className="flex gap-3 text-[0.95rem] leading-snug">
							<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
							<span>{t(`cheese.day.${key}`)}</span>
						</li>
					))}
				</ul>
			</section>

			<section className="space-y-2">
				<h2 className="text-sm font-semibold">{t('cheese.day.tableTitle')}</h2>
				<ul className="flex flex-wrap gap-2">
					{table.map((item) => (
						<li
							key={item}
							className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
						>
							{item}
						</li>
					))}
				</ul>
			</section>

			<ActionBar>
				{state.isHost ? (
					<>
						<p className="text-center text-xs leading-snug text-muted">
							{t('cheese.day.hostHint')}
						</p>
						<Button fullWidth disabled={busy} loading={busy} onClick={onVote}>
							{t('cheese.day.vote')}
						</Button>
					</>
				) : (
					<WaitingForHost>{t('cheese.day.waitHost')}</WaitingForHost>
				)}
			</ActionBar>
		</div>
	);
}
