import type { HTMLAttributes, ReactNode } from 'react';

type McSectionProps = HTMLAttributes<HTMLElement> & {
	eyebrow?: string;
	title: ReactNode;
	titleId?: string;
	meta?: ReactNode;
	children?: ReactNode;
};

/** Labeled band: eyebrow + title + optional trailing meta. No box. */
export function McSection({
	eyebrow,
	title,
	titleId,
	meta,
	children,
	className = '',
	...props
}: McSectionProps) {
	return (
		<section className={`border-t border-mc-rule pt-6 ${className}`} {...props}>
			<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div className="min-w-0">
					{eyebrow ? <p className="mc-eyebrow">{eyebrow}</p> : null}
					{typeof title === 'string' ? (
						<h2
							id={titleId}
							className={`mc-title text-[clamp(1.35rem,2.2vw,1.75rem)] ${eyebrow ? 'mt-1' : ''}`}
						>
							{title}
						</h2>
					) : (
						<div id={titleId} className={eyebrow ? 'mt-1' : ''}>
							{title}
						</div>
					)}
				</div>
				{meta ? <div className="mc-meta shrink-0">{meta}</div> : null}
			</div>
			{children}
		</section>
	);
}
