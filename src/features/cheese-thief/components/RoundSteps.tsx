'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';

export type RoundStep = 'secret' | 'day' | 'vote' | 'reveal';

const STEPS: RoundStep[] = ['secret', 'day', 'vote', 'reveal'];

/** Where the table is after the night, so nobody has to guess what comes next. */
export default function RoundSteps({
	current,
	className,
}: {
	current: RoundStep;
	className?: string;
}) {
	const t = useT();
	const at = STEPS.indexOf(current);

	return (
		<ol
			className={cn('grid grid-cols-4 gap-1.5', className)}
			aria-label={t('cheese.steps.label', { n: at + 1, total: STEPS.length })}
		>
			{STEPS.map((step, index) => (
				<li
					key={step}
					aria-current={index === at ? 'step' : undefined}
					className="flex min-w-0 flex-col gap-1.5"
				>
					<span
						className={cn(
							'h-1 rounded-full',
							index < at ? 'bg-accent/60' : index === at ? 'bg-accent' : 'bg-border',
						)}
					/>
					<span
						className={cn(
							'truncate py-0.5 text-xs leading-normal',
							index === at ? 'font-semibold text-foreground' : 'text-muted',
						)}
					>
						{t(`cheese.steps.${step}`)}
					</span>
				</li>
			))}
		</ol>
	);
}
