import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStat } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { feedbackSummary, RATING_LABELS } from '@/features/unreleased-gift/domain/report';
import { listFeedback } from '@/features/unreleased-gift/services/feedbackService';

export const dynamic = 'force-dynamic';

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
	timeZone: 'Asia/Ho_Chi_Minh',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
});

export default async function UnreleasedGiftAdminPage() {
	const rows = await listFeedback();
	const summary = feedbackSummary(rows);
	const average = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)}/10`);

	return (
		<div className={`${styles.page} ${styles.wide}`}>
			<AdminPageHeader
				title="Đánh giá UNRELEASED"
				description="Ba điểm số và nhận xét ẩn danh sau workshop. Không lưu tên, email hay IP."
				actions={
					<>
						<a
							href={routes.admin.unreleasedGiftExport}
							className={`${styles.button} ${styles.secondary}`}
						>
							Tải CSV
						</a>
						<a
							href={routes.unreleasedGift}
							target="_blank"
							rel="noopener noreferrer"
							className={`${styles.button} ${styles.quiet}`}
						>
							Mở khảo sát
						</a>
					</>
				}
			/>

			{summary.count === 0 ? (
				<div className="mt-8">
					<AdminEmptyState
						icon="analytics"
						title="Chưa có đánh giá"
						description="Điểm số và nhận xét sẽ hiện ở đây khi người đầu tiên hoàn thành khảo sát."
					/>
				</div>
			) : (
				<>
					<section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Tổng quan">
						<AdminStat
							label="Lượt đánh giá"
							value={String(summary.count)}
							note="Tổng số phản hồi"
						/>
						{(Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[]).map((key) => (
							<AdminStat
								key={key}
								label={RATING_LABELS[key]}
								value={average(summary.averages[key])}
								note="Điểm trung bình"
							/>
						))}
					</section>

					<section className="mt-10">
						<h2 className={styles.sectionTitle}>Nhận xét gần nhất</h2>
						<p className="mt-1 text-sm text-muted">
							{summary.comments} đánh giá có nhận xét; tải CSV để xem toàn bộ.
						</p>
						<div className="mt-4 grid gap-4 lg:grid-cols-2">
							{rows.slice(0, 50).map((row) => (
								<article key={row.id} className={styles.panel}>
									<p className={styles.meta}>{timeFormatter.format(row.createdAt)}</p>
									<p className="mt-2 text-sm font-semibold tabular-nums">
										Tổng quan {row.overall}/10 · Hữu ích {row.usefulness}/10 · Dễ hiểu {row.clarity}
										/10
									</p>
									<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
										{row.comment || 'Không để lại nhận xét.'}
									</p>
								</article>
							))}
						</div>
					</section>
				</>
			)}
		</div>
	);
}
