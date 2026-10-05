import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';
import { AdminBadge, AdminLink } from '@/components/admin/AdminPrimitives';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import styles from '@/components/admin/AdminStudio.module.css';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES: {
	href: string;
	label: string;
	description: string;
	icon: AdminIconName;
	manage?: { href: string; label: string };
}[] = [
	{
		href: routes.home,
		label: 'Trang mở đầu',
		description: 'Màn hình “Trở thành” trước mục lục.',
		icon: 'home',
	},
	{
		href: routes.toc,
		label: 'Mục lục',
		description: 'Cổng Giới thiệu và Trải nghiệm.',
		icon: 'toc',
	},
	{
		href: routes.about,
		label: 'Giới thiệu',
		description: 'Học quản trị và tìm cố vấn.',
		icon: 'about',
	},
	{
		href: routes.experiences,
		label: 'Trải nghiệm',
		description: 'Dự án, thử nghiệm và câu chuyện có ảnh.',
		icon: 'story',
		manage: { href: routes.admin.posts, label: 'Quản lý câu chuyện' },
	},
	{
		href: routes.contact,
		label: 'Liên hệ',
		description: 'Biểu mẫu gửi lời nhắn công khai.',
		icon: 'contact',
	},
	{
		href: routes.mySpace,
		label: 'My Space',
		description: 'Cổng vào Teaching.',
		icon: 'space',
	},
];

export default function AdminWebsitePage() {
	return (
		<div className={styles.page}>
			<AdminPageHeader
				title="Website"
				description="Xem các trang đang hoạt động. Trang chưa có trình sửa chỉ mở để xem."
				breadcrumbs={resolveAdminRoute(routes.admin.website).breadcrumbs}
			/>
			<div className={styles.list}>
				{PUBLIC_PAGES.map((page) => (
					<div key={page.href} className={styles.row}>
						<span className={styles.iconTile}>
							<AdminIcon name={page.icon} />
						</span>
						<div className={styles.rowBody}>
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="font-semibold">{page.label}</h2>
								{page.manage ? (
									<AdminBadge>Trong Kho lưu trữ</AdminBadge>
								) : (
									<AdminBadge>Chỉ xem</AdminBadge>
								)}
							</div>
							<p className={`${styles.meta} mt-1`}>{page.description}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{page.manage ? (
								<AdminLink href={page.manage.href} icon="archive">
									{page.manage.label}
								</AdminLink>
							) : null}
							<AdminLink href={page.href} external icon="external">
								Xem trang
							</AdminLink>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
