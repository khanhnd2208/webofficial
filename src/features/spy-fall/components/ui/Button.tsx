import { cn } from '@/features/spy-fall/lib/cn';

import Spinner from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-accent-foreground hover:bg-accent-hover active:scale-[0.98]',
	secondary: 'border border-border bg-surface text-foreground hover:bg-surface-hover active:scale-[0.98]',
	tertiary: 'bg-surface-secondary text-foreground hover:bg-surface-hover',
	destructive: 'bg-danger text-danger-foreground hover:opacity-90 active:scale-[0.98]',
	ghost: 'text-foreground-secondary hover:bg-surface-hover',
	success: 'bg-success text-success-foreground hover:opacity-90 active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'min-h-9 px-3 text-sm rounded-lg',
	md: 'min-h-11 px-4 text-sm rounded-xl',
	lg: 'min-h-12 px-5 text-base rounded-xl font-semibold',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	fullWidth?: boolean;
}

export default function Button({
	variant = 'primary',
	size = 'lg',
	loading,
	fullWidth,
	className,
	children,
	disabled,
	type = 'button',
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={cn(
				'inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,opacity] duration-[var(--dur-fast)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
				variantClasses[variant],
				sizeClasses[size],
				fullWidth && 'w-full',
				className,
			)}
			{...props}
		>
			{loading ? <Spinner size="sm" /> : null}
			{children}
		</button>
	);
}
