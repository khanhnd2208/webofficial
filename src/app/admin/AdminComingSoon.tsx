/**
 * Shared placeholder for admin surfaces not yet built in later phases.
 */

import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
			<AdminPageHeader
				eyebrow="Hệ thống"
				title={title}
				description={description}
				actions={
					<Link
						href={backHref}
						className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground"
					>
						{backLabel}
					</Link>
				}
			/>
			<div className="mt-8">
				<AdminEmptyState
					title="Chưa mở"
					description="Đang chuẩn bị trong giai đoạn tiếp theo của tái cấu trúc Duy Khánh."
				/>
			</div>
		</div>
	);
}
