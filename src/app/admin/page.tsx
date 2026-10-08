import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminCard, AdminLink } from '@/components/admin/AdminPrimitives';
import { adminDate, excerpt, relativeTime } from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { INQUIRY_TYPE_LABELS } from '@/features/inquiries/constants';
import {
	countFailedNotifications,
	getAdminOverviewStats,
	listActiveClasses,
} from '@/services/adminDashboardService';
import { listInquiries } from '@/services/inquiryService';

export const dynamic = 'force-dynamic';

const vi = (value: number) => value.toLocaleString('vi-VN');

export default async function AdminHomePage() {
	const [stats, recent, failedNotifications, classes] = await Promise.all([
		getAdminOverviewStats(),
		listInquiries({ status: 'NEW', page: 1, limit: 5 }),
		countFailedNotifications(),
		listActiveClasses(),
	]);
	const waiting = stats.website.newInquiries;

	return (
		<div className={styles.page}>
			<AdminPageHeader title="Tổng quan" />
			<div className={styles.stack}>
				{failedNotifications > 0 ? (
					<section className={styles.alert}>
						<p className="inline-flex items-center gap-2 font-semibold">
							<AdminIcon name="warning" size={18} />
							{vi(failedNotifications)} thông báo liên hệ gửi thất bại
						</p>
						<AdminLink href={`${routes.admin.inquiries}?notice=failed`} tone="secondary">
							Xem thông báo lỗi
						</AdminLink>
					</section>
				) : null}
				<div className={styles.overview}>
					<AdminCard
						title="Liên hệ mới"
						count={waiting}
						action={{ href: `${routes.admin.inquiries}?status=NEW`, label: 'Xem tất cả' }}
					>
						{recent.items.length ? (
							<ul className={styles.cardRows}>
								{recent.items.map((item) => (
									<li key={item.id}>
										<Link
											href={`${routes.admin.inquiries}/${item.id}?status=NEW`}
											className={styles.cardRow}
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate font-semibold">
													{item.name}
													{item.inquiryType !== 'other' ? (
														<span className={`${styles.meta} font-normal`}>
															{' · '}
															{INQUIRY_TYPE_LABELS[item.inquiryType]}
														</span>
													) : null}
												</span>
												<span className={`${styles.meta} block truncate`}>
													{excerpt(item.context)}
												</span>
											</span>
											<time
												dateTime={item.createdAt}
												title={adminDate(item.createdAt)}
												className={`${styles.meta} shrink-0`}
											>
												{relativeTime(item.createdAt)}
											</time>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<p className={styles.cardEmpty}>Không có liên hệ mới.</p>
						)}
					</AdminCard>
					<AdminCard
						title="Lớp đang dạy"
						count={classes.length}
						action={{ href: routes.mySpaceTeaching, label: 'Tất cả lớp' }}
						footer={
							<>
								Active Recall: {vi(stats.activeRecall.decks)} bộ ·{' '}
								{vi(stats.activeRecall.published)} công khai
							</>
						}
					>
						{classes.length ? (
							<ul className={styles.cardRows}>
								{classes.map((row) => (
									<li key={row.id} className="flex items-center">
										<Link
											href={routes.mySpaceTeachingClass(row.id)}
											className={`${styles.cardRow} flex-1`}
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate font-semibold">{row.courseName}</span>
												<span className={`${styles.meta} block truncate`}>
													{row.courseCode} · {row.classCode || `Nhóm ${row.groupNo}`} · {row.term}
												</span>
											</span>
											<span className={`${styles.meta} shrink-0 tabular-nums`}>
												{vi(row.students)} SV
											</span>
										</Link>
										{row.sharedSlug ? (
											<Link
												href={routes.teachingPublicClass(row.sharedSlug)}
												target="_blank"
												rel="noopener noreferrer"
												className={`${styles.cardAction} inline-flex shrink-0 items-center gap-1 pr-4`}
											>
												Trang lớp
												<AdminIcon name="external" size={14} />
												<span className="sr-only"> của {row.courseName} (mở tab mới)</span>
											</Link>
										) : null}
									</li>
								))}
							</ul>
						) : (
							<p className={styles.cardEmpty}>Chưa có lớp đang hoạt động.</p>
						)}
					</AdminCard>
				</div>
			</div>
		</div>
	);
}
