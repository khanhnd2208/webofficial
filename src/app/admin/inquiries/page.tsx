import Link from 'next/link';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminButton, AdminLink, AdminPagination } from '@/components/admin/AdminPrimitives';
import { InquiryBadge, InquiryEmailBadge } from '@/components/admin/InquiryBadges';
import {
	inquiryQuery,
	inquiryListHref,
	adminDate,
	type InquiryQuery,
} from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { listInquiries } from '@/services/inquiryService';
import {
	INQUIRY_STATUSES,
	INQUIRY_STATUS_LABELS,
	INQUIRY_TYPES,
	INQUIRY_TYPE_LABELS,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { routes } from '@/config/routes';
export const dynamic = 'force-dynamic';
export default async function AdminInquiriesPage({
	searchParams,
}: {
	searchParams?: Promise<InquiryQuery>;
}) {
	const sp = (await searchParams) ?? {};
	const normalized = new URLSearchParams(inquiryQuery(sp).slice(1));
	const page = Number(normalized.get('page') ?? 1);
	const status = normalized.get('status') as InquiryStatus | null;
	const inquiryType = normalized.get('inquiryType') as InquiryType | null;
	const search = normalized.get('search') ?? undefined;
	const result = await listInquiries({
		page,
		limit: 20,
		status: status ?? undefined,
		inquiryType: inquiryType ?? undefined,
		search,
	});
	const filtered = Boolean(status || inquiryType || search);
	const detailHref = (id: string) =>
		`${routes.admin.inquiries}/${encodeURIComponent(id)}${inquiryQuery(sp)}`;
	const emptyTitle =
		result.total > 0
			? 'Trang này không còn liên hệ'
			: filtered
				? 'Không tìm thấy liên hệ phù hợp'
				: 'Chưa có lời nhắn nào';
	return (
		<div className={styles.page}>
			<AdminPageHeader
				eyebrow="Admin Studio"
				title="Hộp thư liên hệ"
				description="Đọc lời nhắn và theo dõi quá trình trao đổi."
				breadcrumbs={resolveAdminRoute(routes.admin.inquiries).breadcrumbs}
			/>
			<form className={styles.toolbar} method="get" action={routes.admin.inquiries}>
				<label className={styles.field}>
					Tìm kiếm
					<input
						name="search"
						defaultValue={search ?? ''}
						placeholder="Tên, email, tổ chức"
						className={styles.control}
					/>
				</label>
				<label className={styles.field}>
					Trạng thái
					<select name="status" defaultValue={status ?? ''} className={styles.control}>
						<option value="">Mọi trạng thái</option>
						{INQUIRY_STATUSES.map((s) => (
							<option key={s} value={s}>
								{INQUIRY_STATUS_LABELS[s]}
							</option>
						))}
					</select>
				</label>
				<label className={styles.field}>
					Chủ đề
					<select name="inquiryType" defaultValue={inquiryType ?? ''} className={styles.control}>
						<option value="">Mọi chủ đề</option>
						{INQUIRY_TYPES.map((t) => (
							<option key={t} value={t}>
								{INQUIRY_TYPE_LABELS[t]}
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
			<p className={`${styles.meta} mb-4`} role="status">
				Hiển thị {result.items.length ? (page - 1) * 20 + 1 : 0}–
				{result.items.length ? (page - 1) * 20 + result.items.length : 0} trong {result.total} liên
				hệ · {result.items.filter((i) => i.status === 'NEW').length} mới trên trang này
			</p>
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
										<th scope="col">Chủ đề</th>
										<th scope="col">Trạng thái</th>
										<th scope="col">Thông báo Admin</th>
										<th scope="col">Ngày gửi</th>
									</tr>
								</thead>
								<tbody>
									{result.items.map((item) => (
										<tr key={item.id}>
											<td>
												<Link
													className="font-semibold text-accent hover:underline"
													href={detailHref(item.id)}
												>
													{item.name}
												</Link>
												<p className={styles.meta}>{item.email}</p>
												<p className={styles.meta}>
													{item.submitterType === 'account'
														? 'Tài khoản'
														: item.submitterType === 'guest'
															? 'Khách'
															: 'Không xác định'}
												</p>
											</td>
											<td>{INQUIRY_TYPE_LABELS[item.inquiryType]}</td>
											<td>
												<InquiryBadge status={item.status} />
											</td>
											<td>
												<InquiryEmailBadge status={item.adminEmailStatus} />
											</td>
											<td className="whitespace-nowrap">{adminDate(item.createdAt)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
					<div className={styles.mobileInbox}>
						{result.items.map((item) => (
							<article key={item.id} className={styles.panel}>
								<Link
									href={detailHref(item.id)}
									className="font-semibold text-accent hover:underline"
								>
									{item.name}
								</Link>
								<p className={`${styles.meta} break-words`}>{item.email}</p>
								<p className="my-3">{INQUIRY_TYPE_LABELS[item.inquiryType]}</p>
								<div className="flex flex-wrap gap-2">
									<InquiryBadge status={item.status} />
									<InquiryEmailBadge status={item.adminEmailStatus} />
								</div>
								<p className={`${styles.meta} mt-3`}>{adminDate(item.createdAt)}</p>
							</article>
						))}
					</div>
				</>
			)}
			{result.totalPages > 1 && (
				<AdminPagination
					page={page}
					totalPages={result.totalPages}
					previous={
						page > 1 ? inquiryListHref(sp, Math.min(page - 1, result.totalPages)) : undefined
					}
					next={page < result.totalPages ? inquiryListHref(sp, page + 1) : undefined}
				/>
			)}
		</div>
	);
}
