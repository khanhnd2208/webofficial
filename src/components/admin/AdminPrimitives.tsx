import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AdminIcon, type AdminIconName } from './AdminIcon';
import styles from './AdminStudio.module.css';

export function AdminButton({
	tone = 'primary',
	icon,
	pending,
	children,
	className = '',
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
	icon?: AdminIconName;
	pending?: boolean;
}) {
	return (
		<button
			{...props}
			disabled={props.disabled || pending}
			aria-busy={pending || undefined}
			className={`${styles.button} ${styles[tone]} ${className}`}
		>
			{icon && <AdminIcon name={icon} size={18} />}
			{children}
		</button>
	);
}
export function AdminLink({
	href,
	children,
	icon,
	tone = 'secondary',
	external = false,
}: {
	href: string;
	children: ReactNode;
	icon?: AdminIconName;
	tone?: 'primary' | 'secondary' | 'quiet';
	external?: boolean;
}) {
	return (
		<Link
			href={href}
			className={`${styles.button} ${styles[tone]}`}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
		>
			{icon && <AdminIcon name={icon} size={18} />}
			{children}
			{external && <span className="sr-only"> (mở tab mới)</span>}
		</Link>
	);
}
export function AdminBadge({
	children,
	tone = 'neutral',
}: {
	children: ReactNode;
	tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
	return (
		<span className={styles.badge} data-tone={tone}>
			{children}
		</span>
	);
}
export function AdminStat({
	label,
	value,
	note,
}: {
	label: string;
	value: ReactNode;
	note: string;
}) {
	return (
		<div className={styles.panel}>
			<p className={styles.meta}>{label}</p>
			<p className={styles.statValue}>{value}</p>
			<p className={styles.meta}>{note}</p>
		</div>
	);
}
export function AdminPagination({
	page,
	totalPages,
	previous,
	next,
}: {
	page: number;
	totalPages: number;
	previous?: string;
	next?: string;
}) {
	return (
		<nav aria-label="Phân trang" className={styles.pagination}>
			<span className={styles.meta}>
				Trang {page}/{totalPages}
			</span>
			<div className="flex gap-2">
				{previous && (
					<AdminLink href={previous} icon="back">
						Trước
					</AdminLink>
				)}
				{next && <AdminLink href={next}>Sau →</AdminLink>}
			</div>
		</nav>
	);
}
