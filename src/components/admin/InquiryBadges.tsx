import {
	INQUIRY_STATUS_LABELS,
	INQUIRY_EMAIL_STATUS_LABELS,
	type InquiryStatus,
	type InquiryEmailStatus,
} from '@/features/inquiries/constants';
import { AdminBadge } from './AdminPrimitives';
export function InquiryBadge({ status }: { status: InquiryStatus }) {
	const tone =
		status === 'NEW'
			? 'accent'
			: status === 'WON'
				? 'success'
				: status === 'NEED_MORE_INFO'
					? 'warning'
					: 'neutral';
	return <AdminBadge tone={tone}>{INQUIRY_STATUS_LABELS[status]}</AdminBadge>;
}
export function InquiryEmailBadge({ status }: { status: InquiryEmailStatus }) {
	return (
		<AdminBadge tone={status === 'failed' ? 'danger' : status === 'sent' ? 'success' : 'warning'}>
			{INQUIRY_EMAIL_STATUS_LABELS[status]}
		</AdminBadge>
	);
}
