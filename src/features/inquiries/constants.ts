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

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
	training: 'Giảng dạy hoặc workshop',
	'learning-design': 'Thiết kế chương trình học',
	'people-organization': 'Trao đổi và tư vấn',
	unsure: 'Chưa xác định',
	other: 'Chủ đề khác',
	mentoring: 'Trao đổi cá nhân',
	business: 'Tư vấn tổ chức',
	ai: 'Ứng dụng AI',
	course: 'Khóa học',
};

/** Public contact form options (additive; does not remove legacy API values). */
export const PUBLIC_INQUIRY_TYPE_OPTIONS: ReadonlyArray<{
	value: InquiryType;
	label: string;
}> = [
	{ value: 'training', label: 'Giảng dạy hoặc workshop' },
	{ value: 'learning-design', label: 'Thiết kế chương trình học' },
	{ value: 'people-organization', label: 'Trao đổi và tư vấn' },
	{ value: 'unsure', label: 'Chưa chắc — muốn hỏi Khánh' },
	{ value: 'other', label: 'Một chủ đề khác' },
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

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
	NEW: 'Mới',
	REVIEWING: 'Đang xem',
	NEED_MORE_INFO: 'Cần thêm thông tin',
	QUALIFIED: 'Phù hợp',
	CALL_SCHEDULED: 'Đã hẹn trao đổi',
	PROPOSAL_SENT: 'Đã gửi đề xuất',
	WON: 'Đã nhận công việc',
	CLOSED: 'Đã đóng',
};

export type InquiryEmailStatus = 'pending' | 'sent' | 'failed';
