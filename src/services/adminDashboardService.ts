/**
 * Admin Dashboard Service
 * Aggregates stats for the focused operating dashboard:
 * Website, Teaching, and Active Recall.
 */

import { prisma } from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/models/Inquiry';

export interface AdminOverviewStats {
	website: {
		newInquiries: number;
	};
	teaching: {
		activeClasses: number;
	};
	activeRecall: {
		decks: number;
		published: number;
	};
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
	await dbConnect();

	const [newInquiries, activeClasses, decks, published] = await Promise.all([
		Inquiry.countDocuments({ status: 'NEW' }),
		prisma.teachingClass.count({ where: { status: 'ACTIVE' } }),
		prisma.activeRecallDeck.count(),
		prisma.activeRecallDeck.count({ where: { status: 'PUBLISHED' } }),
	]);

	return {
		website: { newInquiries },
		teaching: { activeClasses },
		activeRecall: { decks, published },
	};
}
