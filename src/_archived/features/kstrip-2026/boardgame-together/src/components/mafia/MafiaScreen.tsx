'use client';

import { cn } from '@/lib/cn';

interface MafiaScreenProps {
	children: React.ReactNode;
	center?: boolean;
	className?: string;
	/** Reserve top space for fixed HostGuardButton */
	guardTop?: boolean;
	footer?: React.ReactNode;
}

export default function MafiaScreen({
	children,
	center = false,
	className,
	guardTop = false,
	footer,
}: MafiaScreenProps) {
	return (
		<div className="mafia-scope relative min-h-[100dvh] text-[var(--mafia-foreground)]">
			<div className="mafia-moon pointer-events-none absolute inset-0" aria-hidden />
			<div className="mafia-vignette pointer-events-none absolute inset-0" aria-hidden />

			<div
				className={cn(
					'relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4',
					guardTop ? 'pt-14' : 'pt-6',
					'pb-[max(1rem,env(safe-area-inset-bottom))]',
					center && 'items-center justify-center',
					className,
				)}
			>
				<div className={cn('flex-1', center ? 'flex w-full flex-col items-center justify-center' : 'overflow-y-auto')}>
					{children}
				</div>
				{footer ? <div className="shrink-0 pt-4">{footer}</div> : null}
			</div>
		</div>
	);
}
