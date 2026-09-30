import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminBadge, AdminLink } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = [
	{ href: routes.home, label: 'Trang mở đầu', description: 'Màn hình “Trở thành” trước mục lục.' },
	{ href: routes.toc, label: 'Mục lục', description: 'Cổng Giới thiệu và Trải nghiệm.' },
	{ href: routes.about, label: 'Giới thiệu', description: 'Học quản trị và tìm cố vấn.' },
	{
		href: routes.experiences,
		label: 'Trải nghiệm',
		description: 'Dự án, thử nghiệm và câu chuyện có ảnh.',
	},
	{ href: routes.contact, label: 'Liên hệ', description: 'Biểu mẫu gửi lời nhắn công khai.' },
	{ href: routes.mySpace, label: 'My Space', description: 'Cổng vào Teaching.' },
] as const;

export default function AdminWebsitePage() {
	return (
		<div className={styles.page}>
			<AdminPageHeader
				eyebrow="Admin Studio"
				title="Website"
				description="Xem các trang đang hoạt động và mở công cụ quản lý nội dung."
				breadcrumbs={resolveAdminRoute(routes.admin.website).breadcrumbs}
			/>
			<div className={styles.stack}>
				<section>
					<h2 className={styles.sectionTitle}>Trang công khai</h2>
					<p className="mb-4 text-sm text-muted">
						Các trang dưới đây hỗ trợ xem. Nội dung giới thiệu hiện chưa có trình sửa trong Admin.
					</p>
					<div className={styles.list}>
						{PUBLIC_PAGES.map((page) => (
							<div key={page.href} className={`${styles.row} flex-wrap`}>
								<span className={styles.iconTile}>
									<AdminIcon name="website" />
								</span>
								<div className={styles.rowBody}>
									<h3 className="font-semibold">{page.label}</h3>
									<p className={`${styles.meta} mt-1`}>{page.description}</p>
								</div>
								<AdminLink href={page.href} external icon="external">
									Xem trang
								</AdminLink>
							</div>
						))}
					</div>
				</section>
				<section>
					<h2 className={styles.sectionTitle}>Quản lý nội dung</h2>
					<div className={styles.panel}>
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h3 className="font-semibold">Câu chuyện và ảnh trong Trải nghiệm</h3>
								<div className="mt-2">
									<AdminBadge>Trong Kho lưu trữ</AdminBadge>
								</div>
								<p className={`${styles.meta} mt-2`}>
									Trình quản lý bài viết hiện có mở trong không gian lưu trữ.
								</p>
							</div>
							<AdminLink href={routes.admin.posts} icon="archive">
								Quản lý nội dung
							</AdminLink>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
