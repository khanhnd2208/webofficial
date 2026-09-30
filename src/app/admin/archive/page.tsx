import { AdminBadge } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { McIcon } from '@/components/myclass/ui/McIcon';
import { getArchivedModulesByGroup } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default function AdminArchivePage() {
	const groups = getArchivedModulesByGroup();

	return (
		<div className={styles.page}>
			<AdminPageHeader
				eyebrow="Kho lưu trữ"
				title="Kho lưu trữ"
				description="Các module tạm dừng. Mở một mục để dùng đầy đủ — luôn trong giao diện lưu trữ, không xuất hiện lại trên menu admin chính."
			/>

			<div className="mt-8 space-y-8">
				{groups.map(({ group, modules }) => (
					<section key={group}>
						<h2 className={styles.sectionTitle}>{group}</h2>
						<div className={styles.list}>
							{modules.map((module) => (
								<Link
									key={module.id}
									href={module.adminHref}
									className={`${styles.row} hover:bg-surface-hover`}
								>
									<span className={styles.iconTile}>
										<McIcon name={module.icon} size={18} />
									</span>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-semibold">{module.label}</p>
											<AdminBadge>Đã lưu trữ</AdminBadge>
										</div>
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
