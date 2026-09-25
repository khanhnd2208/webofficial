import { cn } from '@/features/spy-fall/lib/cn';

interface TicketCardProps {
	title?: string;
	code: string;
	subtitle?: string;
	children?: React.ReactNode;
	className?: string;
}

export default function TicketCard({ title, code, subtitle, children, className }: TicketCardProps) {
	return (
		<div
			className={cn(
				'ticket-notch relative overflow-hidden rounded-2xl border-2 border-dashed border-border-strong bg-surface-elevated shadow-md',
				className,
			)}
		>
			<div className="border-b border-dashed border-border px-5 py-4">
				{title ? (
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Boarding Pass</p>
				) : null}
				{title ? <p className="mt-1 font-display text-lg font-semibold text-ink">{title}</p> : null}
				{subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
			</div>
			<div className="px-5 py-6 text-center">
				<p className="text-xs uppercase tracking-widest text-muted">Mã nhiệm vụ</p>
				<p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-ink">{code}</p>
			</div>
			{children ? <div className="border-t border-dashed border-border px-5 py-4">{children}</div> : null}
		</div>
	);
}
