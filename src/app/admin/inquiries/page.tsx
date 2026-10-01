import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminButton, AdminLink } from '@/components/admin/AdminPrimitives';
import { InquiryBadge } from '@/components/admin/InquiryBadges';
import { InquiryStatusChips } from '@/components/admin/InquiryStatusChips';
import {
	adminDate,
	excerpt,
	inquiryListHref,
	inquiryQuery,
	relativeTime,
	type InquiryQuery,
} from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { routes } from '@/config/routes';
import {
	INQUIRY_TYPES,
	INQUIRY_TYPE_LABELS,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';
import { countInquiriesByStatus, listInquiries } from '@/services/inquiryService';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage({
	searchParams,
}: {
	searchParams?: Promise<InquiryQuery>;
}) {
	const sp = (await searchParams) ?? {};
	const normalized = new URLSearchParams(inquiryQuery(sp).slice(1));
	const requestedPage = Number(normalized.get('page') ?? 1);
	const status = (normalized.get('status') as InquiryStatus | null) ?? undefined;
	const inquiryType = (normalized.get('inquiryType') as InquiryType | null) ?? undefined;
	const search = normalized.get('search') ?? undefined;
	const failedNotification = normalized.get('notice') === 'failed';
	const filter = {
		status,
		inquiryType,
		search,
		...(failedNotification ? { failedNotification: true as const } : {}),
	};
	const [result, counts] = await Promise.all([
		listInquiries({ page: requestedPage, limit: 20, ...filter }),
		countInquiriesByStatus({ search, inquiryType, failedNotification }),
	]);
	if (requestedPage > result.totalPages) {
		redirect(inquiryListHref(sp, result.totalPages));
	}
	const page = requestedPage;
	const filtered = Boolean(status || inquiryType || search || failedNotification);
	const detailHref = (id: string) =>
		`${routes.admin.inquiries}/${encodeURIComponent(id)}${inquiryQuery(sp)}`;
	const emptyTitle =
		result.total > 0
			? 'Trang này không còn liên hệ'
			: filtered
				? 'Không tìm thấy liên hệ phù hợp'
				: 'Chưa có lời nhắn nào';
	const rangeStart = result.items.length ? (page - 1) * 20 + 1 : 0;
	const rangeEnd = result.items.length ? rangeStart + result.items.length - 1 : 0;
	const showNoticeColumn = result.items.some((item) => item.adminEmailStatus === 'failed');

	return (
		<div className={styles.page}>
			<AdminPageHeader
				title="Hộp thư liên hệ"
				description="Đọc lời nhắn và xử lý ngay trên danh sách."
				breadcrumbs={resolveAdminRoute(routes.admin.inquiries).breadcrumbs}
			/>
			<div className={styles.stack}>
				<InquiryStatusChips query={sp} counts={counts} />
				{failedNotification ? (
					<p className={styles.alert} role="status">
						<span className="font-semibold">Chỉ hiện liên hệ có thông báo gửi lỗi</span>
						<AdminLink href={inquiryListHref({ ...sp, notice: undefined }, 1)} tone="secondary">
							Bỏ lọc này
						</AdminLink>
					</p>
				) : null}
				<form className={styles.toolbar} method="get" action={routes.admin.inquiries}>
					{status ? <input type="hidden" name="status" value={status} /> : null}
					{failedNotification ? <input type="hidden" name="notice" value="failed" /> : null}
					<label className={styles.field}>
						Tìm kiếm
						<input
							name="search"
							defaultValue={search ?? ''}
							placeholder="Tên, email, tổ chức, nội dung"
							className={styles.control}
						/>
					</label>
					<label className={styles.field}>
						Chủ đề
						<select name="inquiryType" defaultValue={inquiryType ?? ''} className={styles.control}>
							<option value="">Mọi chủ đề</option>
							{INQUIRY_TYPES.map((type) => (
								<option key={type} value={type}>
									{INQUIRY_TYPE_LABELS[type]}
								</option>
							))}
						</select>
					</label>
					<AdminButton type="submit" icon="filter">
						Áp dụng
					</AdminButton>
					<AdminLink href={routes.admin.inquiries} tone="quiet">
						Xóa bộ lọc
					</AdminLink>
				</form>
				{result.items.length ? (
					<p className={styles.meta} role="status">
						Hiển thị {rangeStart}–{rangeEnd} trong {result.total} liên hệ
					</p>
				) : null}
				{!result.items.length ? (
					<AdminEmptyState
						title={emptyTitle}
						description={
							result.total > 0
								? 'Về trang đầu để tiếp tục xem danh sách.'
								: filtered
									? 'Thử thay đổi hoặc xóa bộ lọc.'
									: 'Lời nhắn từ biểu mẫu liên hệ sẽ xuất hiện ở đây.'
						}
						action={
							result.total > 0
								? { href: inquiryListHref(sp, 1), label: 'Về trang đầu' }
								: filtered
									? { href: routes.admin.inquiries, label: 'Xóa bộ lọc' }
									: undefined
						}
					/>
				) : (
					<>
						<div className={styles.desktopInbox}>
							<div className={styles.tableWrap}>
								<table className={styles.table}>
									<caption className="sr-only">Danh sách liên hệ</caption>
									<thead>
										<tr>
											<th scope="col">Người gửi</th>
											<th scope="col">Lời nhắn</th>
											<th scope="col">Trạng thái</th>
											{showNoticeColumn ? <th scope="col">Thông báo</th> : null}
											<th scope="col">Ngày gửi</th>
										</tr>
									</thead>
									<tbody>
										{result.items.map((item) => (
											<tr key={item.id}>
												<td>
													<Link className={styles.sender} href={detailHref(item.id)}>
														{item.status === 'NEW' ? (
															<span className={styles.dot} aria-hidden="true" />
														) : null}
														{item.name}
													</Link>
													<p className={styles.meta}>{item.organization || item.email}</p>
												</td>
												<td>
													<p>{INQUIRY_TYPE_LABELS[item.inquiryType]}</p>
													<p className={`${styles.meta} ${styles.excerpt}`}>
														{excerpt(item.context)}
													</p>
												</td>
												<td>
													<InquiryBadge status={item.status} />
												</td>
												{showNoticeColumn ? (
													<td>
														{item.adminEmailStatus === 'failed' ? (
															<span className={styles.warningLabel}>Thông báo lỗi</span>
														) : null}
													</td>
												) : null}
												<td>
													<time dateTime={item.createdAt} title={adminDate(item.createdAt)}>
														{relativeTime(item.createdAt)}
													</time>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
						<div className={styles.mobileInbox}>
							{result.items.map((item) => (
								<article key={item.id} className={styles.panel}>
									<Link className={styles.sender} href={detailHref(item.id)}>
										{item.status === 'NEW' ? (
											<span className={styles.dot} aria-hidden="true" />
										) : null}
										{item.name}
									</Link>
									<p className="mt-2">{INQUIRY_TYPE_LABELS[item.inquiryType]}</p>
									<p className={`${styles.meta} ${styles.excerpt}`}>{excerpt(item.context)}</p>
									<div className="mt-3 flex flex-wrap items-center gap-2">
										<time
											dateTime={item.createdAt}
											title={adminDate(item.createdAt)}
											className={styles.meta}
										>
											{relativeTime(item.createdAt)}
										</time>
										<InquiryBadge status={item.status} />
										{item.adminEmailStatus === 'failed' ? (
											<span className={styles.warningLabel}>Thông báo lỗi</span>
										) : null}
									</div>
								</article>
							))}
						</div>
					</>
				)}
				{result.totalPages > 1 && result.items.length > 0 ? (
					<nav aria-label="Phân trang" className={styles.pagination}>
						<span className={styles.meta}>
							Trang {page}/{result.totalPages}
						</span>
						<div className="flex gap-2">
							{page > 1 ? (
								<AdminLink href={inquiryListHref(sp, page - 1)} icon="back">
									Trước
								</AdminLink>
							) : null}
							{page < result.totalPages ? (
								<AdminLink href={inquiryListHref(sp, page + 1)}>Sau</AdminLink>
							) : null}
						</div>
					</nav>
				) : null}
			</div>
		</div>
	);
}
