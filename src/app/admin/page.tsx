import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminLink } from '@/components/admin/AdminPrimitives';
import { adminDate, excerpt, relativeTime } from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { INQUIRY_TYPE_LABELS } from '@/features/inquiries/constants';
import { countFailedNotifications, getAdminOverviewStats } from '@/services/adminDashboardService';
import { listInquiries } from '@/services/inquiryService';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
	const [stats, recent, failedNotifications] = await Promise.all([
		getAdminOverviewStats(),
		listInquiries({ status: 'NEW', page: 1, limit: 5 }),
		countFailedNotifications(),
	]);
	const waiting = stats.website.newInquiries;

	return (
		<div className={styles.page}>
			<AdminPageHeader
				title="Tổng quan"
				description="Việc cần xử lý trên website và lối vào không gian giảng dạy."
			/>
			<div className={styles.stack}>
				{failedNotifications > 0 ? (
					<section className={styles.alert}>
						<p className="inline-flex items-center gap-2 font-semibold">
							<AdminIcon name="warning" size={18} />
							{failedNotifications.toLocaleString('vi-VN')} thông báo liên hệ gửi thất bại
						</p>
						<AdminLink href={`${routes.admin.inquiries}?notice=failed`} tone="secondary">
							Xem thông báo lỗi
						</AdminLink>
					</section>
				) : null}
				<section className={styles.panel} aria-labelledby="waiting-inquiries">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 id="waiting-inquiries" className={styles.sectionTitle}>
								Liên hệ chờ xử lý
							</h2>
							<p className={styles.statValue}>{waiting.toLocaleString('vi-VN')}</p>
							<p className={styles.meta}>
								{waiting ? 'Lời nhắn mới nhất đang chờ xem.' : 'Không có liên hệ mới cần xem.'}
							</p>
						</div>
						<AdminLink href={`${routes.admin.inquiries}?status=NEW`} tone="primary" icon="inbox">
							Xem tất cả ({waiting.toLocaleString('vi-VN')})
						</AdminLink>
					</div>
					{recent.items.length ? (
						<div className={styles.queue}>
							{recent.items.map((item) => (
								<Link key={item.id} href={`${routes.admin.inquiries}/${item.id}`}>
									<span className="font-semibold">
										{item.name}
										<span className={styles.meta}>
											{' · '}
											{INQUIRY_TYPE_LABELS[item.inquiryType]}
										</span>
									</span>
									<span className={`${styles.meta} ${styles.excerpt}`}>
										{excerpt(item.context)}
									</span>
									<time
										dateTime={item.createdAt}
										title={adminDate(item.createdAt)}
										className={styles.meta}
									>
										{relativeTime(item.createdAt)}
									</time>
								</Link>
							))}
						</div>
					) : null}
				</section>
				<section className={styles.panel}>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h2 className={styles.sectionTitle}>Không gian giảng dạy</h2>
							<p className="text-muted">
								{stats.activeRecall.decks.toLocaleString('vi-VN')} bộ Active Recall ·{' '}
								{stats.activeRecall.published.toLocaleString('vi-VN')} đang công khai
							</p>
							<p className={`${styles.meta} mt-2`}>
								Quản lý môn học, lớp và nội dung ôn tập trong Teaching.
							</p>
						</div>
						<AdminLink href={routes.mySpaceTeaching} icon="teaching">
							Mở Teaching
						</AdminLink>
					</div>
				</section>
			</div>
		</div>
	);
}
