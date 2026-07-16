import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const emailMocks = vi.hoisted(() => ({
	sendInquiryEmails: vi.fn(),
	sendInquiryAdminNotification: vi.fn(),
}));

vi.mock('@/lib/inquiryEmail', () => emailMocks);

import Inquiry from '@/models/Inquiry';
import { createInquiry, getInquiry, retryNotification } from '@/services/inquiryService';

function baseDocument(overrides: Record<string, unknown> = {}) {
	return {
		name: 'Nguyễn Văn A',
		email: 'sender@example.com',
		inquiryType: 'training',
		context: 'Tôi muốn hỏi về một workshop.',
		agreedScope: false,
		agreedPrivacy: true,
		status: 'NEW',
		statusHistory: [{ status: 'NEW', at: new Date() }],
		emailStatus: 'failed',
		...overrides,
	};
}

describe('inquiryService delivery compatibility', () => {
	beforeEach(async () => {
		await Inquiry.deleteMany({});
		emailMocks.sendInquiryEmails.mockReset();
		emailMocks.sendInquiryAdminNotification.mockReset();
	});

	it('maps legacy records through the compatibility email status without inventing submitter type', async () => {
		const id = new mongoose.Types.ObjectId();
		await Inquiry.collection.insertOne({
			_id: id,
			...baseDocument({ emailStatus: 'failed', emailError: 'Legacy delivery error' }),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const inquiry = await getInquiry(id.toString());

		expect(inquiry?.submitterType).toBeUndefined();
		expect(inquiry?.adminEmailStatus).toBe('failed');
		expect(inquiry?.senderEmailStatus).toBe('pending');
		expect(inquiry?.senderEmailError).toBeUndefined();
		expect(inquiry?.adminEmailError).toBe('Legacy delivery error');
	});

	it('retry sends only the admin notification and preserves sender delivery state', async () => {
		const created = await Inquiry.create(
			baseDocument({
				submitterType: 'guest',
				adminEmailStatus: 'failed',
				adminEmailError: 'Admin failed',
				senderEmailStatus: 'failed',
				senderEmailError: 'Sender failed',
			}),
		);
		emailMocks.sendInquiryAdminNotification.mockResolvedValue({ status: 'sent' });

		const updated = await retryNotification(String(created._id));

		expect(emailMocks.sendInquiryAdminNotification).toHaveBeenCalledTimes(1);
		expect(emailMocks.sendInquiryEmails).not.toHaveBeenCalled();
		expect(updated.adminEmailStatus).toBe('sent');
		expect(updated.adminEmailError).toBeUndefined();
		expect(updated.senderEmailStatus).toBe('failed');
		expect(updated.senderEmailError).toBe('Sender failed');
		expect(updated.emailStatus).toBe('sent');
	});

	it('keeps the inquiry when both email deliveries fail', async () => {
		emailMocks.sendInquiryEmails.mockResolvedValue({
			adminEmailStatus: 'failed',
			adminEmailError: 'Admin delivery failed',
			senderEmailStatus: 'failed',
			senderEmailError: 'Sender delivery failed',
			emailStatus: 'failed',
			emailError: 'Admin delivery failed',
			ok: false,
		});

		const created = await createInquiry(
			{
				name: 'Nguyễn Văn B',
				email: 'b@example.com',
				inquiryType: 'course',
				context: 'Tôi muốn hỏi về khóa học.',
				campaignParams: undefined,
				agreedScope: false,
				agreedPrivacy: true,
			},
			{ submitterType: 'guest' },
		);

		expect(await Inquiry.countDocuments({ _id: created.id })).toBe(1);
		expect(created.adminEmailStatus).toBe('failed');
		expect(created.adminEmailError).toBe('Admin delivery failed');
		expect(created.senderEmailStatus).toBe('failed');
		expect(created.senderEmailError).toBe('Sender delivery failed');
	});
});
