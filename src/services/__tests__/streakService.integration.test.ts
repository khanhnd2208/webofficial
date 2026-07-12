import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';

import { recordLogin, getStreak } from '@/services/streakService';

const USER_ID = new mongoose.Types.ObjectId().toString();

describe('streakService', () => {
	beforeEach(async () => {
		const LoginStreak = (await import('@/models/LoginStreak')).default;
		await LoginStreak.deleteMany({});
	});

	it('starts streak at 1 on first login', async () => {
		const result = await recordLogin(USER_ID);
		expect(result.currentStreak).toBe(1);
		expect(result.longestStreak).toBe(1);
		expect(result.recentDays).toHaveLength(1);
	});

	it('is idempotent when called twice on same day', async () => {
		await recordLogin(USER_ID);
		const second = await recordLogin(USER_ID);
		expect(second.currentStreak).toBe(1);
		expect(second.recentDays).toHaveLength(1);
	});

	it('returns zero streak for invalid user id', async () => {
		const result = await getStreak('not-a-valid-id');
		expect(result.currentStreak).toBe(0);
	});

	it('getStreak returns recorded data', async () => {
		await recordLogin(USER_ID);
		const streak = await getStreak(USER_ID);
		expect(streak.currentStreak).toBe(1);
		expect(streak.lastLoginDate).toBeTruthy();
	});
});
