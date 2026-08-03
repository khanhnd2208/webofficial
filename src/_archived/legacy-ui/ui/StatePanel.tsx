import type { ReactNode } from 'react';

import { Button } from './Button';

type StatePanelProps = {
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	actionHref?: string;
	children?: ReactNode;
	tone?: 'neutral' | 'error' | 'empty';
};

export function StatePanel({
	title,
	description,
	actionLabel,
	onAction,
	actionHref,
	children,
	tone = 'neutral',
}: StatePanelProps) {
	const border =
		tone === 'error'
			? 'border-error/40'
			: tone === 'empty'
				? 'border-dashed border-border'
				: 'border-border';

	return (
		<div className={`rounded-lg border ${border} bg-surface px-6 py-10 text-center`}>
			<h2 className="text-lg font-semibold text-foreground">{title}</h2>
			{description ? <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">{description}</p> : null}
			{children}
			{(actionLabel && onAction) || (actionLabel && actionHref) ? (
				<div className="mt-6">
					{onAction ? (
						<Button type="button" onClick={onAction} variant={tone === 'error' ? 'primary' : 'secondary'}>
							{actionLabel}
						</Button>
					) : actionHref ? (
						<a
							href={actionHref}
							className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-hover"
						>
							{actionLabel}
						</a>
					) : null}
				</div>
			) : null}
		</div>
	);
}
