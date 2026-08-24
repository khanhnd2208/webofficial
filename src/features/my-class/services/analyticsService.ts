import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { comparePerformanceRows } from '../analytics/sort';
import { formatEvidenceSummary } from '../domain/format';
import { listSkip, parseListQuery, toListPage, type ListPage } from '../domain/listQuery';
import { weightedAccuracy } from '../domain/scoring';
import * as cohortRepo from '../repositories/cohortRepository';
import { COHORT_TABLE_SORTS } from '../repositories/cohortRepository';
import type { PerformanceAttemptRow, PerformanceKuRow } from '../types';

const PERFORMANCE_SORTS = ['title', 'accuracy', 'evidence', 'submittedAt'] as const;

/** Paginated course → cohort drill-down; stats stay on the summary strip. */
function titleOf(unit: { slug: string; currentPublishedRevision?: { title: string } | null }) {
	return unit.currentPublishedRevision?.title ?? unit.slug;
}

function performanceQuery(search: {
	q?: string;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortDir?: 'asc' | 'desc';
}) {
	return parseListQuery(
		{
			q: search.q,
			page: search.page ? String(search.page) : undefined,
			pageSize: search.pageSize ? String(search.pageSize) : undefined,
			sortBy: search.sortBy,
			sortDir: search.sortDir,
		},
		{ sortFields: PERFORMANCE_SORTS, defaultSortBy: 'accuracy', defaultSortDir: 'desc' },
	);
}

export async function coursePerformance(
	courseId: string,
	search: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc' } = {},
) {
	const course = await prisma.myClassCourse.findUnique({
		where: { id: courseId },
		select: { id: true, title: true, slug: true },
	});
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	const query = parseListQuery(
		{
			q: search.q,
			page: search.page ? String(search.page) : undefined,
			pageSize: search.pageSize ? String(search.pageSize) : undefined,
			sortBy: search.sortBy,
			sortDir: search.sortDir,
		},
		{ sortFields: COHORT_TABLE_SORTS, defaultSortBy: 'createdAt' },
	);
	const [{ items, total }, memberCount, attemptCount] = await Promise.all([
		cohortRepo.listCohortTable({
			courseId,
			q: query.q,
			sortBy: query.sortBy as (typeof COHORT_TABLE_SORTS)[number],
			sortDir: query.sortDir,
			skip: listSkip(query.page, query.pageSize),
			take: query.pageSize,
		}),
		prisma.myClassMembership.count({ where: { courseId, status: 'ACTIVE' } }),
		prisma.myClassTestAttempt.count({ where: { courseId } }),
	]);
	return {
		course,
		stats: { cohorts: total, members: memberCount, attempts: attemptCount },
		cohorts: toListPage(
			items.map((cohort) => ({
				id: cohort.id,
				name: cohort.name,
				term: cohort.term,
				members: cohort._count.members,
				attempts: cohort._count.attempts,
			})),
			total,
			query.page,
			query.pageSize,
		),
	};
}

export async function cohortPerformance(
	cohortId: string,
	search: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc' } = {},
) {
	const cohort = await prisma.myClassCohort.findUnique({
		where: { id: cohortId },
		select: { id: true, name: true, courseId: true, course: { select: { title: true } } },
	});
	if (!cohort) throw new AppError('Không tìm thấy Cohort', 404);
	const query = performanceQuery(search);
	const memberWhere = {
		cohortId,
		status: 'ACTIVE' as const,
		userId: { not: null as string | null },
		...(query.q
			? {
					OR: [
						{ name: { contains: query.q, mode: 'insensitive' as const } },
						{ email: { contains: query.q, mode: 'insensitive' as const } },
					],
				}
			: {}),
	};
	const [total, members, attemptCount] = await Promise.all([
		prisma.myClassMembership.count({ where: memberWhere }),
		prisma.myClassMembership.findMany({
			where: memberWhere,
			orderBy: { name: 'asc' },
			skip: listSkip(query.page, query.pageSize),
			take: query.pageSize,
			select: { userId: true, email: true, name: true },
		}),
		prisma.myClassTestAttempt.count({ where: { cohortId } }),
	]);
	const userIds = members.map((item) => item.userId).filter((id): id is string => Boolean(id));
	const attempts = userIds.length
		? await prisma.myClassTestAttempt.findMany({
				where: { cohortId, userId: { in: userIds } },
				select: {
					userId: true,
					submittedAt: true,
					evidence: { select: { questionCount: true, correctCount: true } },
				},
			})
		: [];
	const byUser = new Map<string, { attempts: number; evidence: number; correct: number; lastActivityAt: string | null }>();
	for (const attempt of attempts) {
		if (!attempt.userId) continue;
		const current = byUser.get(attempt.userId) ?? { attempts: 0, evidence: 0, correct: 0, lastActivityAt: null };
		current.attempts += 1;
		current.evidence += attempt.evidence.reduce((sum, row) => sum + row.questionCount, 0);
		current.correct += attempt.evidence.reduce((sum, row) => sum + row.correctCount, 0);
		const submitted = attempt.submittedAt.toISOString();
		if (!current.lastActivityAt || submitted > current.lastActivityAt) current.lastActivityAt = submitted;
		byUser.set(attempt.userId, current);
	}
	const students = members
		.map((member) => {
			const stats = byUser.get(member.userId!) ?? { attempts: 0, evidence: 0, correct: 0, lastActivityAt: null };
			return {
				userId: member.userId!,
				email: member.email,
				name: member.name,
				title: member.name || member.email || member.userId!,
				attempts: stats.attempts,
				evidence: stats.evidence,
				accuracy: stats.evidence ? weightedAccuracy(stats.correct, stats.evidence) : null,
				lastActivityAt: stats.lastActivityAt,
			};
		})
		.sort((a, b) => {
			if (query.sortBy === 'title') return a.title.localeCompare(b.title, 'vi') * (query.sortDir === 'asc' ? 1 : -1);
			if (query.sortBy === 'evidence') return (query.sortDir === 'asc' ? 1 : -1) * (a.evidence - b.evidence);
			return comparePerformanceRows(a, b) * (query.sortBy === 'accuracy' && query.sortDir === 'asc' ? -1 : 1);
		});
	const activeCount = await prisma.myClassMembership.count({
		where: { cohortId, status: 'ACTIVE', userId: { not: null } },
	});
	const withEvidence = await prisma.myClassTestAttempt.groupBy({
		by: ['userId'],
		where: { cohortId, userId: { not: null } },
	});
	return {
		cohort: { id: cohort.id, name: cohort.name, courseId: cohort.courseId, courseTitle: cohort.course.title },
		stats: { students: activeCount, withEvidence: withEvidence.length, attempts: attemptCount },
		students: toListPage(students, total, query.page, query.pageSize),
	};
}

export async function studentPerformance(
	cohortId: string,
	userId: string,
	search: { page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc' } = {},
) {
	const cohort = await prisma.myClassCohort.findUnique({
		where: { id: cohortId },
		select: { id: true, name: true, courseId: true, course: { select: { title: true } } },
	});
	if (!cohort) throw new AppError('Không tìm thấy Cohort', 404);
	const member = await prisma.myClassMembership.findFirst({
		where: { cohortId, userId, status: 'ACTIVE' },
		select: { email: true, name: true },
	});
	if (!member) throw new AppError('Sinh viên không thuộc Cohort này', 404);
	const query = performanceQuery(search);
	const where = { cohortId, userId };
	const [total, attempts, totals, evidence] = await Promise.all([
		prisma.myClassTestAttempt.count({ where }),
		prisma.myClassTestAttempt.findMany({
			where,
			orderBy: { submittedAt: query.sortDir },
			skip: listSkip(query.page, query.pageSize),
			take: query.pageSize,
			select: {
				id: true,
				score: true,
				total: true,
				earnedPoints: true,
				totalPoints: true,
				submittedAt: true,
				test: { select: { title: true } },
			},
		}),
		prisma.myClassTestAttempt.aggregate({
			where,
			_sum: { score: true, total: true },
			_count: true,
		}),
		prisma.myClassAttemptKuEvidence.findMany({
			where: { attempt: { cohortId, userId } },
			select: {
				knowledgeUnitId: true,
				questionCount: true,
				correctCount: true,
				knowledgeUnit: { select: { slug: true, currentPublishedRevision: { select: { title: true } } } },
			},
		}),
	]);
	const attemptRows: PerformanceAttemptRow[] = attempts.map((attempt) => ({
		id: attempt.id,
		testTitle: attempt.test.title,
		score: attempt.score,
		total: attempt.total,
		earnedPoints: attempt.earnedPoints,
		totalPoints: attempt.totalPoints,
		submittedAt: attempt.submittedAt.toISOString(),
		knowledgeUnits: [],
	}));
	const kuMap = new Map<string, PerformanceKuRow & { correct: number }>();
	for (const row of evidence) {
		const current = kuMap.get(row.knowledgeUnitId) ?? {
			knowledgeUnitId: row.knowledgeUnitId,
			slug: row.knowledgeUnit.slug,
			title: titleOf(row.knowledgeUnit),
			attempts: 0,
			evidence: 0,
			correct: 0,
			accuracy: 0,
		};
		current.attempts += 1;
		current.evidence += row.questionCount;
		current.correct += row.correctCount;
		kuMap.set(row.knowledgeUnitId, current);
	}
	const knowledgeUnits = [...kuMap.values()]
		.map((row) => ({
			knowledgeUnitId: row.knowledgeUnitId,
			slug: row.slug,
			title: row.title,
			attempts: row.attempts,
			evidence: row.evidence,
			correct: row.correct,
			accuracy: weightedAccuracy(row.correct, row.evidence),
			evidenceLabel: formatEvidenceSummary(row.correct, row.evidence, weightedAccuracy(row.correct, row.evidence)),
		}))
		.sort(comparePerformanceRows);
	return {
		cohort: { id: cohort.id, name: cohort.name, courseId: cohort.courseId, courseTitle: cohort.course.title },
		student: { userId, email: member.email, name: member.name },
		stats: {
			attempts: totals._count,
			accuracy:
				totals._sum.total && totals._sum.total > 0
					? Math.round(((totals._sum.score ?? 0) / totals._sum.total) * 100)
					: null,
			knowledgeUnits: knowledgeUnits.length,
		},
		attempts: toListPage(attemptRows, total, query.page, query.pageSize),
		knowledgeUnits,
	};
}

export type { ListPage };
