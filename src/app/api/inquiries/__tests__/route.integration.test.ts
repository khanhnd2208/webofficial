import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';

vi.mock('@/lib/inquiryRateLimit', () => ({
	assertInquiryRateLimit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/inquiryAvailability', () => ({
	assertInquiryAvailable: vi.fn(() => undefined),
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
import { getApiUser } from '@/lib/apiAuth';
import { assertInquiryAvailable } from '@/lib/inquiryAvailability';
import { assertInquiryRateLimit } from '@/lib/inquiryRateLimit';
import { createInquiry } from '@/services/inquiryService';

describe('POST /api/inquiries', () => {
	beforeEach(() => {
		vi.mocked(createInquiry).mockClear();
		vi.mocked(getApiUser).mockReset();
		vi.mocked(getApiUser).mockResolvedValue(null);
		vi.mocked(assertInquiryAvailable).mockClear();
		vi.mocked(assertInquiryRateLimit).mockClear();
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
			{ submitterType: 'guest' },
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
			{ submitterType: 'guest' },
		);
	});

	it('uses the authenticated account email instead of a spoofed payload email', async () => {
		vi.mocked(getApiUser).mockResolvedValue({
			id: 'user-123',
			email: 'account@example.com',
			name: 'Nguyễn Văn A',
			role: 'student',
		});

		const response = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/inquiries',
			body: {
				name: 'Tên có thể sửa',
				email: 'spoofed@example.com',
				inquiryType: 'training',
				context: 'Tôi muốn hỏi về một workshop.',
				agreedPrivacy: true,
			},
		});

		expect(response.status).toBe(201);
		expect(vi.mocked(createInquiry)).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Tên có thể sửa',
				email: 'account@example.com',
			}),
			{ submitterType: 'account', submittedByUserId: 'user-123' },
		);
	});

	it('silently accepts a filled honeypot without auth, rate limiting or persistence', async () => {
		const response = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/inquiries',
			body: {
				name: 'Spam bot',
				email: 'bot@example.com',
				inquiryType: 'other',
				context: 'Automated message',
				agreedPrivacy: true,
				website: 'https://spam.example',
			},
		});

		expect(response.status).toBe(201);
		expect(assertInquiryAvailable).not.toHaveBeenCalled();
		expect(assertInquiryRateLimit).not.toHaveBeenCalled();
		expect(getApiUser).not.toHaveBeenCalled();
		expect(createInquiry).not.toHaveBeenCalled();
	});
});
