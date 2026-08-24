import type { HTMLAttributes, ReactNode } from 'react';

export function StudioPanel({
	className = '',
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
	return (
		<div className={`mc-surface ${className}`} {...props}>
			{children}
		</div>
	);
}

export function StudioToolbar({
	className = '',
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
	return (
		<div
			className={`flex flex-wrap items-center gap-2 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-3 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function StudioTable({
	className = '',
	children,
	...props
}: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
	return (
		<table className={`w-full text-sm ${className}`} {...props}>
			{children}
		</table>
	);
}
