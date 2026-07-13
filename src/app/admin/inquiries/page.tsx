import Link from 'next/link';

import { listInquiries } from '@/services/inquiryService';
import { INQUIRY_STATUSES, INQUIRY_TYPES, type InquiryStatus, type InquiryType } from '@/features/inquiries/constants';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage({
	searchParams,
}: {
	searchParams?: Promise<{
		page?: string;
		status?: string;
		inquiryType?: string;
		search?: string;
	}>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const status = INQUIRY_STATUSES.includes(sp?.status as InquiryStatus)
		? (sp?.status as InquiryStatus)
		: undefined;
	const inquiryType = INQUIRY_TYPES.includes(sp?.inquiryType as InquiryType)
		? (sp?.inquiryType as InquiryType)
		: undefined;
	const search = sp?.search?.trim() || undefined;

	const result = await listInquiries({ page, limit: 20, status, inquiryType, search });
	const newCount = result.items.filter((i) => i.status === 'NEW').length;

	return (
		<main className="mx-auto max-w-6xl px-6 py-8">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Inquiry</h1>
					<p className="mt-1 text-sm text-foreground-secondary">
						Lead từ form liên hệ — không ghi nội dung nhạy cảm ra log.
					</p>
				</div>
				<p className="text-sm text-muted">
					Trang này: {result.items.length} · NEW trên trang: {newCount} · Tổng: {result.total}
				</p>
			</header>

			<form className="mt-6 flex flex-wrap gap-3" method="get">
				<input
					name="search"
					defaultValue={search ?? ''}
					placeholder="Tên, email, tổ chức"
					className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
				<select
					name="status"
					defaultValue={status ?? ''}
					className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				>
					<option value="">Mọi status</option>
					{INQUIRY_STATUSES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<select
					name="inquiryType"
					defaultValue={inquiryType ?? ''}
					className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				>
					<option value="">Mọi loại</option>
					{INQUIRY_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
				<button
					type="submit"
					className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
				>
					Lọc
				</button>
			</form>

			<div className="mt-6 overflow-x-auto rounded-xl border border-border">
				<table className="min-w-full text-left text-sm">
					<thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted">
						<tr>
							<th className="px-4 py-3">Người gửi</th>
							<th className="px-4 py-3">Loại</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Email</th>
							<th className="px-4 py-3">Ngày</th>
						</tr>
					</thead>
					<tbody>
						{result.items.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-muted">
									Chưa có inquiry.
								</td>
							</tr>
						) : (
							result.items.map((item) => (
								<tr key={item.id} className="border-b border-border last:border-0">
									<td className="px-4 py-3">
										<Link
											href={`${routes.admin.inquiries}/${item.id}`}
											className="font-semibold hover:underline"
										>
											{item.name}
										</Link>
										<p className="text-xs text-muted">{item.email}</p>
									</td>
									<td className="px-4 py-3">{item.inquiryType}</td>
									<td className="px-4 py-3">{item.status}</td>
									<td className="px-4 py-3">{item.emailStatus}</td>
									<td className="px-4 py-3 text-xs text-muted">
										{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{result.totalPages > 1 ? (
				<div className="mt-4 flex gap-2">
					{page > 1 ? (
						<Link
							href={`?page=${page - 1}${status ? `&status=${status}` : ''}${inquiryType ? `&inquiryType=${inquiryType}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
							className="text-sm underline"
						>
							Trước
						</Link>
					) : null}
					<span className="text-sm text-muted">
						Trang {page}/{result.totalPages}
					</span>
					{page < result.totalPages ? (
						<Link
							href={`?page=${page + 1}${status ? `&status=${status}` : ''}${inquiryType ? `&inquiryType=${inquiryType}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
							className="text-sm underline"
						>
							Sau
						</Link>
					) : null}
				</div>
			) : null}
		</main>
	);
}
