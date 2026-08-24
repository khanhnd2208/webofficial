import type { ReactNode } from 'react';

export function StudioPageHeader({
	eyebrow,
	title,
	description,
	actions,
	className = '',
}: {
	eyebrow?: string;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<header className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
			<div className="min-w-0 max-w-2xl">
				{eyebrow ? <p className="mc-eyebrow">{eyebrow}</p> : null}
				{typeof title === 'string' ? (
					<h1 className={`mc-title text-[clamp(1.5rem,2.5vw,2rem)] ${eyebrow ? 'mt-1' : ''}`}>
						{title}
					</h1>
				) : (
					<div className={eyebrow ? 'mt-1' : ''}>{title}</div>
				)}
				{description ? <div className="mc-meta mt-2 max-w-prose">{description}</div> : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}
