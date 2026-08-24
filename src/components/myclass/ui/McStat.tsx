import type { HTMLAttributes, ReactNode } from 'react';

export function McStat({
	label,
	value,
	hint,
	className = '',
	...props
}: HTMLAttributes<HTMLDivElement> & {
	label: string;
	value: ReactNode;
	hint?: string;
}) {
	return (
		<div className={`mc-surface p-4 ${className}`} {...props}>
			<p className="mc-eyebrow">{label}</p>
			<p className="mc-num mt-2 text-2xl font-bold text-ink">{value}</p>
			{hint ? <p className="mc-meta mt-1">{hint}</p> : null}
		</div>
	);
}
