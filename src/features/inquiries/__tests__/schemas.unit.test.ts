import { describe, expect, it } from 'vitest';

import {
	CAMPAIGN_PARAM_WHITELIST,
	createInquirySchema,
	listInquiriesQuerySchema,
	updateInquirySchema,
} from '@/features/inquiries/schemas';
import { hashClientIp, isRateLimitBreached, INQUIRY_RATE_LIMIT_MAX } from '@/lib/inquiryRateLimit';
import { parseSchema } from '@/lib/validation/parse';
import { AppError } from '@/lib/appError';

const validPayload = {
	name: 'Nguyễn Văn A',
	email: 'a@example.com',
	inquiryType: 'mentoring' as const,
	context: 'Tôi cần định hướng nghề nghiệp sau khi tốt nghiệp.',
	agreedScope: true as const,
	agreedPrivacy: true as const,
};

describe('createInquirySchema', () => {
	it('accepts a valid inquiry payload', () => {
		const data = parseSchema(createInquirySchema, validPayload);
		expect(data.name).toBe('Nguyễn Văn A');
		expect(data.inquiryType).toBe('mentoring');
	});

	it('accepts the new minimal public payload and defaults the legacy scope flag', () => {
		const data = parseSchema(createInquirySchema, {
			name: 'Nguyễn Văn A',
			email: 'a@example.com',
			inquiryType: 'unsure',
			context: 'Tôi muốn gửi Khánh một lời nhắn.',
			agreedPrivacy: true,
		});
		expect(data.agreedScope).toBe(false);
	});

	it('accepts new public inquiry types and legacy values', () => {
		for (const inquiryType of [
			'training',
			'learning-design',
			'people-organization',
			'unsure',
			'other',
			'mentoring',
			'business',
			'ai',
			'course',
		] as const) {
			const data = parseSchema(createInquirySchema, { ...validPayload, inquiryType });
			expect(data.inquiryType).toBe(inquiryType);
		}
	});

	it('rejects missing context', () => {
		expect(() => parseSchema(createInquirySchema, { ...validPayload, context: '  ' })).toThrow(
			AppError,
		);
	});

	it('rejects when privacy consent is false', () => {
		expect(() =>
			parseSchema(createInquirySchema, { ...validPayload, agreedPrivacy: false }),
		).toThrow(AppError);
	});

	it('strips non-whitelisted campaign params', () => {
		const data = parseSchema(createInquirySchema, {
			...validPayload,
			campaignParams: {
				utm_source: 'newsletter',
				secret_token: 'drop-me',
				utm_campaign: 'spring',
			},
		});
		expect(data.campaignParams).toEqual({
			utm_source: 'newsletter',
			utm_campaign: 'spring',
		});
	});

	it('allows honeypot field in schema (validated in route)', () => {
		const data = parseSchema(createInquirySchema, { ...validPayload, website: '' });
		expect(data.website).toBe('');
	});
});

describe('listInquiriesQuerySchema', () => {
	it('coerces pagination defaults', () => {
		const data = parseSchema(listInquiriesQuerySchema, {});
		expect(data.page).toBe(1);
		expect(data.limit).toBe(20);
	});

	it('accepts admin filters', () => {
		const data = parseSchema(listInquiriesQuerySchema, {
			status: 'NEW',
			inquiryType: 'business',
			search: 'acme',
		});
		expect(data.status).toBe('NEW');
		expect(data.search).toBe('acme');
	});
});

describe('updateInquirySchema', () => {
	it('requires at least one update field', () => {
		expect(() => parseSchema(updateInquirySchema, {})).toThrow(AppError);
	});

	it('accepts status update with note', () => {
		const data = parseSchema(updateInquirySchema, {
			status: 'REVIEWING',
			statusNote: 'Đã đọc form',
		});
		expect(data.status).toBe('REVIEWING');
	});

	it('accepts retry notification flag', () => {
		const data = parseSchema(updateInquirySchema, { retryNotification: true });
		expect(data.retryNotification).toBe(true);
	});
});

describe('campaign param whitelist', () => {
	it('includes standard UTM keys', () => {
		expect(CAMPAIGN_PARAM_WHITELIST).toContain('utm_source');
		expect(CAMPAIGN_PARAM_WHITELIST).toContain('utm_medium');
	});
});

describe('inquiry rate limit helpers', () => {
	it('hashes IP deterministically with secret', () => {
		const a = hashClientIp('203.0.113.1', 'test-secret');
		const b = hashClientIp('203.0.113.1', 'test-secret');
		const c = hashClientIp('203.0.113.2', 'test-secret');
		expect(a).toBe(b);
		expect(a).not.toBe(c);
		expect(a).toHaveLength(64);
	});

	it('detects breach at max submissions', () => {
		expect(isRateLimitBreached(INQUIRY_RATE_LIMIT_MAX - 1)).toBe(false);
		expect(isRateLimitBreached(INQUIRY_RATE_LIMIT_MAX)).toBe(true);
		expect(isRateLimitBreached(INQUIRY_RATE_LIMIT_MAX + 1)).toBe(true);
	});
});
