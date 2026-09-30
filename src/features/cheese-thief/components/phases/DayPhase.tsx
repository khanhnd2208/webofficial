'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import { useEffect, useState } from 'react';

import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	state: RoomStateDTO;
	fetchedAt: number;
	busy: boolean;
	onVote: () => void;
}

export default function DayPhase({ state, fetchedAt, busy, onVote }: Props) {
	const testRoom = useTestRoom();
	const paused = testRoom ? !testRoom.running : false;
	const t = useT();
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (!state.dayStartedAt) return;
		const started = new Date(state.dayStartedAt).getTime();
		const skew = new Date(state.serverNow).getTime() - fetchedAt;
		const tick = () =>
			setSeconds(
				Math.max(
					0,
					Math.floor(
						((paused ? new Date(state.serverNow).getTime() : Date.now() + skew) - started) / 1000,
					),
				),
			);
		tick();
		const timer = window.setInterval(tick, 1000);
		return () => window.clearInterval(timer);
	}, [state.dayStartedAt, state.serverNow, fetchedAt, paused]);

	const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

	return (
		<div className="flex min-h-[70svh] flex-col items-center justify-center gap-6 text-center">
			<CheeseThiefArt scene="sunrise" size={96} />
			<h1 className="max-w-md font-display text-4xl leading-tight font-medium">
				{t('cheese.day.title')}
			</h1>
			<p className="max-w-md text-base leading-relaxed text-muted">{t('cheese.day.body')}</p>
			<p className="font-mono text-sm tracking-[0.16em] text-muted">{clock}</p>
			{state.isHost && (
				<Button fullWidth disabled={busy} loading={busy} onClick={onVote}>
					{t('cheese.day.vote')}
				</Button>
			)}
		</div>
	);
}
