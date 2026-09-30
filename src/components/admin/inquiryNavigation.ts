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
