'use client';

import { useCallback, useState } from 'react';

import { cn } from '@/features/board-game-shared/lib/cn';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	children: React.ReactNode;
	className?: string;
	compact?: boolean;
	cover?: string;
	/** A second line under the cover, e.g. how the hold works. */
	hint?: string;
	onFirstReveal?: () => void;
}

/** Same shell on every phone. The private line exists only while the finger is down. */
export default function HoldToReveal({
	children,
	className,
	compact = false,
	cover,
	hint,
	onFirstReveal,
}: Props) {
	const t = useT();
	const [open, setOpen] = useState(false);
	const show = useCallback(() => {
		setOpen(true);
		onFirstReveal?.();
	}, [onFirstReveal]);
	const hide = useCallback(() => setOpen(false), []);

	return (
		<div className={cn('mx-auto w-full max-w-sm select-none touch-none', className)}>
			<div
				role="button"
				tabIndex={0}
				aria-label={cover ?? t('cheese.deal.holdFirst')}
				className={cn(
					'relative overflow-hidden rounded-3xl border border-white/10! bg-game-card',
					compact ? 'min-h-28' : 'min-h-64',
				)}
				onPointerDown={show}
				onPointerUp={hide}
				onPointerLeave={hide}
				onPointerCancel={hide}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') show();
				}}
				onKeyUp={(event) => {
					if (event.key === 'Enter' || event.key === ' ') hide();
				}}
				onContextMenu={(event) => event.preventDefault()}
			>
				{!open && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-game-surface px-6 text-center">
						<p className="font-mono text-xs tracking-[0.22em] text-game-bronze uppercase">
							{cover ?? t('cheese.deal.holdFirst')}
						</p>
						<CheeseThiefArt scene={compact ? 'secret' : 'cheese'} size={compact ? 48 : 68} />
						{hint && <p className="text-xs leading-snug text-game-ink/65">{hint}</p>}
					</div>
				)}
				<div
					className={cn(
						'flex flex-col items-center justify-center gap-3 text-center',
						compact ? 'min-h-28 px-5 py-4' : 'min-h-64 p-8',
						open ? 'opacity-100' : 'opacity-0',
					)}
					aria-hidden={!open}
					{...(!open ? { inert: true } : {})}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
