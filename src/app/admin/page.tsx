import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';
import { AdminLink } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import { getAdminOverviewStats } from '@/services/adminDashboardService';
import { routes } from '@/config/routes';
export const dynamic = 'force-dynamic';
const shortcuts: { href: string; label: string; description: string; icon: AdminIconName }[] = [
	{
		href: routes.admin.website,
		label: 'Website',
		description: 'Xem các trang và mở công cụ quản lý nội dung.',
		icon: 'website',
	},
	{
		href: routes.admin.inquiries,
		label: 'Hộp thư liên hệ',
		description: 'Đọc lời nhắn và theo dõi quá trình trao đổi.',
		icon: 'inbox',
	},
	{
		href: routes.admin.learnAnalytics,
		label: 'Thống kê học tập',
		description: 'Xem lượt học, tiến độ và thời gian tương tác.',
		icon: 'analytics',
	},
];
export default async function AdminHomePage() {
	const stats = await getAdminOverviewStats();
	return (
		<div className={styles.page}>
			<AdminPageHeader
				eyebrow="Admin Studio"
				title="Tổng quan"
				description="Quản lý website, theo dõi liên hệ và hoạt động học tập."
			/>
			<div className={styles.stack}>
				<section className={`${styles.panel} ${styles.hero}`} aria-labelledby="new-inquiries">
					<div>
						<p className={styles.meta}>Cần xem</p>
						<h2 id="new-inquiries" className="mt-1 font-semibold">
							Liên hệ mới
						</h2>
						<p className={styles.statValue}>{stats.website.newInquiries.toLocaleString('vi-VN')}</p>
						<p className={styles.meta}>
							{stats.website.newInquiries
								? 'Lời nhắn đang chờ bạn xem trong hộp thư.'
								: 'Không có liên hệ mới cần xem.'}
						</p>
					</div>
					<AdminLink href={`${routes.admin.inquiries}?status=NEW`} tone="primary" icon="inbox">
						Xem liên hệ mới
					</AdminLink>
				</section>
				<section aria-labelledby="shortcuts">
					<h2 id="shortcuts" className={styles.sectionTitle}>
						Thao tác nhanh
					</h2>
					<div className={styles.grid}>
						{shortcuts.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`${styles.panel} transition-colors hover:border-accent`}
							>
								<span className={styles.iconTile}>
									<AdminIcon name={item.icon} />
								</span>
								<h3 className="mt-4 font-semibold">
									{item.label} <span aria-hidden="true">→</span>
								</h3>
								<p className={`${styles.meta} mt-2`}>{item.description}</p>
							</Link>
						))}
					</div>
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
