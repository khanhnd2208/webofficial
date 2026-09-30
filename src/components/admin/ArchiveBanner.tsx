import styles from './AdminStudio.module.css';
import Link from 'next/link';

import { routes } from '@/config/routes';

export function ArchiveBanner() {
	return (
		<div className={styles.archive} data-testid="archive-banner" role="status">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p>
					<strong className="font-semibold">Đã lưu trữ.</strong> Module này không còn nằm trong
					luồng làm việc hằng ngày. Dữ liệu vẫn còn và có thể dùng đầy đủ từ Kho lưu trữ.
				</p>
				<Link
					href={routes.admin.home}
					className={`${styles.button} ${styles.secondary}`}
					data-testid="archive-back-to-admin"
				>
					Về admin chính
				</Link>
			</div>
		</div>
	);
}
