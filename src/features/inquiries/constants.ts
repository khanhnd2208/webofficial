/** Client-safe inquiry constants — do not import Mongoose models from here. */

/** All accepted inquiry types (API + admin). Legacy values remain valid. */
export const INQUIRY_TYPES = [
	'training',
	'learning-design',
	'people-organization',
	'unsure',
	'other',
	/** Legacy — still accepted by API/admin, not primary public options */
	'mentoring',
	'business',
	'ai',
	'course',
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

/** Public contact form options (additive; does not remove legacy API values). */
export const PUBLIC_INQUIRY_TYPE_OPTIONS: ReadonlyArray<{
	value: InquiryType;
	label: string;
}> = [
	{ value: 'training', label: 'Giảng dạy & workshop' },
	{ value: 'learning-design', label: 'Thiết kế chương trình học' },
	{ value: 'people-organization', label: 'Tư vấn phát triển con người & tổ chức' },
	{ value: 'unsure', label: 'Chưa chắc — cần định hướng' },
	{ value: 'other', label: 'Khác' },
];

export const INQUIRY_STATUSES = [
	'NEW',
	'REVIEWING',
	'NEED_MORE_INFO',
	'QUALIFIED',
	'CALL_SCHEDULED',
	'PROPOSAL_SENT',
	'WON',
	'CLOSED',
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type InquiryEmailStatus = 'pending' | 'sent' | 'failed';
