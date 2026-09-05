import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getAdminOverviewStats } from '@/services/adminDashboardService';

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
});
