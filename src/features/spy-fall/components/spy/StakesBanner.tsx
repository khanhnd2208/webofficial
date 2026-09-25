'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import { cn } from '@/features/spy-fall/lib/cn';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

interface Props {
	state: Pick<RoomStateDTO, 'spyCount' | 'spiesCaught'>;
	className?: string;
}

/** What this vote decides: the whole game with one Spy, or a first or final guess with two. */
function stakesKey({ spyCount, spiesCaught }: Props['state']): string {
	if (spyCount === 1) return 'spy.stakes.one';
	return spiesCaught > 0 ? 'spy.stakes.twoLast' : 'spy.stakes.twoFirst';
}

export default function StakesBanner({ state, className }: Props) {
	const t = useT();
	const finalGuess = state.spyCount === 1 || state.spiesCaught > 0;

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
			<span>{t(stakesKey(state))}</span>
		</p>
	);
}
