/** Client-safe inquiry constants — do not import Mongoose models from here. */

export const INQUIRY_TYPES = [
	'mentoring',
	'business',
	'training',
	'ai',
	'course',
	'other',
	'unsure',
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

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
