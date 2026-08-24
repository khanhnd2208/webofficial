import type { HTMLAttributes, ReactNode } from 'react';

type McBadgeVariant = 'neutral' | 'done' | 'test' | 'vocab' | 'level' | 'accent' | 'warning' | 'error';

const variantClass: Record<McBadgeVariant, string> = {
	neutral: 'border-mc-rule/40 text-ink-secondary',
	done: 'border-mc-done/30 bg-mc-done-subtle text-mc-done',
	test: 'border-transparent bg-accent/10 text-accent',
	vocab: 'border-mc-vocab/40 bg-mc-vocab-subtle text-mc-vocab',
	level: 'border-mc-rule/40 text-ink-secondary',
	accent: 'border-transparent bg-accent/10 text-accent',
	warning: 'border-warning/40 text-warning',
	error: 'border-transparent bg-mc-error-subtle text-mc-error-on-subtle rounded-[var(--mc-r-full)]',
};

export function McBadge({
	variant = 'neutral',
	className = '',
	children,
	...props
}: HTMLAttributes<HTMLSpanElement> & {
	variant?: McBadgeVariant;
	children: ReactNode;
}) {
	return (
		<span
			className={`inline-flex min-h-6 items-center rounded-[var(--mc-r-xs)] border px-2 py-0.5 text-[0.75rem] font-bold leading-none ${variantClass[variant]} ${className}`}
			{...props}
		>
			{children}
		</span>
	);
}
