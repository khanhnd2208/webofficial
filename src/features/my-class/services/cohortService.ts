import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { mongoClientPromise } from '@/lib/mongodbClient';

import { listSkip, parseListQuery, parseOptionalSortDir, parsePublishStatus, toListPage } from '../domain/listQuery';
import { activeCourseUserKey, normalizeEmail } from '../domain/normalize';
import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/cohortRepository';
import { COHORT_TABLE_SORTS } from '../repositories/cohortRepository';
import * as courseRepo from '../repositories/courseRepository';
import type { CreateCohortInput, UpdateCohortInput } from '../schemas';
import type { AdminCohortTablePage } from '../types';

export interface RosterPreviewRow {
	email: string;
	name: string;
	ok: boolean;
	account: 'pending' | 'existing';
	errors: string[];
	userId?: string;
}

export async function listAdminCohorts(
	filter:
		| string
		| { courseId?: string; q?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } = {},
) {
	return repo.listCohorts(filter);
}

export async function listAdminCohortTable(
	filter: {
		courseId?: string;
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
	} = {},
): Promise<AdminCohortTablePage> {
	const query = parseListQuery(
		{
			q: filter.q,
			page: filter.page ? String(filter.page) : undefined,
			pageSize: filter.pageSize ? String(filter.pageSize) : undefined,
			sortBy: filter.sortBy,
			sortDir: filter.sortDir,
		},
		{ sortFields: COHORT_TABLE_SORTS, defaultSortBy: 'createdAt' },
	);
	const { items, total } = await repo.listCohortTable({
		courseId: filter.courseId,
		q: query.q ?? filter.q,
		status: filter.status,
		sortBy: query.sortBy as (typeof COHORT_TABLE_SORTS)[number],
		sortDir: query.sortDir,
		skip: listSkip(query.page, query.pageSize),
		take: query.pageSize,
	});
	return toListPage(
		items.map((cohort) => ({
			id: cohort.id,
			name: cohort.name,
			term: cohort.term,
			status: cohort.status,
			courseId: cohort.courseId,
			courseTitle: cohort.course.title,
			memberCount: cohort._count.members,
			attemptCount: cohort._count.attempts,
			createdAt: cohort.createdAt.toISOString(),
			updatedAt: cohort.updatedAt.toISOString(),
		})),
		total,
		query.page,
		query.pageSize,
	);
}

export function cohortTableQueryFromSearch(search: {
	q?: string;
	status?: string;
	courseId?: string;
	page?: string;
	pageSize?: string;
	sortBy?: string;
	sortDir?: string;
}) {
	return {
		q: search.q,
		status: parsePublishStatus(search.status),
		courseId: search.courseId || undefined,
		page: search.page ? Number(search.page) : undefined,
		pageSize: search.pageSize ? Number(search.pageSize) : undefined,
		sortBy: search.sortBy,
		sortDir: parseOptionalSortDir(search.sortDir),
	};
}

export async function getAdminCohort(id: string) {
	const cohort = await repo.findCohort(id);
	if (!cohort) throw new AppError('Không tìm thấy Cohort', 404);
	return cohort;
}

export async function createCohort(input: CreateCohortInput) {
	const course = await courseRepo.findAdminCourse(input.courseId);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	const startsAt = input.startsAt ? new Date(input.startsAt) : null;
	const endsAt = input.endsAt ? new Date(input.endsAt) : null;
	if (
		(startsAt && Number.isNaN(startsAt.valueOf())) ||
		(endsAt && Number.isNaN(endsAt.valueOf())) ||
		(startsAt && endsAt && endsAt < startsAt)
	)
		throw new AppError('Khoảng thời gian Cohort không hợp lệ', 422);
	return repo.createCohort({
		courseId: input.courseId,
		name: input.name.trim(),
		term: input.term?.trim() ?? '',
		startsAt,
		endsAt,
		status: input.status ?? 'PUBLISHED',
	});
}

export async function updateCohort(id: string, input: UpdateCohortInput) {
	await getAdminCohort(id);
	const startsAt =
		input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null;
	const endsAt =
		input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null;
	if (
		(startsAt && Number.isNaN(startsAt.valueOf())) ||
		(endsAt && Number.isNaN(endsAt.valueOf())) ||
		(startsAt && endsAt && endsAt < startsAt)
	)
		throw new AppError('Khoảng thời gian Cohort không hợp lệ', 422);
	return repo.updateCohort(id, {
		name: input.name?.trim(),
		term: input.term?.trim(),
		startsAt,
		endsAt,
		status: input.status,
	});
}

export async function archiveCohort(id: string) {
	await getAdminCohort(id);
	return repo.archiveCohortWithMemberships(id);
}

export async function previewRoster(
	cohortId: string,
	rows: Array<{ email: string; name?: string }>,
): Promise<RosterPreviewRow[]> {
	const cohort = await getAdminCohort(cohortId);
	const seen = new Set<string>();
	const result: RosterPreviewRow[] = [];
	let users: {
		findOne: (filter: {
			email: string;
		}) => Promise<{ _id: { toString(): string }; email?: string } | null>;
	} | null = null;
	try {
		const mongo = await mongoClientPromise;
		users = mongo.db().collection<{ _id: { toString(): string }; email?: string }>('users');
	} catch {
		users = null;
	}
	for (const row of rows) {
		const email = normalizeEmail(row.email);
		const errors: string[] = [];
		if (!email || !email.includes('@')) errors.push('Email không hợp lệ');
		if (seen.has(email)) errors.push('Email trùng trong file');
		seen.add(email);
		const existing = await repo.findMembershipInCohort(cohortId, email);
		if (existing && existing.status !== 'REMOVED') errors.push('Đã tồn tại trong cohort');
		const activeElsewhere = await repo.findActiveByCourseEmail(cohort.courseId, email);
		if (activeElsewhere && activeElsewhere.cohortId !== cohortId) {
			errors.push('Đã active ở cohort khác của cùng Course');
		}
		const accountUser = users ? await users.findOne({ email }) : null;
		result.push({
			email,
			name: row.name?.trim() ?? '',
			ok: errors.length === 0,
			account: accountUser || existing?.userId ? 'existing' : 'pending',
			errors,
			userId: accountUser?._id.toString() ?? existing?.userId ?? undefined,
		});
	}
	return result;
}

export async function commitRoster(
	cohortId: string,
	rows: Array<{ email: string; name?: string }>,
) {
	const preview = await previewRoster(cohortId, rows);
	if (preview.some((row) => !row.ok)) {
		throw new AppError('Roster còn lỗi, không thể commit', 422);
	}
	const cohort = await getAdminCohort(cohortId);
	await prisma.$transaction(async (tx) => {
		for (const row of preview) {
			const existing = await tx.myClassMembership.findUnique({
				where: { cohortId_email: { cohortId, email: row.email } },
			});
			if (existing?.status === 'REMOVED') {
				await tx.myClassMembership.update({
					where: { id: existing.id },
					data: {
						status: row.account === 'existing' ? 'ACTIVE' : 'PENDING',
						userId: row.userId ?? null,
						name: row.name,
						removedAt: null,
						activeCourseUserKey: row.userId
							? activeCourseUserKey(cohort.courseId, row.userId)
							: null,
						activatedAt: row.userId ? new Date() : null,
					},
				});
				continue;
			}
			await tx.myClassMembership.create({
				data: {
					cohortId,
					courseId: cohort.courseId,
					email: row.email,
					name: row.name,
					status: row.account === 'existing' ? 'ACTIVE' : 'PENDING',
					userId: row.userId ?? null,
					activeCourseUserKey: row.userId ? activeCourseUserKey(cohort.courseId, row.userId) : null,
					activatedAt: row.userId ? new Date() : null,
				},
			});
		}
	});
	return getAdminCohort(cohortId);
}

export async function addMembership(cohortId: string, email: string, name = '') {
	const [row] = await previewRoster(cohortId, [{ email, name }]);
	if (!row?.ok) throw new AppError(row?.errors[0] ?? 'Không thể thêm thành viên', 422);
	return commitRoster(cohortId, [{ email, name }]);
}

export async function removeMembership(id: string) {
	const membership = await repo.findMembership(id);
	if (!membership) throw new AppError('Không tìm thấy membership', 404);
	return repo.updateMembership(id, {
		status: 'REMOVED',
		activeCourseUserKey: null,
		removedAt: new Date(),
	});
}

export async function reactivateMembership(id: string) {
	const membership = await repo.findMembership(id);
	if (!membership) throw new AppError('Không tìm thấy membership', 404);
	const email = normalizeEmail(membership.email);
	const active = await repo.findActiveByCourseEmail(membership.cohort.courseId, email);
	if (active && active.id !== id) {
		throw new AppError('Học viên đang active ở cohort khác của cùng Course', 409, 'CONFLICT');
	}
	if (membership.userId) {
		const key = activeCourseUserKey(membership.cohort.courseId, membership.userId);
		const occupied = await repo.findActiveMembership(membership.cohort.courseId, membership.userId);
		if (occupied && occupied.id !== id) {
			throw new AppError('Học viên đang active ở cohort khác của cùng Course', 409, 'CONFLICT');
		}
		return withUniqueConflict('Học viên đang active ở cohort khác của cùng Course', () =>
			repo.updateMembership(id, {
				status: 'ACTIVE',
				email,
				activeCourseUserKey: key,
				activatedAt: membership.activatedAt ?? new Date(),
				removedAt: null,
			}),
		);
	}
	return repo.updateMembership(id, {
		status: 'PENDING',
		email,
		activeCourseUserKey: null,
		removedAt: null,
	});
}

export async function reconcilePendingMemberships(userId: string, email: string): Promise<void> {
	const normalized = normalizeEmail(email);
	const pending = await repo.findPendingByEmail(normalized);
	const claimedCourses = new Set<string>();
	for (const membership of pending) {
		if (membership.cohort.status !== 'PUBLISHED') continue;
		if (claimedCourses.has(membership.courseId)) {
			console.warn('[My Class] membership conflict left pending', {
				membershipId: membership.id,
				courseId: membership.courseId,
				userId,
			});
			continue;
		}
		const occupied = await repo.findActiveByCourseUser(membership.courseId, userId);
		if (occupied) {
			console.warn('[My Class] membership conflict left pending', {
				membershipId: membership.id,
				courseId: membership.courseId,
				userId,
			});
			continue;
		}
		try {
			await repo.updateMembership(membership.id, {
				email: normalized,
				userId,
				status: 'ACTIVE',
				activatedAt: new Date(),
				activeCourseUserKey: activeCourseUserKey(membership.courseId, userId),
			});
			claimedCourses.add(membership.courseId);
		} catch (error) {
			console.warn('[My Class] membership reconcile failed', {
				membershipId: membership.id,
				error: error instanceof Error ? error.message : 'unknown',
			});
		}
	}
}
