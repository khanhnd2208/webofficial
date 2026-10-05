import styles from '@/components/admin/AdminStudio.module.css';
export default function AdminLoading() {
	return (
		<div className={styles.page} aria-busy="true" aria-label="Đang tải khu vực quản trị">
			<div className={styles.stack}>
				<div className={`${styles.skeleton} w-48`} />
				<div className={`${styles.skeleton} !h-40`} />
				<div className={styles.grid}>
					{[1, 2, 3].map((i) => (
						<div key={i} className={`${styles.skeleton} !h-32`} />
					))}
				</div>
				<div className={`${styles.skeleton} !h-64`} />
			</div>
		</div>
	);
}
