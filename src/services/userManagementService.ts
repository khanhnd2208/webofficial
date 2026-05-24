/**
 * User Management Service
 * Provides paginated user list + per-user activity aggregation for admin UI.
 *
 * NOTE: Users created by MongoDBAdapter may not have createdAt/updatedAt fields.
 * We fall back to the ObjectId's embedded timestamp when those fields are absent.
 */

import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import LoginStreak from '@/models/LoginStreak';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types/user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely convert a value to ISO string.
 * Falls back to the ObjectId's embedded timestamp if the date is missing.
 * Returns null if neither is valid.
 */
function toISO(value: unknown, fallbackOid?: mongoose.Types.ObjectId): string | null {
	if (value) {
		const d = new Date(value as Date);
		if (!isNaN(d.getTime())) return d.toISOString();
	}
	if (fallbackOid) {
		try {
			return fallbackOid.getTimestamp().toISOString();
		} catch {
			// ignore
		}
	}
	return null;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface UserListItem {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt: string | null;
	vocabSetCount: number;
	currentStreak: number;
	longestStreak: number;
	lastActive: string | null;
}

export interface UserListResult {
	users: UserListItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface RecentVocabSet {
	id: string;
	title: string;
	termCount: number;
	isPublic: boolean;
	createdAt: string;
}

export interface UserDetail {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt: string | null;
	updatedAt: string | null;
	vocabSetCount: number;
	currentStreak: number;
	longestStreak: number;
	loginDaysLast30: number;
	lastLoginDate: string | null;
	recentVocabSets: RecentVocabSet[];
}

// ─── User List ────────────────────────────────────────────────────────────────

export async function getAdminUserList({
	page = 1,
	pageSize = 20,
	search = '',
	role,
	sortBy = 'createdAt',
	sortDir = 'desc',
}: {
	page?: number;
	pageSize?: number;
	search?: string;
	role?: UserRole | 'all';
	sortBy?: 'createdAt' | 'name' | 'email';
	sortDir?: 'asc' | 'desc';
}): Promise<UserListResult> {
	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (search.trim()) {
		const re = new RegExp(search.trim(), 'i');
		filter.$or = [{ name: re }, { email: re }];
	}
	if (role && role !== 'all') filter.role = role;

	const sortField = sortBy === 'name' ? 'name' : sortBy === 'email' ? 'email' : 'createdAt';
	const sortOrder = sortDir === 'asc' ? 1 : -1;
	const skip = (page - 1) * pageSize;

	const [rawUsers, total] = await Promise.all([
		User.find(filter)
			.sort({ [sortField]: sortOrder })
			.skip(skip)
			.limit(pageSize)
			.lean(),
		User.countDocuments(filter),
	]);

	if (rawUsers.length === 0) {
		return { users: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
	}

	const userIds = rawUsers.map((u) => u._id as mongoose.Types.ObjectId);
	const userIdStrings = userIds.map((id) => id.toString());

	const [vocabCounts, streaks] = await Promise.all([
		prisma.vocabSet.groupBy({
			by: ['ownerId'],
			where: { ownerId: { in: userIdStrings } },
			_count: { id: true },
		}),
		LoginStreak.find({ userId: { $in: userIds } })
			.select('userId currentStreak longestStreak lastLoginDate updatedAt')
			.lean(),
	]);

	const vocabMap = new Map(vocabCounts.map((v) => [v.ownerId, v._count.id]));
	const streakMap = new Map(streaks.map((s) => [s.userId.toString(), s]));

	const users: UserListItem[] = rawUsers.map((u) => {
		const uid = (u._id as mongoose.Types.ObjectId).toString();
		const oid = u._id as mongoose.Types.ObjectId;
		const streak = streakMap.get(uid);
		const lastActive = streak?.updatedAt
			? toISO(streak.updatedAt)
			: toISO(u.updatedAt, oid);
		return {
			id: uid,
			name: u.name,
			email: u.email,
			role: u.role as UserRole,
			image: u.image,
			createdAt: toISO(u.createdAt, oid),
			vocabSetCount: vocabMap.get(uid) ?? 0,
			currentStreak: streak?.currentStreak ?? 0,
			longestStreak: streak?.longestStreak ?? 0,
			lastActive,
		};
	});

	return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── User Detail ──────────────────────────────────────────────────────────────

export async function getAdminUserDetail(userId: string): Promise<UserDetail | null> {
	await dbConnect();

	let oid: mongoose.Types.ObjectId;
	try {
		oid = new mongoose.Types.ObjectId(userId);
	} catch {
		return null;
	}

	const user = await User.findById(oid).lean();
	if (!user) return null;

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);

	const [vocabSetCount, streak, recentVocabSets] = await Promise.all([
		prisma.vocabSet.count({ where: { ownerId: userId } }),
		LoginStreak.findOne({ userId: oid }).lean(),
		prisma.vocabSet.findMany({
			where: { ownerId: userId },
			orderBy: { createdAt: 'desc' },
			take: 5,
			select: {
				id: true,
				title: true,
				isArchived: true,
				createdAt: true,
				_count: { select: { words: { where: { isDeleted: false } } } },
			},
		}),
	]);

	const loginDaysLast30 = streak
		? streak.loginDays.filter((d: string) => d >= thirtyDaysStr).length
		: 0;

	return {
		id: userId,
		name: user.name,
		email: user.email,
		role: user.role as UserRole,
		image: user.image,
		createdAt: toISO(user.createdAt, oid),
		updatedAt: toISO(user.updatedAt, oid),
		vocabSetCount,
		currentStreak: streak?.currentStreak ?? 0,
		longestStreak: streak?.longestStreak ?? 0,
		loginDaysLast30,
		lastLoginDate: streak?.lastLoginDate ? toISO(streak.lastLoginDate) : null,
		recentVocabSets: recentVocabSets.map((v) => ({
			id: v.id,
			title: v.title,
			termCount: v._count.words,
			isPublic: !v.isArchived,
			createdAt: v.createdAt.toISOString(),
		})),
	};
}

// ─── Change Role ──────────────────────────────────────────────────────────────

export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
	await dbConnect();
	const result = await User.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { role } });
	return result.modifiedCount > 0;
}
