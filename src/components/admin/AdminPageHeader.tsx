import Link from 'next/link';
import type { ReactNode } from 'react';

export function AdminPageHeader({
	eyebrow,
	title,
	description,
	actions,
}: {
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<header className="flex flex-wrap items-start justify-between gap-4">
			<div className="min-w-0">
				{eyebrow ? (
					<p className="text-xs font-bold uppercase tracking-widest text-muted">{eyebrow}</p>
				) : null}
				<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{title}</h1>
				{description ? (
					<div className="mt-1.5 text-sm text-foreground-secondary">{description}</div>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}

export function AdminEmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: { href: string; label: string };
}) {
	return (
		<div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
			<p className="text-lg font-semibold text-foreground">{title}</p>
			{description ? <p className="mt-2 text-sm text-foreground-secondary">{description}</p> : null}
			{action ? (
				<Link
					href={action.href}
					className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
				>
					{action.label}
				</Link>
			) : null}
		</div>
	);
}

export function AdminErrorState({
	title = 'Không tải được dữ liệu',
	description,
	requestId,
	onRetry,
}: {
	title?: string;
	description?: string;
	requestId?: string;
	onRetry?: () => void;
}) {
	return (
		<div role="alert" className="rounded-xl border border-error/40 bg-error-subtle px-5 py-4">
			<p className="font-semibold text-foreground">{title}</p>
			{description ? <p className="mt-1 text-sm text-foreground-secondary">{description}</p> : null}
			{requestId ? <p className="mt-2 text-xs text-muted">Mã đối chiếu: {requestId}</p> : null}
			{onRetry ? (
				<button
					type="button"
					onClick={onRetry}
					className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold"
				>
					Thử lại
				</button>
			) : null}
		</div>
	);
}
