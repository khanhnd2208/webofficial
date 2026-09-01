import Link from 'next/link';
import { notFound } from 'next/navigation';

import InquiryAdminActions from '../InquiryAdminActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getInquiry } from '@/services/inquiryService';
import { routes } from '@/config/routes';
import {
	INQUIRY_EMAIL_STATUS_LABELS,
	INQUIRY_STATUS_LABELS,
	INQUIRY_TYPE_LABELS,
} from '@/features/inquiries/constants';

export const dynamic = 'force-dynamic';

export default async function AdminInquiryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const inquiry = await getInquiry(id);
	if (!inquiry) notFound();
	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	const replyHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(
		`Phản hồi lời nhắn: ${typeLabel}`,
	)}`;

	return (
		<div className="mx-auto max-w-4xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Yêu cầu liên hệ"
				title={inquiry.name}
				description={
					<>
						<a href={`mailto:${inquiry.email}`} className="underline">
							{inquiry.email}
						</a>
						{' · '}
						{typeLabel} · {INQUIRY_STATUS_LABELS[inquiry.status]}
					</>
				}
				actions={
					<Link href={routes.admin.inquiries} className="text-sm underline">
						← Danh sách
					</Link>
				}
			/>
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
						{inquiry.submitterType === 'account'
							? 'Tài khoản'
							: inquiry.submitterType === 'guest'
								? 'Khách'
								: 'Không xác định'}
					</span>
					<a
						href={replyHref}
						className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
					>
						Trả lời qua email
					</a>
				</div>

			<section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
				<div className="space-y-6">
					<div className="rounded-xl border border-border p-4">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Bối cảnh</h2>
						<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.context}</p>
					</div>
					{inquiry.problem ? (
						<div className="rounded-xl border border-border p-4">
							<h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Vấn đề</h2>
							<p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.problem}</p>
						</div>
					) : null}
					{inquiry.desiredOutcome ? (
						<div className="rounded-xl border border-border p-4">
							<h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Kết quả mong muốn</h2>
							<p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.desiredOutcome}</p>
						</div>
					) : null}
					<dl className="grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-xs uppercase text-muted">Chủ đề</dt>
							<dd className="mt-1">{typeLabel}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Người gửi</dt>
							<dd className="mt-1">
								{inquiry.submitterType === 'account'
									? 'Tài khoản'
									: inquiry.submitterType === 'guest'
										? 'Khách'
										: 'Không xác định'}
							</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Vai trò / giai đoạn</dt>
							<dd className="mt-1">{inquiry.roleOrStage || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Tổ chức</dt>
							<dd className="mt-1">{inquiry.organization || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Hình thức</dt>
							<dd className="mt-1">{inquiry.preferredFormat || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Thời gian</dt>
							<dd className="mt-1">{inquiry.timeframe || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Trang nguồn</dt>
							<dd className="mt-1 break-all">{inquiry.sourcePage || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Khóa học nguồn</dt>
							<dd className="mt-1 break-all">{inquiry.sourceCourseSlug || '—'}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Thông báo admin</dt>
							<dd className="mt-1">
								{INQUIRY_EMAIL_STATUS_LABELS[inquiry.adminEmailStatus]}
								{inquiry.adminEmailError ? ` — ${inquiry.adminEmailError}` : ''}
							</dd>
						</div>
						<div>
							<dt className="text-xs uppercase text-muted">Xác nhận người gửi</dt>
							<dd className="mt-1">
								{INQUIRY_EMAIL_STATUS_LABELS[inquiry.senderEmailStatus]}
								{inquiry.senderEmailError ? ` — ${inquiry.senderEmailError}` : ''}
							</dd>
						</div>
					</dl>
					<div className="rounded-xl border border-border p-4">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Lịch sử trạng thái</h2>
						<ul className="mt-3 space-y-2 text-sm">
							{inquiry.statusHistory.map((h, idx) => (
								<li key={`${h.status}-${idx}`}>
									{INQUIRY_STATUS_LABELS[h.status]} · {new Date(h.at).toLocaleString('vi-VN')}
									{h.note ? ` — ${h.note}` : ''}
								</li>
							))}
						</ul>
					</div>
				</div>
				<div>
					<InquiryAdminActions
						inquiryId={inquiry.id}
						currentStatus={inquiry.status}
						adminEmailStatus={inquiry.adminEmailStatus}
					/>
					{inquiry.internalNotes ? (
						<p className="mt-4 whitespace-pre-wrap rounded-xl border border-border p-4 text-sm text-muted">
							{inquiry.internalNotes}
						</p>
					) : null}
				</div>
			</section>
		</div>
	);
}
