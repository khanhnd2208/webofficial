import { cn } from '@/features/spy-fall/lib/cn';

interface SkeletonProps {
	className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
	return (
		<div className={cn('animate-pulse rounded-lg bg-surface-secondary', className)} aria-hidden />
	);
}
