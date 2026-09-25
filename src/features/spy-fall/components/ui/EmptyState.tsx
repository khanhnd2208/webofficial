import Button from './Button';

interface EmptyStateProps {
	icon?: string;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

export default function EmptyState({
	icon = '📭',
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	return (
		<div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
			<div className="text-4xl" aria-hidden>
				{icon}
			</div>
			<h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
			<p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
			{actionLabel && onAction ? (
				<Button variant="secondary" size="md" className="mt-6" onClick={onAction}>
					{actionLabel}
				</Button>
			) : null}
		</div>
	);
}
