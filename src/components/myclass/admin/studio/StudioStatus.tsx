import type { ReactNode } from 'react';

const STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Bản nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Đã lưu trữ',
	ACTIVE: 'Đang hoạt động',
	PENDING: 'Chờ xử lý',
	REMOVED: 'Đã gỡ',
};

const STATUS_CLASS: Record<string, string> = {
	PUBLISHED: 'border-mc-done/30 bg-mc-done-subtle text-mc-done',
	ACTIVE: 'border-mc-done/30 bg-mc-done-subtle text-mc-done',
	DRAFT: 'border-mc-rule bg-surface-sunken text-ink-secondary',
	PENDING: 'border-warning/30 text-warning',
	ARCHIVED: 'border-mc-rule text-ink-tertiary',
	REMOVED: 'border-error/30 text-error',
};

export function StudioStatus({ status, children }: { status: string; children?: ReactNode }) {
	return (
		<span
			className={`inline-flex min-h-6 items-center rounded-[var(--mc-r-sm)] border px-2 text-xs font-semibold ${STATUS_CLASS[status] ?? STATUS_CLASS.DRAFT}`}
		>
			{children ?? STATUS_LABEL[status] ?? status}
		</span>
	);
}

export function StudioActionBar({ status, actions }: { status: ReactNode; actions: ReactNode }) {
	return (
		<div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-mc-rule bg-paper/95 px-1 py-3 backdrop-blur">
			<div className="text-sm text-ink-secondary">{status}</div>
			<div className="flex flex-wrap items-center gap-2">{actions}</div>
		</div>
	);
}

export function StudioInspector({
	title,
	children,
	className = '',
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<aside className={`rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-4 ${className}`}>
			<h2 className="text-sm font-bold text-ink">{title}</h2>
			<div className="mt-4 space-y-4">{children}</div>
		</aside>
	);
}
