import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { AdminBoothPanel } from '@/features/fmt2026/components/AdminBoothPanel';
import { getAdminOverview } from '@/features/fmt2026/services/drawService';

export const dynamic = 'force-dynamic';

export default async function Fmt2026AdminPage() {
	const overview = await getAdminOverview();

	return (
		<div className={`${styles.page} ${styles.wide}`}>
			<AdminPageHeader
				title="Quầy quà FMT 2026"
				description="Kho quà, tổng lượt và mã PIN cho máy ở booth. Chỉ lưu thời gian và món quà của từng lượt."
				actions={
					<a
						href={routes.fmt2026}
						target="_blank"
						rel="noopener noreferrer"
						className={`${styles.button} ${styles.quiet}`}
					>
						Mở trang quay
					</a>
				}
			/>
			<AdminBoothPanel initial={overview} />
		</div>
	);
}
