import Link from 'next/link';

import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES: {
	href: string;
	label: string;
	description: string;
	/** Editor for this page's content, when one exists (archived modules included). */
	manage?: { href: string; label: string };
}[] = [
	{ href: routes.home, label: 'Trang mở đầu', description: 'Màn hình “Trở thành” trước mục lục.' },
	{ href: routes.toc, label: 'Mục lục', description: 'Cổng Giới thiệu và Trải nghiệm.' },
	{ href: routes.about, label: 'Giới thiệu', description: 'Học quản trị và tìm cố vấn.' },
	{
		href: routes.experiences,
		label: 'Trải nghiệm',
		description: 'Dự án, thử nghiệm và câu chuyện có ảnh.',
		manage: { href: routes.admin.posts, label: 'Sửa bài viết (lưu trữ)' },
	},
	{ href: routes.contact, label: 'Liên hệ', description: 'Biểu mẫu gửi lời nhắn công khai.' },
	{ href: routes.mySpace, label: 'My Space', description: 'Cổng vào Teaching.' },
];

export default function AdminWebsitePage() {
	return (
		<div className={styles.page}>
			<AdminPageHeader
				title="Trang công khai"
				description="Các trang đang mở cho khách. Trang chưa có trình sửa chỉ mở để xem."
			/>
			<div className={styles.tableWrap}>
				<table className={`${styles.table} ${styles.tableMedium}`}>
					<caption className="sr-only">Trang công khai</caption>
					<thead>
						<tr>
							<th scope="col">Trang</th>
							<th scope="col">Đường dẫn</th>
							<th scope="col">
								<span className="sr-only">Thao tác</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{PUBLIC_PAGES.map((page) => (
							<tr key={page.href}>
								<td>
									<p className="font-semibold">{page.label}</p>
									<p className={styles.meta}>{page.description}</p>
								</td>
								<td className={styles.meta}>
									<code>{page.href}</code>
								</td>
								<td>
									<div className="flex flex-wrap justify-end gap-4">
										{page.manage ? (
											<Link href={page.manage.href} className={styles.cardAction}>
												{page.manage.label}
											</Link>
										) : null}
										<Link
											href={page.href}
											target="_blank"
											rel="noopener noreferrer"
											className={`${styles.cardAction} inline-flex items-center gap-1`}
										>
											Xem
											<AdminIcon name="external" size={14} />
											<span className="sr-only"> {page.label} (mở tab mới)</span>
										</Link>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
