import { cn } from '@/lib/cn';

interface CardProps {
	children: React.ReactNode;
	className?: string;
	elevated?: boolean;
}

export default function Card({ children, className, elevated }: CardProps) {
	return (
		<div
			className={cn(
				'rounded-2xl border border-border p-5 shadow-sm',
				elevated ? 'bg-surface-elevated' : 'bg-surface',
				className,
			)}
		>
			{children}
		</div>
	);
}

interface PanelProps {
	title?: string;
	description?: string;
	children?: React.ReactNode;
	className?: string;
}

export function Panel({ title, description, children, className }: PanelProps) {
	return (
		<section className={cn('space-y-4', className)}>
			{(title || description) && (
				<header>
					{title ? <h2 className="font-display text-lg font-semibold text-ink">{title}</h2> : null}
					{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
				</header>
			)}
			{children}
		</section>
	);
}
