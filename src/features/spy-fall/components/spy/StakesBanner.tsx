'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';
import { cn } from '@/features/board-game-shared/lib/cn';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

interface Props {
	state: Pick<RoomStateDTO, 'spyCount' | 'spiesCaught' | 'spiesRemaining'>;
	className?: string;
}

/** What this vote decides: the whole game with one Spy, else a first, middle or final guess. */
function stakesKey({ spyCount, spiesCaught, spiesRemaining }: Props['state']): string {
	if (spyCount === 1) return 'spy.stakes.one';
	if (spiesRemaining <= 1) return 'spy.stakes.last';
	if (spiesCaught === 0) return 'spy.stakes.first';
	return 'spy.stakes.middle';
}

export default function StakesBanner({ state, className }: Props) {
	const t = useT();
	const finalGuess = state.spyCount === 1 || state.spiesRemaining <= 1;

	return (
		<p
			className={cn(
				'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
				finalGuess
					? 'border-danger/30 bg-danger-subtle text-danger'
					: 'border-warning/40 bg-warning-subtle text-warning',
				className,
			)}
		>
			<GameIcon name="target" size={16} className="mt-0.5 shrink-0" />
			<span>{t(stakesKey(state), { caught: state.spiesCaught, total: state.spyCount })}</span>
		</p>
	);
}
