import { z } from 'zod';

import { INQUIRY_STATUSES, INQUIRY_TYPES } from '@/features/inquiries/constants';

export const inquiryTypeSchema = z.enum(INQUIRY_TYPES);
export const inquiryStatusSchema = z.enum(INQUIRY_STATUSES);

/** Allowed UTM / attribution keys — unknown keys are stripped. */
export const CAMPAIGN_PARAM_WHITELIST = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
	'ref',
	'gclid',
	'fbclid',
] as const;

const optionalShort = z.string().trim().max(200).optional();
const optionalMedium = z.string().trim().max(2000).optional();

export const campaignParamsSchema = z
	.record(z.string(), z.unknown())
	.optional()
	.transform((raw) => {
		if (!raw || typeof raw !== 'object') return undefined;
		const out: Record<string, string> = {};
		for (const key of CAMPAIGN_PARAM_WHITELIST) {
			const value = raw[key];
			if (value == null) continue;
			const str = String(value).trim();
			if (str) out[key] = str.slice(0, 200);
		}
		return Object.keys(out).length > 0 ? out : undefined;
	});

export const createInquirySchema = z.object({
	name: z.string().trim().min(1, 'Tên bắt buộc').max(200),
	email: z.string().trim().email('Email không hợp lệ').max(320),
	inquiryType: inquiryTypeSchema,
	roleOrStage: optionalShort,
	organization: optionalShort,
	orgSize: z.string().trim().max(100).optional(),
	industry: z.string().trim().max(100).optional(),
	context: z.string().trim().min(1, 'Ngữ cảnh bắt buộc').max(5000),
	problem: z.string().trim().max(5000).optional(),
	consequence: optionalMedium,
	tried: optionalMedium,
	desiredOutcome: optionalMedium,
	preferredFormat: optionalShort,
	timeframe: optionalShort,
	budgetOptional: optionalShort,
	urgency: optionalShort,
	sourcePage: z.string().trim().max(500).optional(),
	sourceCourseSlug: z.string().trim().max(120).optional(),
	campaignParams: campaignParamsSchema,
	agreedScope: z.literal(true, { message: 'Bạn cần xác nhận phạm vi dịch vụ' }),
	agreedPrivacy: z.literal(true, { message: 'Bạn cần đồng ý chính sách bảo mật' }),
	/** Honeypot — must be empty; validated in route before persistence. */
	website: z.string().optional(),
});

export const listInquiriesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: inquiryStatusSchema.optional(),
	inquiryType: inquiryTypeSchema.optional(),
	search: z.string().trim().max(200).optional(),
	dateFrom: z.string().trim().optional(),
	dateTo: z.string().trim().optional(),
});

export const updateInquirySchema = z
	.object({
		status: inquiryStatusSchema.optional(),
		statusNote: z.string().trim().max(2000).optional(),
		internalNotes: z.string().trim().max(10_000).optional(),
		retryNotification: z.boolean().optional(),
	})
	.refine(
		(data) =>
			data.status !== undefined ||
			data.internalNotes !== undefined ||
			data.retryNotification === true,
		{ message: 'No updates provided' },
	);

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
