import type { HTMLAttributes, ReactNode } from 'react';

type McPanelProps = HTMLAttributes<HTMLElement> & {
	as?: 'div' | 'article' | 'section' | 'li';
	children: ReactNode;
};

/** Product surface for one independent task or object. Avoid nesting panels. */
export function McPanel({ as: Tag = 'div', className = '', children, ...props }: McPanelProps) {
	return (
		<Tag className={`mc-surface ${className}`} {...props}>
			{children}
		</Tag>
	);
}

/** @deprecated Use McPanel. Kept as alias during migration. */
export const McCard = McPanel;
