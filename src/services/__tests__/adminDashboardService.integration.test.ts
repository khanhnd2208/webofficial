import { describe, it, expect, beforeEach, vi } from 'vitest';

import { countFailedNotifications, getAdminOverviewStats } from '@/services/adminDashboardService';

vi.mock('next/cache', () => ({
	unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}));

describe('adminDashboardService', () => {
	beforeEach(async () => {
		const Post = (await import('@/models/Post')).default;
		const User = (await import('@/models/User')).default;
		await Post.deleteMany({});
		await User.deleteMany({});
	});

	it('returns zero counts on empty database for the operating dashboard', async () => {
		const stats = await getAdminOverviewStats();
		expect(stats.website.newInquiries).toBe(0);
		expect(typeof stats.activeRecall.decks).toBe('number');
		expect(typeof stats.activeRecall.published).toBe('number');
	});

	it('counts a failed admin notification and a legacy failure, and ignores a sent dedicated status', async () => {
		const Inquiry = (await import('@/models/Inquiry')).default;
		await Inquiry.deleteMany({});
		await Inquiry.collection.insertMany([
			{
				name: 'Cũ',
				email: 'legacy@example.com',
				inquiryType: 'training',
				context: 'Lời nhắn cũ',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Mới',
				email: 'failed@example.com',
				inquiryType: 'training',
				context: 'Lời nhắn mới',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				adminEmailStatus: 'failed',
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Đã gửi',
				email: 'sent@example.com',
				inquiryType: 'training',
				context: 'Đã báo',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				adminEmailStatus: 'sent',
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);

		expect(await countFailedNotifications()).toBe(2);
	});
});
