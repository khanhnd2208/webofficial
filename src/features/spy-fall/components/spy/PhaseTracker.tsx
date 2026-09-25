'use client';

import type { GamePhase } from '@/features/spy-fall/types/spyGame';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';

const STEPS: GamePhase[] = ['role-reveal', 'discussion', 'vote', 'reveal'];

interface Props {
	current: GamePhase;
	className?: string;
}

/** One round's steps. The active step always shows its name, even on narrow screens. */
export default function PhaseTracker({ current, className }: Props) {
	const t = useT();
	const shown = current;
	const currentIdx = STEPS.indexOf(shown);

	return (
		<nav aria-label={t('spy.steps.heading')} className={className}>
			<ol className="flex items-center gap-1">
				{STEPS.map((phase, idx) => {
					const isActive = phase === shown;
					const isPast = idx < currentIdx;
					return (
						<li key={phase} className={cn(isActive ? 'flex-[2.5]' : 'flex-1', 'min-w-0')}>
							<span
								aria-current={isActive ? 'step' : undefined}
								className={cn(
									'flex h-7 items-center justify-center gap-1 truncate rounded-full px-2 text-[11px] font-semibold transition-colors',
									isActive
										? 'bg-accent text-accent-foreground'
										: isPast
											? 'bg-success-subtle text-success'
											: 'bg-surface-secondary text-muted',
								)}
							>
								{isActive ? (
									<span className="truncate">{t(`spy.phases.${current}`)}</span>
								) : (
									<span className="font-mono">{isPast ? '✓' : idx + 1}</span>
								)}
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
