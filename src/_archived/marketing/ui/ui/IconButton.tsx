import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	label: string;
	children: ReactNode;
	size?: 'sm' | 'md';
};

const sizeClass = {
	sm: 'h-10 w-10',
	md: 'h-11 w-11',
};

export function IconButton({
	label,
	children,
	size = 'md',
	className = '',
	type = 'button',
	...props
}: IconButtonProps) {
	return (
		<button
			type={type}
			aria-label={label}
			title={label}
			className={`inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${sizeClass[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
