import type { ButtonHTMLAttributes, ReactNode } from 'react';

type StudioButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
type StudioButtonSize = 'sm' | 'md';

const variantClass: Record<StudioButtonVariant, string> = {
	primary: 'bg-ink text-paper hover:bg-inverse-surface border border-transparent',
	secondary: 'bg-transparent text-ink border border-mc-rule hover:bg-surface-sunken',
	danger: 'bg-transparent text-error border border-error/40 hover:bg-error-subtle',
	quiet:
		'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-sunken hover:text-ink',
};

const sizeClass: Record<StudioButtonSize, string> = {
	sm: 'min-h-9 px-3 text-xs',
	md: 'min-h-11 px-4 text-sm',
};

export function StudioButton({
	variant = 'primary',
	size = 'md',
	className = '',
	children,
	type = 'button',
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: StudioButtonVariant;
	size?: StudioButtonSize;
	children: ReactNode;
}) {
	return (
		<button
			type={type}
			className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-[var(--mc-r-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
