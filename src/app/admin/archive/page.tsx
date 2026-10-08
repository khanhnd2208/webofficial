import styles from '@/components/admin/AdminStudio.module.css';
import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getArchivedModulesByGroup } from '@/config/moduleRegistry';

export const dynamic = 'force-dynamic';

export default function AdminArchivePage() {
	const groups = getArchivedModulesByGroup();

	return (
		<div className={styles.page}>
			<AdminPageHeader
				title="Kho lưu trữ"
				description="Các mục đã ngừng dùng hằng ngày. Dữ liệu vẫn còn và vẫn mở được."
			/>

			<div className="space-y-8">
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
									<div className="min-w-0">
										<p className="font-semibold">{module.label}</p>
										<p className={styles.meta}>{module.description}</p>
									</div>
								</Link>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
