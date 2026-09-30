import type { Enrollment, EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { EnrollmentDTO } from '@/features/courses/types';

function mapEnrollment(
	row: Enrollment & { course?: { title: string; slug: string } },
): EnrollmentDTO {
	return {
		id: row.id,
		courseId: row.courseId,
		userId: row.userId,
		status: row.status,
		enrolledAt: row.enrolledAt.toISOString(),
		revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
		courseTitle: row.course?.title,
		courseSlug: row.course?.slug,
	};
}

export async function listByCourse(courseId: string): Promise<EnrollmentDTO[]> {
	const rows = await prisma.enrollment.findMany({
		where: { courseId },
		include: { course: { select: { title: true, slug: true } } },
		orderBy: { enrolledAt: 'desc' },
	});
	return rows.map(mapEnrollment);
}

export async function listByUser(
	userId: string,
	status?: EnrollmentStatus,
): Promise<EnrollmentDTO[]> {
	const rows = await prisma.enrollment.findMany({
		where: { userId, ...(status ? { status } : {}) },
		include: { course: { select: { title: true, slug: true } } },
		orderBy: { enrolledAt: 'desc' },
	});
	return rows.map(mapEnrollment);
}

export async function findByCourseAndUser(courseId: string, userId: string) {
	return prisma.enrollment.findUnique({
		where: { courseId_userId: { courseId, userId } },
	});
}

export async function findById(id: string) {
	return prisma.enrollment.findUnique({
		where: { id },
		include: { course: { select: { title: true, slug: true, status: true } } },
	});
}

export async function createEnrollment(courseId: string, userId: string) {
	return prisma.enrollment.create({
		data: { courseId, userId, status: 'ACTIVE' },
		include: { course: { select: { title: true, slug: true } } },
	});
}

export async function setEnrollmentStatus(
	id: string,
	status: EnrollmentStatus,
	revokedAt: Date | null,
) {
	return prisma.enrollment.update({
		where: { id },
		data: { status, revokedAt },
		include: { course: { select: { title: true, slug: true } } },
	});
}

export { mapEnrollment };
