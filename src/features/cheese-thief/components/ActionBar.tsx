'use client';

import { cn } from '@/features/board-game-shared/lib/cn';

/**
 * The one thing to press on this screen, kept under the thumb.
 * Pages that use it leave `pb-36` so the last row is never hidden behind it.
 */
export default function ActionBar({
	children,
	dark = false,
}: {
	children: React.ReactNode;
	dark?: boolean;
}) {
	return (
		<div
			className={cn(
				'fixed inset-x-0 bottom-0 z-30 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur',
				dark ? 'dark border-border bg-background/95' : 'border-border bg-background/95',
			)}
		>
			<div className="mx-auto max-w-md space-y-2">{children}</div>
		</div>
	);
}

/** Shown instead of a host-only button, so the other phones know who moves the table on. */
export function WaitingForHost({ children }: { children: React.ReactNode }) {
	return (
		<p className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted">
			<span
				className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent"
				aria-hidden
			/>
			{children}
		</p>
	);
}
