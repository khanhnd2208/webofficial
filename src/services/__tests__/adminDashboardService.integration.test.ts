import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { prisma } from '@/lib/prisma';
import {
	countFailedNotifications,
	countNewInquiries,
	getAdminOverviewStats,
	listActiveClasses,
} from '@/services/adminDashboardService';

vi.mock('next/cache', () => ({
	unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}));

describe('adminDashboardService', () => {
	beforeEach(async () => {
		const Post = (await import('@/models/Post')).default;
		const User = (await import('@/models/User')).default;
		await Post.deleteMany({});
		await User.deleteMany({});
	});

	it('returns zero counts on empty database for the operating dashboard', async () => {
		const stats = await getAdminOverviewStats();
		expect(stats.website.newInquiries).toBe(0);
		expect(typeof stats.activeRecall.decks).toBe('number');
		expect(typeof stats.activeRecall.published).toBe('number');
	});

	it('counts a failed admin notification and a legacy failure, and ignores a sent dedicated status', async () => {
		const Inquiry = (await import('@/models/Inquiry')).default;
		await Inquiry.deleteMany({});
		await Inquiry.collection.insertMany([
			{
				name: 'Cũ',
				email: 'legacy@example.com',
				inquiryType: 'training',
				context: 'Lời nhắn cũ',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Mới',
				email: 'failed@example.com',
				inquiryType: 'training',
				context: 'Lời nhắn mới',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				adminEmailStatus: 'failed',
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Đã gửi',
				email: 'sent@example.com',
				inquiryType: 'training',
				context: 'Đã báo',
				agreedScope: false,
				agreedPrivacy: true,
				status: 'NEW',
				statusHistory: [{ status: 'NEW', at: new Date() }],
				adminEmailStatus: 'sent',
				emailStatus: 'failed',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);

		expect(await countFailedNotifications()).toBe(2);
	});

	it('counts only NEW contact messages for the inbox badge', async () => {
		const Inquiry = (await import('@/models/Inquiry')).default;
		await Inquiry.deleteMany({});
		const base = {
			email: 'badge@example.com',
			inquiryType: 'training',
			context: 'Lời nhắn',
			agreedScope: false,
			agreedPrivacy: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await Inquiry.collection.insertMany([
			{ ...base, name: 'Mới', status: 'NEW' },
			{ ...base, name: 'Đã xem', status: 'READ' },
		]);

		expect(await countNewInquiries()).toBe(1);
	});

	it('lists active classes of active courses with their active students', async () => {
		const suffix = randomUUID();
		const active = await prisma.teachingCourse.create({
			data: { courseCode: `admin-active-${suffix}`, courseName: 'Môn đang dạy' },
		});
		const archived = await prisma.teachingCourse.create({
			data: {
				courseCode: `admin-archived-${suffix}`,
				courseName: 'Môn đã lưu trữ',
				status: 'ARCHIVED',
			},
		});
		const classFor = (
			course: typeof active,
			code: string,
			status: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE',
		) =>
			prisma.teachingClass.create({
				data: {
					courseId: course.id,
					courseCode: course.courseCode,
					courseName: course.courseName,
					groupNo: code,
					classCode: code,
					term: 'HK1',
					status,
				},
			});
		try {
			const shown = await classFor(active, 'A1');
			await classFor(active, 'A2', 'ARCHIVED');
			await classFor(archived, 'B1');

			const ids = new Set([active.id, archived.id]);
			const all = await prisma.teachingClass.findMany({
				where: { courseId: { in: [...ids] } },
				select: { id: true },
			});
			const listed = (await listActiveClasses(1000)).filter((row) =>
				all.some((item) => item.id === row.id),
			);

			expect(listed).toEqual([
				{
					id: shown.id,
					courseCode: active.courseCode,
					courseName: 'Môn đang dạy',
					classCode: 'A1',
					groupNo: 'A1',
					term: 'HK1',
					students: 0,
				},
			]);
		} finally {
			await prisma.teachingClass.deleteMany({
				where: { courseId: { in: [active.id, archived.id] } },
			});
			await prisma.teachingCourse.deleteMany({ where: { id: { in: [active.id, archived.id] } } });
		}
	});
});
