/**
 * Admin Dashboard Service
 * Aggregates stats for the focused operating dashboard:
 * new contact messages, active classes and Active Recall decks.
 * Teaching itself has its own workspace in My Space.
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

export interface AdminActiveClass {
	id: string;
	courseCode: string;
	courseName: string;
	classCode: string;
	groupNo: string;
	term: string;
	students: number;
	/** Slug of the student page, only while the class is shared with students. */
	sharedSlug: string | null;
}

/**
 * Active classes of active courses, most recently touched first. Read straight from Prisma so
 * the shared admin overview does not depend on the Teaching feature internals.
 */
export async function listActiveClasses(limit = 8): Promise<AdminActiveClass[]> {
	const rows = await prisma.teachingClass.findMany({
		where: { status: 'ACTIVE', course: { status: 'ACTIVE' } },
		orderBy: { updatedAt: 'desc' },
		take: limit,
		select: {
			id: true,
			courseCode: true,
			courseName: true,
			classCode: true,
			groupNo: true,
			term: true,
			publicSlug: true,
			attendanceVisible: true,
			_count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
		},
	});
	return rows.map(({ _count, publicSlug, attendanceVisible, ...row }) => ({
		...row,
		students: _count.enrollments,
		sharedSlug: attendanceVisible ? publicSlug : null,
	}));
}

/** NEW contact messages, for the inbox count in the admin sidebar. */
export async function countNewInquiries(): Promise<number> {
	await dbConnect();
	return Inquiry.countDocuments({ status: 'NEW' });
}

export async function countFailedNotifications(): Promise<number> {
	await dbConnect();
	return Inquiry.countDocuments(failedNotificationFilter());
}
