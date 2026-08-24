import type { ReactNode } from 'react';

export function McEmpty({
	title,
	description,
	action,
	className = '',
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-[var(--mc-r-md)] border border-dashed border-mc-rule bg-paper px-6 py-10 text-center ${className}`}
		>
			<p className="mc-h3">{title}</p>
			{description ? <p className="mc-meta mt-2">{description}</p> : null}
			{action ? <div className="mt-5 flex justify-center">{action}</div> : null}
		</div>
	);
}
