'use client';

import type { GamePhase } from '@/types/spyGame';

import { useT } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/cn';

const PHASE_ORDER: GamePhase[] = [
	'lobby',
	'role-reveal',
	'opening',
	'discussion',
	'vote',
	'runoff',
	'mrwhite-guess',
	'result',
];

interface Props {
	current: GamePhase;
	className?: string;
}

export default function PhaseTracker({ current, className }: Props) {
	const t = useT();
	const currentIdx = PHASE_ORDER.indexOf(current);

	return (
		<nav aria-label={t('spy.phases.lobby')} className={cn('overflow-x-auto pb-1', className)}>
			<ol className="flex min-w-max gap-1">
				{PHASE_ORDER.filter((p) => p !== 'runoff' && p !== 'mrwhite-guess').map((phase, idx) => {
					const phaseIdx = PHASE_ORDER.indexOf(phase);
					const isActive = phase === current;
					const isPast = phaseIdx < currentIdx;
					const isRunoffOrMrWhite =
						(current === 'runoff' || current === 'mrwhite-guess') &&
						phase === 'vote';

					return (
						<li key={phase}>
							<span
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
									isActive || isRunoffOrMrWhite
										? 'bg-accent text-accent-foreground'
										: isPast
											? 'bg-success-subtle text-success'
											: 'bg-surface-secondary text-muted',
								)}
							>
								<span className="font-mono">{idx + 1}</span>
								<span className="hidden sm:inline">{t(`spy.phases.${phase}`)}</span>
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
