import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import LoginStreak from '@/models/LoginStreak';

export interface StreakDTO {
	currentStreak: number;
	longestStreak: number;
	lastLoginDate: string;
	/** Recent login days (last 30) for heatmap / display */
	recentDays: string[];
}

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

	let doc = await LoginStreak.findOne({ userId: oid });

	if (!doc) {
		// First-ever login — use findOneAndUpdate with upsert to avoid race conditions
		doc = await LoginStreak.findOneAndUpdate(
			{ userId: oid },
			{
				$setOnInsert: {
					loginDays: [today],
					currentStreak: 1,
					longestStreak: 1,
					lastLoginDate: today,
				},
			},
			{ upsert: true, returnDocument: 'after' }
		);
		if (!doc) {
			return { currentStreak: 1, longestStreak: 1, lastLoginDate: today, recentDays: [today] };
		}
	} else if (doc.lastLoginDate === today) {
		// Already logged in today — no-op
	} else {
		// New day
		const isConsecutive = doc.lastLoginDate === yesterday;
		const newStreak = isConsecutive ? doc.currentStreak + 1 : 1;
		const newLongest = Math.max(doc.longestStreak, newStreak);

		// Keep only the most recent 90 days to limit document size
		const updatedDays = [...doc.loginDays, today].slice(-90);

		doc.loginDays = updatedDays;
		doc.currentStreak = newStreak;
		doc.longestStreak = newLongest;
		doc.lastLoginDate = today;
		await doc.save();
	}

	return {
		currentStreak: doc.currentStreak,
		longestStreak: doc.longestStreak,
		lastLoginDate: doc.lastLoginDate,
		recentDays: doc.loginDays.slice(-30),
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
