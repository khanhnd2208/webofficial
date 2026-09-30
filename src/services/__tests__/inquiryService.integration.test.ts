import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const emailMocks = vi.hoisted(() => ({
	sendInquiryEmails: vi.fn(),
	sendInquiryAdminNotification: vi.fn(),
}));

vi.mock('@/lib/inquiryEmail', () => emailMocks);

import Inquiry from '@/models/Inquiry';
import {
	countInquiriesByStatus,
	createInquiry,
	getAdjacentInquiryIds,
	getInquiry,
	retryNotification,
} from '@/services/inquiryService';

function baseDocument(overrides: Record<string, unknown> = {}) {
	return {
		name: 'Nguyễn Văn A',
		email: 'sender@example.com',
		inquiryType: 'training' as const,
		context: 'Tôi muốn hỏi về một workshop.',
		agreedScope: false,
		agreedPrivacy: true,
		status: 'NEW' as const,
		statusHistory: [{ status: 'NEW' as const, at: new Date() }],
		emailStatus: 'failed' as const,
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

	it('counts statuses without dropping the active search or topic filter', async () => {
		await Inquiry.collection.insertMany([
			baseDocument({
				name: 'Lan',
				email: 'lan@example.com',
				inquiryType: 'training',
				context: 'Workshop nội bộ',
				status: 'NEW',
			}),
			baseDocument({
				name: 'Lan',
				email: 'lan2@example.com',
				inquiryType: 'ai',
				context: 'Workshop AI',
				status: 'CLOSED',
			}),
			baseDocument({
				name: 'Minh',
				email: 'minh@example.com',
				inquiryType: 'training',
				context: 'Khác',
				status: 'NEW',
			}),
		]);

		const counts = await countInquiriesByStatus({ search: 'Lan', inquiryType: 'training' });
		expect(counts.all).toBe(1);
		expect(counts.byStatus.NEW).toBe(1);
		expect(counts.byStatus.CLOSED).toBe(0);
	});

	it('finds the newer and older inquiry inside the same filter, including the ends', async () => {
		const older = await Inquiry.collection.insertOne(
			baseDocument({
				email: 'older@example.com',
				status: 'NEW',
				createdAt: new Date('2026-09-01T00:00:00Z'),
			}),
		);
		const middle = await Inquiry.collection.insertOne(
			baseDocument({
				email: 'middle@example.com',
				status: 'NEW',
				createdAt: new Date('2026-09-02T00:00:00Z'),
			}),
		);
		const newer = await Inquiry.collection.insertOne(
			baseDocument({
				email: 'newer@example.com',
				status: 'CLOSED',
				createdAt: new Date('2026-09-03T00:00:00Z'),
			}),
		);

		const aroundMiddle = await getAdjacentInquiryIds(String(middle.insertedId), { status: 'NEW' });
		expect(aroundMiddle.previousId).toBeNull();
		expect(aroundMiddle.nextId).toBe(String(older.insertedId));

		const aroundOlder = await getAdjacentInquiryIds(String(older.insertedId), {});
		expect(aroundOlder.previousId).toBe(String(middle.insertedId));
		expect(aroundOlder.nextId).toBeNull();

		const aroundNewer = await getAdjacentInquiryIds(String(newer.insertedId), {});
		expect(aroundNewer.previousId).toBeNull();
		expect(aroundNewer.nextId).toBe(String(middle.insertedId));
	});
});
