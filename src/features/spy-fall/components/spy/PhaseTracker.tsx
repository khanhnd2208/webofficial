'use client';

import type { GamePhase } from '@/features/spy-fall/types/spyGame';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';
import GameIcon, { type GameIconName } from '@/features/spy-fall/components/ui/GameIcon';

const STEPS: GamePhase[] = ['role-reveal', 'discussion', 'vote', 'reveal'];
/** With one Spy the vote ends the game, so there is no reveal between rounds. */
const STEPS_WITHOUT_REVEAL: GamePhase[] = ['role-reveal', 'discussion', 'vote'];
const STEP_ICONS: Record<GamePhase, GameIconName> = {
	lobby: 'users',
	'role-reveal': 'passport',
	discussion: 'users',
	vote: 'target',
	reveal: 'eye',
	result: 'check',
};

interface Props {
	current: GamePhase;
	/** Multi-Spy games reveal each catch before the next guess. */
	showReveal?: boolean;
	className?: string;
}

/** One round's steps. The active step always shows its name, even on narrow screens. */
export default function PhaseTracker({ current, showReveal = true, className }: Props) {
	const t = useT();
	const steps = showReveal ? STEPS : STEPS_WITHOUT_REVEAL;
	const shown = current;
	const currentIdx = steps.indexOf(shown);

	return (
		<nav aria-label={t('spy.steps.heading')} className={className}>
			<ol className="flex items-center gap-1">
				{steps.map((phase, idx) => {
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
									<span className="flex min-w-0 items-center gap-1.5 truncate">
										<GameIcon name={STEP_ICONS[phase]} size={14} />
										<span className="truncate">{t(`spy.phases.${current}`)}</span>
									</span>
								) : (
									<span className="flex items-center justify-center">
										<GameIcon name={isPast ? 'check' : STEP_ICONS[phase]} size={13} />
									</span>
								)}
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
