import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const COHORT_TABLE_SORTS = [
	'name',
	'status',
	'createdAt',
	'updatedAt',
	'members',
	'attempts',
] as const;
export type CohortTableSort = (typeof COHORT_TABLE_SORTS)[number];

function cohortWhere(
	filter: { courseId?: string; q?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } = {},
): Prisma.MyClassCohortWhereInput {
	return {
		...(filter.courseId ? { courseId: filter.courseId } : {}),
		...(filter.status ? { status: filter.status } : {}),
		...(filter.q
			? {
					OR: [
						{ name: { contains: filter.q, mode: 'insensitive' } },
						{ term: { contains: filter.q, mode: 'insensitive' } },
					],
				}
			: {}),
	};
}

export async function listCohorts(
	filter:
		| string
		| { courseId?: string; q?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } = {},
) {
	const resolved = typeof filter === 'string' ? { courseId: filter } : filter;
	return prisma.myClassCohort.findMany({
		where: cohortWhere(resolved),
		orderBy: { createdAt: 'desc' },
		take: 200,
		include: {
			course: { select: { id: true, title: true } },
			_count: { select: { members: true, attempts: true } },
		},
	});
}

export async function listCohortTable(
	filter: {
		courseId?: string;
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		sortBy?: CohortTableSort;
		sortDir?: 'asc' | 'desc';
		skip?: number;
		take?: number;
	} = {},
) {
	const where = cohortWhere(filter);
	const sortDir = filter.sortDir ?? 'desc';
	const orderBy =
		filter.sortBy === 'members'
			? { members: { _count: sortDir } }
			: filter.sortBy === 'attempts'
				? { attempts: { _count: sortDir } }
				: { [filter.sortBy ?? 'createdAt']: sortDir };
	const [items, total] = await Promise.all([
		prisma.myClassCohort.findMany({
			where,
			orderBy,
			skip: filter.skip,
			take: filter.take,
			select: {
				id: true,
				name: true,
				term: true,
				status: true,
				courseId: true,
				createdAt: true,
				updatedAt: true,
				course: { select: { title: true } },
				_count: { select: { members: true, attempts: true } },
			},
		}),
		prisma.myClassCohort.count({ where }),
	]);
	return { items, total };
}

export async function findCohort(id: string) {
	return prisma.myClassCohort.findUnique({
		where: { id },
		include: {
			course: true,
			members: { orderBy: { createdAt: 'asc' } },
			_count: { select: { attempts: true } },
		},
	});
}

export async function createCohort(data: {
	courseId: string;
	name: string;
	term: string;
	startsAt?: Date | null;
	endsAt?: Date | null;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
	return prisma.myClassCohort.create({ data });
}

export async function updateCohort(
	id: string,
	data: Partial<{
		name: string;
		term: string;
		startsAt: Date | null;
		endsAt: Date | null;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	}>,
) {
	return prisma.myClassCohort.update({ where: { id }, data });
}

export async function archiveCohortWithMemberships(id: string) {
	return prisma.$transaction(async (tx) => {
		const cohort = await tx.myClassCohort.update({ where: { id }, data: { status: 'ARCHIVED' } });
		await tx.myClassMembership.updateMany({
			where: { cohortId: id, status: { in: ['PENDING', 'ACTIVE'] } },
			data: { status: 'REMOVED', activeCourseUserKey: null, removedAt: new Date() },
		});
		return cohort;
	});
}

export async function listMemberships(cohortId: string) {
	return prisma.myClassMembership.findMany({
		where: { cohortId },
		orderBy: { createdAt: 'asc' },
	});
}

export async function findMembership(id: string) {
	return prisma.myClassMembership.findUnique({ where: { id }, include: { cohort: true } });
}

export async function findActiveMembership(courseId: string, userId: string) {
	return prisma.myClassMembership.findUnique({
		where: { activeCourseUserKey: `${courseId}:${userId}` },
	});
}

export async function findPendingByEmail(email: string) {
	return prisma.myClassMembership.findMany({
		where: { status: 'PENDING', email: { equals: email, mode: 'insensitive' } },
		include: { cohort: true, course: true },
		orderBy: { createdAt: 'asc' },
	});
}

export async function createMembership(data: {
	cohortId: string;
	courseId: string;
	email: string;
	name: string;
	userId?: string | null;
	status?: 'PENDING' | 'ACTIVE' | 'REMOVED';
	activeCourseUserKey?: string | null;
	activatedAt?: Date | null;
}) {
	return prisma.myClassMembership.create({ data });
}

export async function updateMembership(
	id: string,
	data: Partial<{
		name: string;
		userId: string | null;
		status: 'PENDING' | 'ACTIVE' | 'REMOVED';
		activeCourseUserKey: string | null;
		activatedAt: Date | null;
		removedAt: Date | null;
		email: string;
	}>,
) {
	return prisma.myClassMembership.update({ where: { id }, data });
}

export async function findMembershipInCohort(cohortId: string, email: string) {
	return prisma.myClassMembership.findUnique({
		where: { cohortId_email: { cohortId, email } },
	});
}

export async function findActiveByCourseEmail(courseId: string, email: string) {
	return prisma.myClassMembership.findFirst({
		where: { courseId, email, status: 'ACTIVE' },
	});
}

export async function findActiveByCourseUser(courseId: string, userId: string) {
	return prisma.myClassMembership.findUnique({
		where: { activeCourseUserKey: `${courseId}:${userId}` },
		include: { cohort: true },
	});
}
