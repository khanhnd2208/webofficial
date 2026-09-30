import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { McIcon } from '@/components/myclass/ui/McIcon';
import { getArchivedModulesByGroup } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default function AdminArchivePage() {
	const groups = getArchivedModulesByGroup();

	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Kho lưu trữ"
				title="Kho lưu trữ"
				description="Các module tạm dừng. Mở một mục để dùng đầy đủ — luôn trong giao diện lưu trữ, không xuất hiện lại trên menu admin chính."
			/>

			<div className="mt-8 space-y-8">
				{groups.map(({ group, modules }) => (
					<section key={group}>
						<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">
							{group}
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							{modules.map((module) => (
								<Link
									key={module.id}
									href={module.adminHref}
									className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-hover"
								>
									<span className="mt-0.5 text-muted">
										<McIcon name={module.icon} size={18} />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-bold text-foreground">{module.label}</p>
										<p className="mt-1 text-sm text-muted">{module.description}</p>
									</div>
								</Link>
							))}
						</div>
					</section>
				))}
			</div>

			<p className="mt-10 text-sm text-muted">
				Quay lại{' '}
				<Link href={routes.admin.home} className="font-semibold text-foreground underline">
					admin chính
				</Link>{' '}
				khi xong việc với module cũ.
			</p>
		</div>
	);
}
