import Link from 'next/link';
import type { ReactNode } from 'react';
import { McIcon } from './McIcon';

export function McAppHeader({
	href,
	title,
	meta,
	actions,
	back = false,
}: {
	href: string;
	title: string;
	meta?: ReactNode;
	actions?: ReactNode;
	back?: boolean;
}) {
	return (
		<header className="sticky top-0 z-40 min-h-16 border-b border-mc-rule bg-paper shadow-[var(--mc-shadow-1)]">
			<div className="mc-app-container flex h-full items-center gap-3">
				<Link
					href={href}
					className="mc-focus-ring inline-flex min-h-11 min-w-0 items-center gap-2 rounded-[var(--mc-r-xs)]"
				>
					{back ? <McIcon name="arrow_back" size={22} className="shrink-0 text-ink" /> : null}
					<span className="flex min-w-0 flex-col justify-center">
						<span className="block truncate text-xl font-semibold leading-7 text-ink">{title}</span>
						{meta ? <span className="mc-meta mt-0.5 block truncate">{meta}</span> : null}
					</span>
				</Link>
				{actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
			</div>
		</header>
	);
}

export function McPageHeader({
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
		<header
			className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}
		>
			<div className="min-w-0 max-w-3xl">
				{eyebrow ? <p className="mc-eyebrow text-accent">{eyebrow}</p> : null}
				{typeof title === 'string' ? <h1 className="mc-title mt-2">{title}</h1> : title}
				{description ? (
					<div className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
						{description}
					</div>
				) : null}
			</div>
			{actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}
