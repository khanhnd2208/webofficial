import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
	primary:
		'bg-foreground text-background hover:bg-foreground-secondary border border-transparent',
	secondary:
		'bg-surface text-foreground border border-border-strong hover:bg-surface-hover',
	ghost: 'bg-transparent text-foreground border border-transparent hover:bg-surface-hover',
	danger: 'bg-error text-accent-foreground border border-transparent hover:opacity-90',
};

const sizeClass: Record<ButtonSize, string> = {
	sm: 'min-h-10 px-3 text-xs',
	md: 'min-h-11 px-5 text-sm',
	lg: 'min-h-12 px-6 text-sm',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	children: ReactNode;
};

export function Button({
	variant = 'primary',
	size = 'md',
	loading = false,
	disabled,
	className = '',
	children,
	type = 'button',
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
			{...props}
		>
			{loading ? <span className="sr-only">Đang xử lý</span> : null}
			{children}
		</button>
	);
}
