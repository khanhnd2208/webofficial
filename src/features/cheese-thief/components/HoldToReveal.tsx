'use client';

import { useCallback, useState } from 'react';

import { cn } from '@/features/spy-fall/lib/cn';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

interface Props {
	children: React.ReactNode;
	className?: string;
}

/** Same shell on every phone. The private line exists only while the finger is down. */
export default function HoldToReveal({ children, className }: Props) {
	const t = useT();
	const [open, setOpen] = useState(false);
	const show = useCallback(() => setOpen(true), []);
	const hide = useCallback(() => setOpen(false), []);

	return (
		<div className={cn('mx-auto w-full max-w-sm select-none touch-none', className)}>
			<div
				role="button"
				tabIndex={0}
				aria-label={t('cheese.deal.holdFirst')}
				className="relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-[#16140f]"
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
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#16140f] px-6 text-center">
						<p className="font-mono text-[0.68rem] tracking-[0.22em] text-[#e0a045] uppercase">
							{t('cheese.deal.holdFirst')}
						</p>
						<p className="font-display text-5xl" aria-hidden>
							🧀
						</p>
					</div>
				)}
				<div
					className={cn('flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center', open ? 'opacity-100' : 'opacity-0')}
					aria-hidden={!open}
					{...(!open ? { inert: true } : {})}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
