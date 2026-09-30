import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import LoginStreak from '@/models/LoginStreak';
import type { StreakDTO } from '@/types/streak';

export type { StreakDTO };

/** Get today's date string in YYYY-MM-DD (UTC) */
function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Get yesterday's date string in YYYY-MM-DD (UTC) */
function yesterdayStr(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

/**
 * Record a login for today. Idempotent — calling multiple times
 * on the same day only counts once.
 */
export async function recordLogin(userId: string): Promise<StreakDTO> {
	await dbConnect();
	if (!mongoose.isValidObjectId(userId)) {
		return { currentStreak: 0, longestStreak: 0, lastLoginDate: '', recentDays: [] };
	}

	const oid = new mongoose.Types.ObjectId(userId);
	const today = todayStr();
	const yesterday = yesterdayStr();

	// Try to create a brand-new streak doc (first-ever login)
	const doc = await LoginStreak.findOneAndUpdate(
		{ userId: oid },
		{
			$setOnInsert: {
				loginDays: [today],
				currentStreak: 1,
				longestStreak: 1,
				lastLoginDate: today,
			},
		},
		{ upsert: true, returnDocument: 'after' },
	);

	if (!doc) {
		return { currentStreak: 1, longestStreak: 1, lastLoginDate: today, recentDays: [today] };
	}

	// Already logged in today — no-op
	if (doc.lastLoginDate === today) {
		return {
			currentStreak: doc.currentStreak,
			longestStreak: doc.longestStreak,
			lastLoginDate: doc.lastLoginDate,
			recentDays: doc.loginDays.slice(-30),
		};
	}

	// New day — atomic update to prevent race conditions from multiple tabs
	const isConsecutive = doc.lastLoginDate === yesterday;
	const newStreak = isConsecutive ? doc.currentStreak + 1 : 1;
	const newLongest = Math.max(doc.longestStreak, newStreak);

	const updated = await LoginStreak.findOneAndUpdate(
		{ userId: oid, lastLoginDate: { $ne: today } },
		{
			$push: { loginDays: { $each: [today], $slice: -90 } },
			$set: {
				currentStreak: newStreak,
				longestStreak: newLongest,
				lastLoginDate: today,
			},
		},
		{ returnDocument: 'after' },
	);

	if (!updated) {
		// Another request already updated today — re-read
		const fresh = await LoginStreak.findOne({ userId: oid });
		if (!fresh) return { currentStreak: 0, longestStreak: 0, lastLoginDate: '', recentDays: [] };
		return {
			currentStreak: fresh.currentStreak,
			longestStreak: fresh.longestStreak,
			lastLoginDate: fresh.lastLoginDate,
			recentDays: fresh.loginDays.slice(-30),
		};
	}

	return {
		currentStreak: updated.currentStreak,
		longestStreak: updated.longestStreak,
		lastLoginDate: updated.lastLoginDate,
		recentDays: updated.loginDays.slice(-30),
	};
}

/**
 * Get the current streak data for a user (read-only).
 */
export async function getStreak(userId: string): Promise<StreakDTO> {
	await dbConnect();
	if (!mongoose.isValidObjectId(userId)) {
		return { currentStreak: 0, longestStreak: 0, lastLoginDate: '', recentDays: [] };
	}

	const doc = await LoginStreak.findOne({
		userId: new mongoose.Types.ObjectId(userId),
	}).lean();

	if (!doc) {
		return { currentStreak: 0, longestStreak: 0, lastLoginDate: '', recentDays: [] };
	}

	// Check if streak is still active (last login was today or yesterday)
	const today = todayStr();
	const yesterday = yesterdayStr();
	const isActive = doc.lastLoginDate === today || doc.lastLoginDate === yesterday;

	return {
		currentStreak: isActive ? doc.currentStreak : 0,
		longestStreak: doc.longestStreak,
		lastLoginDate: doc.lastLoginDate,
		recentDays: doc.loginDays.slice(-30),
	};
}
