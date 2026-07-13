/**
 * Admin Dashboard Service
 * Aggregates cross-model stats for the admin overview page.
 */

import { prisma } from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import { getAdminDashboardStats } from '@/services/postService';

export interface AdminOverviewStats {
	posts: {
		total: number;
		published: number;
		drafts: number;
		totalViews: number;
		totalReactions: number;
	};
	users: {
		/** Count of distinct users with at least one ACTIVE enrollment. */
		activeEnrollments: number;
	};
	inquiries: {
		newCount: number;
		qualifiedCount: number;
		byType: Record<string, number>;
	};
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
	await dbConnect();

	const [postStats, activeEnrollmentCount, newCount, qualifiedCount, byTypeRows] = await Promise.all([
		getAdminDashboardStats(),
		prisma.enrollment
			.groupBy({
				by: ['userId'],
				where: { status: 'ACTIVE' },
			})
			.then((rows) => rows.length),
		Inquiry.countDocuments({ status: 'NEW' }),
		Inquiry.countDocuments({ status: 'QUALIFIED' }),
		Inquiry.aggregate<{ _id: string; count: number }>([
			{ $group: { _id: '$inquiryType', count: { $sum: 1 } } },
		]),
	]);

	const byType: Record<string, number> = {};
	for (const row of byTypeRows) {
		byType[row._id] = row.count;
	}

	return {
		posts: {
			total: postStats.totalPosts,
			published: postStats.published,
			drafts: postStats.drafts,
			totalViews: postStats.totalViews,
			totalReactions: postStats.totalReactions,
		},
		users: {
			activeEnrollments: activeEnrollmentCount,
		},
		inquiries: {
			newCount,
			qualifiedCount,
			byType,
		},
	};
}
