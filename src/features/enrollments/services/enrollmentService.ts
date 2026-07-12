import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import * as courseRepo from '@/features/courses/repositories/courseRepository';
import type { EnrollmentDTO, EnrollmentAdminDTO } from '@/features/courses/types';

import * as repo from '../repositories/enrollmentRepository';

export async function listCourseEnrollments(courseId: string): Promise<EnrollmentDTO[]> {
	const course = await courseRepo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	return repo.listByCourse(courseId);
}

/** Admin variant: same query but hydrates user name/email/image in a single batch Mongo lookup. */
export async function listCourseEnrollmentsAdmin(courseId: string): Promise<EnrollmentAdminDTO[]> {
	const course = await courseRepo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);

	const enrollments = await repo.listByCourse(courseId);
	if (enrollments.length === 0) return [];

	// Batch-fetch all users from Mongo in one query.
	const { default: User } = await import('@/models/User');
	const dbConnect = (await import('@/lib/dbConnect')).default;
	await dbConnect();

	const userIds = [...new Set(enrollments.map((e) => e.userId))];
	const users = await User.find({ _id: { $in: userIds } })
		.select('_id name email image')
		.lean();
	const userMap = new Map(users.map((u) => [String(u._id), u]));

	return enrollments.map((e): EnrollmentAdminDTO => {
		const u = userMap.get(e.userId);
		return {
			...e,
			user: u
				? { id: String(u._id), name: u.name ?? '', email: u.email ?? '', image: u.image ?? null }
				: null,
		};
	});
}

export async function enrollUser(courseId: string, userId: string): Promise<EnrollmentDTO> {
	const course = await courseRepo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	if (course.status === 'ARCHIVED') {
		throw new AppError('Khóa học đã lưu trữ — không nhận ghi danh mới', 400);
	}

	const existing = await repo.findByCourseAndUser(courseId, userId);
	if (existing) {
		if (existing.status === 'ACTIVE') {
			throw new AppError('Học viên đã được ghi danh', 409);
		}
		const restored = await repo.setEnrollmentStatus(existing.id, 'ACTIVE', null);
		return repo.mapEnrollment(restored);
	}

	const created = await repo.createEnrollment(courseId, userId);
	return repo.mapEnrollment(created);
}

export async function revokeEnrollment(enrollmentId: string): Promise<EnrollmentDTO> {
	const existing = await repo.findById(enrollmentId);
	if (!existing) throw new AppError('Không tìm thấy ghi danh', 404);
	if (existing.status === 'REVOKED') {
		return repo.mapEnrollment(existing);
	}
	const updated = await repo.setEnrollmentStatus(enrollmentId, 'REVOKED', new Date());
	return repo.mapEnrollment(updated);
}

export async function restoreEnrollment(enrollmentId: string): Promise<EnrollmentDTO> {
	const existing = await repo.findById(enrollmentId);
	if (!existing) throw new AppError('Không tìm thấy ghi danh', 404);
	if (existing.course.status === 'ARCHIVED') {
		throw new AppError('Khóa học đã lưu trữ — không thể khôi phục ghi danh', 400);
	}
	if (existing.status === 'ACTIVE') {
		return repo.mapEnrollment(existing);
	}
	const updated = await repo.setEnrollmentStatus(enrollmentId, 'ACTIVE', null);
	return repo.mapEnrollment(updated);
}

/** Returns true if user has ACTIVE enrollment on the course. */
export async function hasActiveEnrollment(courseId: string, userId: string): Promise<boolean> {
	const row = await repo.findByCourseAndUser(courseId, userId);
	return row?.status === 'ACTIVE';
}

export async function listActiveEnrollmentsForUser(userId: string): Promise<EnrollmentDTO[]> {
	return repo.listByUser(userId, 'ACTIVE');
}

/** Search users by email/name for enrollment UI — Mongo via existing User model if available. */
export async function searchUsersForEnrollment(query: string) {
	const q = query.trim();
	if (q.length < 2) return [];

	// Lazy import to keep Prisma teaching layer free of mongoose at module top when unused.
	const { default: User } = await import('@/models/User');
	const dbConnect = (await import('@/lib/dbConnect')).default;
	await dbConnect();

	const users = await User.find({
		$or: [
			{ email: { $regex: q, $options: 'i' } },
			{ name: { $regex: q, $options: 'i' } },
		],
	})
		.select('_id name email image role')
		.limit(20)
		.lean();

	return users.map((u) => ({
		id: String(u._id),
		name: u.name ?? '',
		email: u.email ?? '',
		image: u.image ?? null,
		role: u.role ?? 'student',
	}));
}

export async function getCourseTitleMap(courseIds: string[]) {
	if (courseIds.length === 0) return new Map<string, string>();
	const courses = await prisma.course.findMany({
		where: { id: { in: courseIds } },
		select: { id: true, title: true },
	});
	return new Map(courses.map((c) => [c.id, c.title]));
}
