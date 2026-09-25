import { cn } from '@/features/spy-fall/lib/cn';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const variants: Record<BadgeVariant, string> = {
	default: 'bg-surface-secondary text-foreground-secondary',
	accent: 'bg-accent-subtle text-accent',
	success: 'bg-success-subtle text-success',
	warning: 'bg-warning-subtle text-warning',
	danger: 'bg-danger-subtle text-danger',
	info: 'bg-info-subtle text-info',
	muted: 'bg-surface-secondary text-muted uppercase tracking-wide',
};

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
				variants[variant],
				className,
			)}
		>
			{children}
		</span>
	);
}
