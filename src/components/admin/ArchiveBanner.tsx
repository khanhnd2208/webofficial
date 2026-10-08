import styles from './AdminStudio.module.css';
import Link from 'next/link';

import { routes } from '@/config/routes';

export function ArchiveBanner() {
	return (
		<div className={styles.archive} data-testid="archive-banner" role="status">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p>
					<strong className="font-semibold">Đã lưu trữ.</strong> Mục này đã ngừng dùng hằng ngày; dữ
					liệu vẫn còn và vẫn chỉnh sửa được.
				</p>
				<Link
					href={routes.admin.home}
					className={`${styles.button} ${styles.secondary}`}
					data-testid="archive-back-to-admin"
				>
					Về Tổng quan
				</Link>
			</div>
		</div>
	);
}
