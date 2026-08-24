import type { ButtonHTMLAttributes, ReactNode } from 'react';

type McButtonVariant = 'primary' | 'secondary' | 'quiet' | 'accent' | 'ghost';
type McButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<McButtonVariant, string> = {
	primary: 'bg-ink text-paper hover:bg-inverse-surface border border-transparent shadow-sm',
	secondary: 'bg-transparent text-ink border border-mc-rule hover:bg-surface-sunken',
	quiet:
		'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-sunken hover:text-ink',
	accent: 'bg-accent text-accent-foreground hover:bg-accent-hover border border-transparent',
	ghost: 'bg-transparent text-ink border border-transparent hover:bg-surface-sunken',
};

const sizeClass: Record<McButtonSize, string> = {
	sm: 'min-h-10 px-3 text-sm',
	md: 'min-h-11 px-4 text-sm',
	lg: 'min-h-12 px-6 text-sm',
};

export type McButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: McButtonVariant;
	size?: McButtonSize;
	loading?: boolean;
	children: ReactNode;
};

export function McButton({
	variant = 'primary',
	size = 'md',
	loading = false,
	disabled,
	className = '',
	children,
	type = 'button',
	...props
}: McButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-[var(--mc-r-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
			{...props}
		>
			{loading ? <span className="sr-only">Đang xử lý</span> : null}
			{children}
		</button>
	);
}
