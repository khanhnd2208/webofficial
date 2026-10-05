import { routes } from '@/config/routes';
import {
	INQUIRY_STATUSES,
	INQUIRY_TYPES,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';
export type InquiryQuery = {
	page?: string;
	status?: string;
	inquiryType?: string;
	search?: string;
	notice?: string;
};
/** Only supported filters are carried forward; destinations are always internal. */
export function inquiryQuery(query: InquiryQuery, page?: number): string {
	const params = new URLSearchParams();
	const parsed = Number(query.page);
	const current = page ?? (Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1);
	if (current > 1) params.set('page', String(current));
	if (INQUIRY_STATUSES.includes(query.status as InquiryStatus)) params.set('status', query.status!);
	if (INQUIRY_TYPES.includes(query.inquiryType as InquiryType))
		params.set('inquiryType', query.inquiryType!);
	if (query.search?.trim()) params.set('search', query.search.trim());
	if (query.notice === 'failed') params.set('notice', 'failed');
	const encoded = params.toString();
	return encoded ? `?${encoded}` : '';
}
export function inquiryListHref(query: InquiryQuery, page?: number): string {
	return `${routes.admin.inquiries}${inquiryQuery(query, page)}`;
}
export function adminDate(value?: string | null): string {
	return value
		? new Date(value).toLocaleString('vi-VN', {
				timeZone: 'Asia/Ho_Chi_Minh',
				dateStyle: 'short',
				timeStyle: 'short',
			})
		: '—';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function vietnamDay(value: Date): string {
	return value.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Short Vietnamese relative time. Absolute instants stay in adminDate. */
export function relativeTime(value?: string | null, now = new Date()): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	const delta = now.getTime() - date.getTime();
	if (delta < MINUTE) return 'vừa xong';
	if (delta < HOUR) return `${Math.floor(delta / MINUTE)} phút trước`;
	if (delta < DAY) return `${Math.floor(delta / HOUR)} giờ trước`;
	if (vietnamDay(date) === vietnamDay(new Date(now.getTime() - DAY))) return 'hôm qua';
	const days = Math.floor(delta / DAY);
	if (days < 7) return `${days} ngày trước`;
	return adminDate(value);
}

export function excerpt(value?: string | null, max = 96): string {
	const flat = (value ?? '').replace(/\s+/g, ' ').trim();
	if (flat.length <= max) return flat;
	return `${flat.slice(0, max - 1).trimEnd()}…`;
}
