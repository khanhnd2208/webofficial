import { cn } from '@/features/board-game-shared/lib/cn';

interface SkeletonProps {
	className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
	return (
		<div className={cn('animate-pulse rounded-lg bg-surface-secondary', className)} aria-hidden />
	);
}
