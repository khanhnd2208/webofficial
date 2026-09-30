/**
 * Admin Dashboard Service
 * Aggregates stats for the focused operating dashboard:
 * Website and Active Recall. Teaching has its own workspace in My Space.
 */

import { prisma } from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/models/Inquiry';

export interface AdminOverviewStats {
	website: {
		newInquiries: number;
	};
	activeRecall: {
		decks: number;
		published: number;
	};
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
	await dbConnect();

	const [newInquiries, decks, published] = await Promise.all([
		Inquiry.countDocuments({ status: 'NEW' }),
		prisma.activeRecallDeck.count(),
		prisma.activeRecallDeck.count({ where: { status: 'PUBLISHED' } }),
	]);

	return {
		website: { newInquiries },
		activeRecall: { decks, published },
	};
}

export async function countFailedNotifications(): Promise<number> {
	await dbConnect();
	// Same rule as failedNotificationFilter in inquiryService: a dedicated failed
	// flag wins, and a missing flag falls back to the legacy emailStatus.
	return Inquiry.countDocuments({
		$or: [{ adminEmailStatus: 'failed' }, { adminEmailStatus: null, emailStatus: 'failed' }],
	});
}
