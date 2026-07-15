import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';

vi.mock('@/lib/inquiryRateLimit', () => ({
	assertInquiryRateLimit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
	isAdmin: vi.fn(),
}));

vi.mock('@/services/inquiryService', () => ({
	createInquiry: vi.fn(async (input: { agreedScope: boolean }) => ({
		id: 'inquiry-1',
		status: 'NEW',
		...input,
	})),
}));

import { POST } from '@/app/api/inquiries/route';
import { createInquiry } from '@/services/inquiryService';

describe('POST /api/inquiries', () => {
	beforeEach(() => {
		vi.mocked(createInquiry).mockClear();
	});

	it('accepts the minimal public message payload', async () => {
		const response = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/inquiries',
			body: {
				name: 'Nguyễn Văn A',
				email: 'a@example.com',
				inquiryType: 'unsure',
				context: 'Tôi muốn gửi Khánh một lời nhắn.',
				agreedPrivacy: true,
			},
		});

		expect(response.status).toBe(201);
		expect(vi.mocked(createInquiry)).toHaveBeenCalledWith(
			expect.objectContaining({ agreedScope: false, agreedPrivacy: true }),
		);
		const json = await parseJson<{ ok: boolean }>(response);
		expect(json.ok).toBe(true);
	});

	it('keeps accepting the former detailed payload', async () => {
		const response = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/inquiries',
			body: {
				name: 'Nguyễn Văn B',
				email: 'b@example.com',
				inquiryType: 'business',
				context: 'Bối cảnh cũ',
				organization: 'Tổ chức B',
				problem: 'Một vấn đề cũ',
				budgetOptional: 'Tùy trao đổi',
				agreedScope: true,
				agreedPrivacy: true,
			},
		});

		expect(response.status).toBe(201);
		expect(vi.mocked(createInquiry)).toHaveBeenCalledWith(
			expect.objectContaining({
				organization: 'Tổ chức B',
				budgetOptional: 'Tùy trao đổi',
				agreedScope: true,
			}),
		);
	});
});
