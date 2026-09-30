import Link from 'next/link';
import { AdminIcon, type AdminIconName } from './AdminIcon';
import styles from './AdminStudio.module.css';
import type { ReactNode } from 'react';

export function AdminPageHeader({
	eyebrow,
	title,
	description,
	actions,
	breadcrumbs,
}: {
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
	breadcrumbs?: { label: string; href: string }[];
}) {
	return (
		<header className={styles.header}>
			<div className="min-w-0">
				{breadcrumbs?.length ? (
					<nav aria-label="Đường dẫn" className={styles.breadcrumb}>
						{breadcrumbs.map((item) => (
							<span key={item.href}>
								<Link href={item.href}>{item.label}</Link>
								<span aria-hidden="true"> / </span>
							</span>
						))}
						<span aria-current="page">{title}</span>
					</nav>
				) : null}
				{eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
				<h1 className={styles.title}>{title}</h1>
				{description ? <div className={styles.description}>{description}</div> : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}

export function AdminEmptyState({
	title,
	description,
	action,
	icon = 'inbox',
}: {
	title: string;
	description?: string;
	action?: { href: string; label: string };
	icon?: AdminIconName;
}) {
	return (
		<div className={styles.empty}>
			<AdminIcon name={icon} size={32} />
			<p className="text-lg font-semibold text-foreground">{title}</p>
			{description ? <p className="mt-2 text-sm text-foreground-secondary">{description}</p> : null}
			{action ? (
				<Link href={action.href} className={`${styles.button} ${styles.primary} mt-6`}>
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
