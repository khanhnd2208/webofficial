/**
 * User Management Service
 * Provides paginated user list + per-user activity aggregation for admin UI.
 */

import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Comment from '@/models/Comment';
import VocabSet from '@/models/VocabSet';
import LoginStreak from '@/models/LoginStreak';
import type { UserRole } from '@/types/user';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface UserListItem {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt: string;
	// activity counts
	commentCount: number;
	vocabSetCount: number;
	currentStreak: number;
	longestStreak: number;
	lastActive: string | null; // ISO string of most recent action
}

export interface UserListResult {
	users: UserListItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface RecentComment {
	id: string;
	postTitle: string;
	postSlug: string;
	content: string;
	status: string;
	createdAt: string;
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
	createdAt: string;
	updatedAt: string;
	// totals
	commentCount: number;
	vocabSetCount: number;
	currentStreak: number;
	longestStreak: number;
	loginDaysLast30: number; // how many days logged in over past 30 days
	lastLoginDate: string | null;
	// recent activity
	recentComments: RecentComment[];
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

	// Build query filter
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

	// Bulk-fetch activity data for this page of users
	const userIds = rawUsers.map((u) => u._id as mongoose.Types.ObjectId);
	const userIdStrings = userIds.map((id) => id.toString());

	const [commentCounts, vocabCounts, streaks] = await Promise.all([
		// Comment counts grouped by userId (stored as string)
		Comment.aggregate<{ _id: string; count: number }>([
			{ $match: { userId: { $in: userIdStrings } } },
			{ $group: { _id: '$userId', count: { $sum: 1 } } },
		]),
		// VocabSet counts grouped by ownerId (ObjectId)
		VocabSet.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
			{ $match: { ownerId: { $in: userIds } } },
			{ $group: { _id: '$ownerId', count: { $sum: 1 } } },
		]),
		// Streak info
		LoginStreak.find({ userId: { $in: userIds } })
			.select('userId currentStreak longestStreak lastLoginDate updatedAt')
			.lean(),
	]);

	// Index for fast lookup
	const commentMap = new Map(commentCounts.map((c) => [c._id, c.count]));
	const vocabMap = new Map(vocabCounts.map((v) => [v._id.toString(), v.count]));
	const streakMap = new Map(streaks.map((s) => [s.userId.toString(), s]));

	const users: UserListItem[] = rawUsers.map((u) => {
		const uid = (u._id as mongoose.Types.ObjectId).toString();
		const streak = streakMap.get(uid);
		const lastActive = streak?.updatedAt
			? new Date(streak.updatedAt).toISOString()
			: u.updatedAt
			? new Date(u.updatedAt as Date).toISOString()
			: null;
		return {
			id: uid,
			name: u.name,
			email: u.email,
			role: u.role as UserRole,
			image: u.image,
			createdAt: new Date(u.createdAt as Date).toISOString(),
			commentCount: commentMap.get(uid) ?? 0,
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

	const [
		commentCount,
		vocabSetCount,
		streak,
		recentComments,
		recentVocabSets,
	] = await Promise.all([
		Comment.countDocuments({ userId }),
		VocabSet.countDocuments({ ownerId: oid }),
		LoginStreak.findOne({ userId: oid }).lean(),
		Comment.find({ userId })
			.sort({ createdAt: -1 })
			.limit(5)
			.select('postTitle postSlug content status createdAt')
			.lean(),
		VocabSet.find({ ownerId: oid })
			.sort({ createdAt: -1 })
			.limit(5)
			.select('title termCount isPublic createdAt')
			.lean(),
	]);

	// Count how many unique days user logged in over past 30 days
	const loginDaysLast30 = streak
		? streak.loginDays.filter((d: string) => d >= thirtyDaysStr).length
		: 0;

	return {
		id: userId,
		name: user.name,
		email: user.email,
		role: user.role as UserRole,
		image: user.image,
		createdAt: new Date(user.createdAt as Date).toISOString(),
		updatedAt: new Date(user.updatedAt as Date).toISOString(),
		commentCount,
		vocabSetCount,
		currentStreak: streak?.currentStreak ?? 0,
		longestStreak: streak?.longestStreak ?? 0,
		loginDaysLast30,
		lastLoginDate: streak?.lastLoginDate ?? null,
		recentComments: recentComments.map((c) => ({
			id: (c._id as mongoose.Types.ObjectId).toString(),
			postTitle: c.postTitle ?? c.postSlug,
			postSlug: c.postSlug,
			content: c.content.slice(0, 120),
			status: c.status,
			createdAt: new Date(c.createdAt as Date).toISOString(),
		})),
		recentVocabSets: recentVocabSets.map((v) => ({
			id: (v._id as mongoose.Types.ObjectId).toString(),
			title: v.title,
			termCount: v.termCount,
			isPublic: v.isPublic,
			createdAt: new Date(v.createdAt as Date).toISOString(),
		})),
	};
}

// ─── Change Role ──────────────────────────────────────────────────────────────

export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
	await dbConnect();
	const result = await User.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { role } });
	return result.modifiedCount > 0;
}
