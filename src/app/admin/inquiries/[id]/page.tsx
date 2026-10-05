import { notFound } from 'next/navigation';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminLink } from '@/components/admin/AdminPrimitives';
import { InquiryBadge } from '@/components/admin/InquiryBadges';
import {
	adminDate,
	inquiryListHref,
	inquiryQuery,
	relativeTime,
	type InquiryQuery,
} from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import {
	INQUIRY_STATUSES,
	INQUIRY_TYPES,
	INQUIRY_TYPE_LABELS,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';
import { getAdjacentInquiryIds, getInquiry } from '@/services/inquiryService';
import InquiryAdminActions, { CopyEmailButton } from '../InquiryAdminActions';

export const dynamic = 'force-dynamic';

export default async function AdminInquiryDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams?: Promise<InquiryQuery>;
}) {
	const { id } = await params;
	const query = (await searchParams) ?? {};
	const returnHref = inquiryListHref(query);
	const inquiry = await getInquiry(id);
	if (!inquiry) notFound();
	const adjacent = await getAdjacentInquiryIds(id, {
		status: INQUIRY_STATUSES.includes(query.status as InquiryStatus)
			? (query.status as InquiryStatus)
			: undefined,
		inquiryType: INQUIRY_TYPES.includes(query.inquiryType as InquiryType)
			? (query.inquiryType as InquiryType)
			: undefined,
		search: query.search?.trim() || undefined,
		failedNotification: query.notice === 'failed',
	});
	const detailHref = (target: string) =>
		`${routes.admin.inquiries}/${encodeURIComponent(target)}${inquiryQuery(query)}`;
	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	const replyHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(
		`Phản hồi lời nhắn: ${typeLabel}`,
	)}`;
	const sentAt = adminDate(inquiry.createdAt);

	return (
		<div className={styles.page}>
			<AdminPageHeader
				breadcrumbs={[{ label: 'Hộp thư liên hệ', href: returnHref }]}
				title={inquiry.name}
				description={
					<>
						<a href={`mailto:${inquiry.email}`} className="underline">
							{inquiry.email}
						</a>
						{inquiry.organization ? ` · ${inquiry.organization}` : ''}
						{' · '}
						<time dateTime={inquiry.createdAt} title={sentAt}>
							{relativeTime(inquiry.createdAt)}
						</time>
						{' · '}
						{sentAt}
						{' · '}
						<InquiryBadge status={inquiry.status} />
					</>
				}
				actions={
					<>
						<a href={replyHref} className={`${styles.button} ${styles.primary}`}>
							Trả lời qua email
						</a>
						<CopyEmailButton email={inquiry.email} />
					</>
				}
			/>
			<nav aria-label="Liên hệ liền kề" className={styles.adjacent}>
				{adjacent.previousId ? (
					<AdminLink href={detailHref(adjacent.previousId)} icon="back" tone="quiet">
						Trước
					</AdminLink>
				) : (
					<span className={`${styles.button} ${styles.quiet}`} aria-disabled="true">
						Trước
					</span>
				)}
				{adjacent.nextId ? (
					<AdminLink href={detailHref(adjacent.nextId)} tone="quiet">
						Sau <span aria-hidden="true">→</span>
					</AdminLink>
				) : (
					<span className={`${styles.button} ${styles.quiet}`} aria-disabled="true">
						Sau
					</span>
				)}
			</nav>
			<InquiryAdminActions
				key={inquiry.id}
				inquiryId={inquiry.id}
				initialNotes={inquiry.internalNotes ?? ''}
				returnHref={returnHref}
				nextHref={adjacent.nextId ? detailHref(adjacent.nextId) : undefined}
				currentStatus={inquiry.status}
				adminEmailStatus={inquiry.adminEmailStatus}
				adminEmailError={inquiry.adminEmailError}
				message={{
					context: inquiry.context,
					problem: inquiry.problem,
					desiredOutcome: inquiry.desiredOutcome,
				}}
				extras={[
					{ label: 'Chủ đề', value: typeLabel },
					{ label: 'Vai trò / giai đoạn', value: inquiry.roleOrStage },
					{ label: 'Tổ chức', value: inquiry.organization },
					{ label: 'Quy mô', value: inquiry.orgSize },
					{ label: 'Ngành', value: inquiry.industry },
					{ label: 'Hình thức', value: inquiry.preferredFormat },
					{ label: 'Thời gian', value: inquiry.timeframe },
					{ label: 'Mức độ khẩn', value: inquiry.urgency },
					{ label: 'Ngân sách', value: inquiry.budgetOptional },
					{ label: 'Hệ quả', value: inquiry.consequence },
					{ label: 'Đã thử', value: inquiry.tried },
					{ label: 'Trang nguồn', value: inquiry.sourcePage },
					{ label: 'Khóa học nguồn', value: inquiry.sourceCourseSlug },
				]}
				history={inquiry.statusHistory}
			/>
		</div>
	);
}
