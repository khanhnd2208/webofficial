import type { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
	/** Decorative by default; pair parent with aria-busy */
	className?: string;
};

export function Skeleton({ className = '', ...props }: SkeletonProps) {
	return (
		<div
			aria-hidden
			className={`animate-pulse rounded-md bg-surface-active ${className}`}
			{...props}
		/>
	);
}
