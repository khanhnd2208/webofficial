import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
	INQUIRY_EMAIL_TIMEOUT_MS,
	sanitizeInquiryEmailError,
	sendInquiryEmails,
} from '@/lib/inquiryEmail';
import type { IInquiry } from '@/models/Inquiry';

function inquiry(): IInquiry & { _id: string } {
	return {
		_id: 'inquiry-1',
		name: 'Nguyễn Văn A',
		email: 'sender@example.com',
		inquiryType: 'training',
		context: 'Tôi muốn trao đổi về một workshop.',
		agreedScope: false,
		agreedPrivacy: true,
		status: 'NEW',
		statusHistory: [],
		emailStatus: 'pending',
	};
}

describe('inquiry email delivery', () => {
	beforeEach(() => {
		vi.stubEnv('RESEND_API_KEY', 're_test_secret_12345678');
		vi.stubEnv('INQUIRY_FROM_EMAIL', 'Duy Khánh <noreply@example.com>');
		vi.stubEnv('INQUIRY_NOTIFY_EMAIL', 'admin@example.com');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it('sets Reply-To on the admin notification and uses a ten-second timeout', async () => {
		const timeoutSignal = AbortSignal.abort();
		const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutSignal);
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(null, { status: 202 }));

		const result = await sendInquiryEmails(inquiry());

		expect(result.adminEmailStatus).toBe('sent');
		expect(result.senderEmailStatus).toBe('sent');
		expect(timeoutSpy).toHaveBeenCalledTimes(2);
		expect(timeoutSpy).toHaveBeenCalledWith(INQUIRY_EMAIL_TIMEOUT_MS);

		const payloads = fetchMock.mock.calls.map(([, init]) =>
			JSON.parse(String(init?.body)) as { to: string[]; reply_to?: string },
		);
		const adminPayload = payloads.find((payload) => payload.to[0] === 'admin@example.com');
		const senderPayload = payloads.find((payload) => payload.to[0] === 'sender@example.com');
		expect(adminPayload?.reply_to).toBe('sender@example.com');
		expect(senderPayload?.reply_to).toBeUndefined();
	});

	it('still sends the sender confirmation when the admin notification fails', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
			const payload = JSON.parse(String(init?.body)) as { to: string[] };
			return new Response(null, {
				status: payload.to[0] === 'admin@example.com' ? 503 : 202,
			});
		});

		const result = await sendInquiryEmails(inquiry());

		expect(result.adminEmailStatus).toBe('failed');
		expect(result.adminEmailError).toBe('Resend API error (503)');
		expect(result.senderEmailStatus).toBe('sent');
		expect(result.emailStatus).toBe('failed');
	});

	it('still notifies admin when the sender confirmation fails', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
			const payload = JSON.parse(String(init?.body)) as { to: string[] };
			return new Response(null, {
				status: payload.to[0] === 'sender@example.com' ? 422 : 202,
			});
		});

		const result = await sendInquiryEmails(inquiry());

		expect(result.adminEmailStatus).toBe('sent');
		expect(result.senderEmailStatus).toBe('failed');
		expect(result.senderEmailError).toBe('Resend API error (422)');
		expect(result.emailStatus).toBe('sent');
	});

	it('returns pending statuses when delivery is not configured', async () => {
		vi.stubEnv('RESEND_API_KEY', '');
		const fetchMock = vi.spyOn(globalThis, 'fetch');

		const result = await sendInquiryEmails(inquiry());

		expect(result.adminEmailStatus).toBe('pending');
		expect(result.senderEmailStatus).toBe('pending');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('redacts secrets and bounds stored delivery errors', () => {
		const longMessage = `${process.env.RESEND_API_KEY}\n${'x'.repeat(500)}`;
		const sanitized = sanitizeInquiryEmailError(new Error(longMessage));

		expect(sanitized).not.toContain('re_test_secret_12345678');
		expect(sanitized.length).toBeLessThanOrEqual(300);
		expect(sanitized).not.toContain('\n');
	});
});
