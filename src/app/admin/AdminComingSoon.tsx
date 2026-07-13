/**
 * Shared placeholder for admin surfaces not yet built in later phases.
 */

import Link from 'next/link';

import { routes } from '@/config/routes';

export function AdminComingSoon({
	title,
	description,
	backHref = routes.admin.home,
	backLabel = '← Tổng quan',
}: {
	title: string;
	description: string;
	backHref?: string;
	backLabel?: string;
}) {
	return (
		<div className="mx-auto max-w-3xl px-6 py-10">
			<Link href={backHref} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
				{backLabel}
			</Link>
			<h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">{title}</h1>
			<p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
			<p className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">
				Đang chuẩn bị trong giai đoạn tiếp theo của tái cấu trúc Duy Khánh.
			</p>
		</div>
	);
}
