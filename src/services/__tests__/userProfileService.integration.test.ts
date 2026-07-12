import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ensureUserProfile, updateMyProfile } from '@/services/userProfileService';

vi.mock('next/cache', () => ({
	unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}));

const IDENTITY = {
	userId: 'profile-user-001',
	email: 'profile@test.com',
	name: 'Profile User',
	image: 'https://example.com/avatar.png',
};

describe('userProfileService', () => {
	beforeEach(async () => {
		const UserProfile = (await import('@/models/UserProfile')).default;
		await UserProfile.deleteMany({});
	});

	it('creates profile on first ensureUserProfile call', async () => {
		const profile = await ensureUserProfile(IDENTITY);
		expect(profile.userId).toBe(IDENTITY.userId);
		expect(profile.email).toBe(IDENTITY.email);
		expect(profile.name).toBe(IDENTITY.name);
	});

	it('syncs name/email on subsequent login', async () => {
		await ensureUserProfile(IDENTITY);
		const updated = await ensureUserProfile({
			...IDENTITY,
			name: 'Updated Name',
		});
		expect(updated.name).toBe('Updated Name');
	});

	it('updates profile fields', async () => {
		await ensureUserProfile(IDENTITY);
		const updated = await updateMyProfile(IDENTITY, {
			university: 'Hanoi University',
			bio: 'Hello world',
		});
		expect(updated.university).toBe('Hanoi University');
		expect(updated.bio).toBe('Hello world');
	});

	it('rejects future date of birth', async () => {
		await ensureUserProfile(IDENTITY);
		const future = new Date();
		future.setFullYear(future.getFullYear() + 1);
		await expect(
			updateMyProfile(IDENTITY, {
				dateOfBirth: future.toISOString(),
			}),
		).rejects.toThrow('Ngày sinh không thể ở tương lai.');
	});
});
