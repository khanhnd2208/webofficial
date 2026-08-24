import type { HTMLAttributes, ReactNode } from 'react';

type McRowsProps = HTMLAttributes<HTMLElement> & {
	as?: 'ul' | 'ol' | 'div';
	children: ReactNode;
};

/** Hairline-divided list — the workhorse for scannable content. */
export function McRows({ as: Tag = 'ul', className = '', children, ...props }: McRowsProps) {
	return (
		<Tag
			className={`divide-y divide-mc-rule border-y border-mc-rule ${className}`}
			{...props}
		>
			{children}
		</Tag>
	);
}

type McRowProps = HTMLAttributes<HTMLElement> & {
	as?: 'li' | 'div' | 'a';
	active?: boolean;
	children: ReactNode;
};

/** Single row inside McRows. Hover sunken; active = left accent bar + weight. */
export function McRow({
	as: Tag = 'li',
	active = false,
	className = '',
	children,
	...props
}: McRowProps) {
	return (
		<Tag
			className={`relative flex min-h-10 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-sunken ${
				active ? 'bg-surface-container-highest font-semibold before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent' : ''
			} ${className}`}
			{...props}
		>
			{children}
		</Tag>
	);
}
