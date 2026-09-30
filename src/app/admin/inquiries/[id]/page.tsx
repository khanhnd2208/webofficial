import { AdminLink } from '@/components/admin/AdminPrimitives';
import { InquiryBadge } from '@/components/admin/InquiryBadges';
import {
	adminDate,
	inquiryListHref,
	type InquiryQuery,
} from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { notFound } from 'next/navigation';

import InquiryAdminActions from '../InquiryAdminActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getInquiry } from '@/services/inquiryService';
import { routes } from '@/config/routes';
import {
	INQUIRY_STATUS_LABELS,
	INQUIRY_EMAIL_STATUS_LABELS,
	INQUIRY_TYPE_LABELS,
} from '@/features/inquiries/constants';

export const dynamic = 'force-dynamic';

export default async function AdminInquiryDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams?: Promise<InquiryQuery>;
}) {
	const { id } = await params;
	const returnHref = inquiryListHref((await searchParams) ?? {});
	const inquiry = await getInquiry(id);
	if (!inquiry) notFound();
	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	const replyHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(
		`Phản hồi lời nhắn: ${typeLabel}`,
	)}`;

	return (
		<div className={styles.page}>
			<AdminPageHeader
				eyebrow="Hộp thư liên hệ"
				breadcrumbs={[
					{ label: 'Tổng quan', href: routes.admin.home },
					{ label: 'Hộp thư liên hệ', href: returnHref },
				]}
				title={inquiry.name}
				description={
					<>
						<a href={`mailto:${inquiry.email}`} className="underline">
							{inquiry.email}
						</a>
						{' · '}
						{typeLabel} · <InquiryBadge status={inquiry.status} />
					</>
				}
				actions={
					<AdminLink href={returnHref} icon="back">
						Danh sách
					</AdminLink>
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
				<a href={replyHref} className={`${styles.button} ${styles.primary}`}>
					Trả lời qua email
				</a>
			</div>

			<section className={`${styles.detail} mt-8`}>
				<div className="space-y-6">
					<div className={styles.panel}>
						<h2 className={styles.sectionTitle}>Bối cảnh</h2>
						<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.context}</p>
					</div>
					{inquiry.problem ? (
						<div className={styles.panel}>
							<h2 className={styles.sectionTitle}>Vấn đề</h2>
							<p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.problem}</p>
						</div>
					) : null}
					{inquiry.desiredOutcome ? (
						<div className={styles.panel}>
							<h2 className={styles.sectionTitle}>Kết quả mong muốn</h2>
							<p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.desiredOutcome}</p>
						</div>
					) : null}
					<dl className={`${styles.panel} grid gap-4 sm:grid-cols-2`}>
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
					<div className={styles.panel}>
						<h2 className={styles.sectionTitle}>Lịch sử trạng thái</h2>
						<ul className="mt-3 space-y-2 text-sm">
							{inquiry.statusHistory.map((h, idx) => (
								<li key={`${h.status}-${idx}`}>
									{INQUIRY_STATUS_LABELS[h.status]} · {adminDate(h.at)}
									{h.note ? ` — ${h.note}` : ''}
								</li>
							))}
						</ul>
					</div>
				</div>
				<div>
					<InquiryAdminActions
						key={inquiry.id}
						inquiryId={inquiry.id}
						initialNotes={inquiry.internalNotes ?? ''}
						returnHref={returnHref}
						currentStatus={inquiry.status}
						adminEmailStatus={inquiry.adminEmailStatus}
					/>
				</div>
			</section>
		</div>
	);
}
