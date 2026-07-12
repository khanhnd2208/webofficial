/**
 * Admin Dashboard Service
 * Aggregates cross-model stats for the admin overview page.
 */

import { prisma } from '@/lib/prisma';
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
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
	const [postStats, activeEnrollmentCount] = await Promise.all([
		getAdminDashboardStats(),
		// Count distinct users with at least one ACTIVE enrollment (no N+1, single Prisma query).
		prisma.enrollment.groupBy({
			by: ['userId'],
			where: { status: 'ACTIVE' },
		}).then((rows) => rows.length),
	]);

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
	};
}
