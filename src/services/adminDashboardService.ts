/**
 * Admin Dashboard Service
 * Aggregates cross-model stats for the admin overview page.
 */

import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getAdminDashboardStats } from '@/services/postService';
import { getMessageCounts } from '@/services/feedbackMessageService';
import { getPendingCommentCount } from '@/services/commentService';

export interface AdminOverviewStats {
	posts: {
		total: number;
		published: number;
		drafts: number;
		totalViews: number;
		totalReactions: number;
	};
	messages: {
		total: number;
		pending: number;
		replied: number;
		closed: number;
	};
	comments: {
		pending: number;
	};
	users: {
		total: number;
		students: number;
	};
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
	await dbConnect();

	const [postStats, msgCounts, commentPending, userCounts] = await Promise.all([
		getAdminDashboardStats(),
		getMessageCounts(),
		getPendingCommentCount(),
		Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: 'student' }),
		]),
	]);

	return {
		posts: {
			total: postStats.totalPosts,
			published: postStats.published,
			drafts: postStats.drafts,
			totalViews: postStats.totalViews,
			totalReactions: postStats.totalReactions,
		},
		messages: msgCounts,
		comments: {
			pending: commentPending,
		},
		users: {
			total: userCounts[0],
			students: userCounts[1],
		},
	};
}
