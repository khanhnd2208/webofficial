import Link from 'next/link';

import { inquiryListHref, type InquiryQuery } from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import {
	INQUIRY_STATUSES,
	INQUIRY_STATUS_LABELS,
	type InquiryStatus,
} from '@/features/inquiries/constants';

export function InquiryStatusChips({
	query,
	counts,
}: {
	query: InquiryQuery;
	counts: { all: number; byStatus: Record<InquiryStatus, number> };
}) {
	const current = INQUIRY_STATUSES.includes(query.status as InquiryStatus) ? query.status : '';
	const items = [
		{ status: '', label: 'Tất cả', count: counts.all },
		// Empty stages add noise; "Mới" and the selected stage always stay reachable.
		...INQUIRY_STATUSES.filter(
			(status) => status === 'NEW' || status === current || counts.byStatus[status] > 0,
		).map((status) => ({
			status,
			label: INQUIRY_STATUS_LABELS[status],
			count: counts.byStatus[status],
		})),
	];
	return (
		<nav aria-label="Lọc theo trạng thái" className={styles.chips}>
			{items.map((item) => {
				const href = inquiryListHref(
					{
						search: query.search,
						inquiryType: query.inquiryType,
						notice: query.notice,
						status: item.status || undefined,
					},
					1,
				);
				const active = item.status === current;
				return (
					<Link
						key={item.label}
						href={href}
						className={styles.chip}
						aria-current={active ? 'true' : undefined}
					>
						{item.label}
						<span className={styles.chipCount}>{item.count.toLocaleString('vi-VN')}</span>
					</Link>
				);
			})}
		</nav>
	);
}
