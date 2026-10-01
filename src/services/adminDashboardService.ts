/**
 * Admin Dashboard Service
 * Aggregates stats for the focused operating dashboard:
 * Website and Active Recall. Teaching has its own workspace in My Space.
 */

import { prisma } from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import { failedNotificationFilter } from '@/services/inquiryFilters';

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
	return Inquiry.countDocuments(failedNotificationFilter());
}
