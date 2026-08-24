import type { HTMLAttributes } from 'react';

export function McSkeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			aria-hidden
			className={`animate-pulse rounded-[var(--mc-r-sm)] bg-surface-sunken motion-reduce:animate-none ${className}`}
			{...props}
		/>
	);
}
