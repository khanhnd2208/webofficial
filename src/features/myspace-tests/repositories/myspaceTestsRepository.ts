import type { McqQuestion, PublishStatus, SpaceTest, Subject } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import {
	avgDurationMs,
	isQualifyingAttempt,
	isQualifyingCompletion,
	sessionDurationMs,
} from '../sessionStats';
import type {
	CreateSpaceTestInput,
	UpdateMcqQuestionInput,
	UpdateSpaceTestInput,
} from '../schemas';
import type {
	McqQuestionInput,
	McqQuestionDTO,
	PersonalProgress,
	ProgressActor,
	SpaceTestDTO,
	SubjectDTO,
	SubjectWithCounts,
} from '../types';

export type { SpaceTestDTO };

type SpaceTestWithSubject = SpaceTest & { subject: Subject };
type McqQuestionWithSubject = McqQuestion & { subject: Subject | null };

function mapSubject(s: Subject): SubjectDTO {
	return {
		id: s.id,
		name: s.name,
		slug: s.slug,
		createdAt: s.createdAt.toISOString(),
		updatedAt: s.updatedAt.toISOString(),
	};
}

function mapQuestion(q: McqQuestionWithSubject | McqQuestion): McqQuestionDTO {
	const subjectName =
		'subject' in q && q.subject ? q.subject.name : null;
	return {
		id: q.id,
		subjectId: q.subjectId,
		subjectName,
		topic: q.topic,
		stem: q.stem,
		optionA: q.optionA,
		optionB: q.optionB,
		optionC: q.optionC,
		optionD: q.optionD,
		correctOption: q.correctOption,
		difficulty: q.difficulty,
		aacsb: q.aacsb,
		learningObjective: q.learningObjective,
		classification: q.classification,
		isActive: q.isActive,
		createdAt: q.createdAt.toISOString(),
		updatedAt: q.updatedAt.toISOString(),
	};
}

function mapSpaceTest(t: SpaceTestWithSubject | SpaceTest): SpaceTestDTO {
	const subjectName = 'subject' in t && t.subject ? t.subject.name : '';
	return {
		id: t.id,
		slug: t.slug,
		title: t.title,
		description: t.description,
		subjectId: t.subjectId,
		subjectName,
		topics: t.topics,
		difficulties: t.difficulties,
		classifications: t.classifications,
		questionCount: t.questionCount,
		displayOrder: t.displayOrder,
		status: t.status,
		createdAt: t.createdAt.toISOString(),
		updatedAt: t.updatedAt.toISOString(),
		publishedAt: t.publishedAt?.toISOString() ?? null,
	};
}

export function emptyPersonalProgress(): PersonalProgress {
	return {
		status: 'not_started',
		completedCount: 0,
		bestScorePercent: null,
		lastCompletedAt: null,
		recentCompletions: [],
	};
}

function actorOwnershipFilter(
	actor: ProgressActor,
): { OR: Array<{ userId: string } | { guestId: string }> } | null {
	const clauses: Array<{ userId: string } | { guestId: string }> = [];
	if (actor.userId) clauses.push({ userId: actor.userId });
	if (actor.guestId) clauses.push({ guestId: actor.guestId });
	if (clauses.length === 0) return null;
	return { OR: clauses };
}

export async function listSubjects(): Promise<SubjectWithCounts[]> {
	const rows = await prisma.subject.findMany({
		orderBy: { name: 'asc' },
		include: {
			_count: {
				select: {
					spaceTests: true,
					mcqQuestions: true,
				},
			},
		},
	});
	return rows.map((s) => ({
		...mapSubject(s),
		testCount: s._count.spaceTests,
		questionCount: s._count.mcqQuestions,
	}));
}

export async function findSubjectById(id: string): Promise<SubjectDTO | null> {
	const row = await prisma.subject.findUnique({ where: { id } });
	return row ? mapSubject(row) : null;
}

export async function findSubjectByName(name: string): Promise<SubjectDTO | null> {
	const row = await prisma.subject.findUnique({ where: { name } });
	return row ? mapSubject(row) : null;
}

export async function subjectSlugExists(slug: string, excludeId?: string): Promise<boolean> {
	const row = await prisma.subject.findFirst({
		where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
		select: { id: true },
	});
	return Boolean(row);
}

export async function createSubject(input: {
	name: string;
	slug: string;
}): Promise<SubjectDTO> {
	const row = await prisma.subject.create({
		data: { name: input.name.trim(), slug: input.slug },
	});
	return mapSubject(row);
}

export async function updateSubject(
	id: string,
	input: { name: string; slug: string },
): Promise<SubjectDTO | null> {
	const existing = await prisma.subject.findUnique({ where: { id } });
	if (!existing) return null;
	const row = await prisma.subject.update({
		where: { id },
		data: { name: input.name.trim(), slug: input.slug },
	});
	return mapSubject(row);
}

export async function countTestsBySubjectId(subjectId: string): Promise<number> {
	return prisma.spaceTest.count({ where: { subjectId } });
}

export async function deleteSubject(id: string): Promise<boolean> {
	const existing = await prisma.subject.findUnique({ where: { id } });
	if (!existing) return false;
	await prisma.subject.delete({ where: { id } });
	return true;
}

export async function createQuestions(
	items: McqQuestionInput[],
	subjectId?: string | null,
): Promise<number> {
	if (items.length === 0) return 0;
	const result = await prisma.mcqQuestion.createMany({
		data: items.map((q) => ({
			subjectId: subjectId !== undefined ? subjectId : q.subjectId,
			topic: q.topic,
			stem: q.stem,
			optionA: q.optionA,
			optionB: q.optionB,
			optionC: q.optionC,
			optionD: q.optionD,
			correctOption: q.correctOption,
			difficulty: q.difficulty,
			aacsb: q.aacsb,
			learningObjective: q.learningObjective,
			classification: q.classification,
		})),
	});
	return result.count;
}

export interface ListQuestionsParams {
	subjectId?: string;
	topic?: string;
	q?: string;
	isActive?: boolean;
	take?: number;
	skip?: number;
}

export async function listQuestions(params: ListQuestionsParams = {}): Promise<{
	items: McqQuestionDTO[];
	total: number;
}> {
	const where = {
		...(params.subjectId ? { subjectId: params.subjectId } : {}),
		...(params.topic ? { topic: params.topic } : {}),
		...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
		...(params.q
			? {
					OR: [
						{ stem: { contains: params.q, mode: 'insensitive' as const } },
						{ topic: { contains: params.q, mode: 'insensitive' as const } },
					],
				}
			: {}),
	};

	const take = Math.min(params.take ?? 50, 200);
	const skip = params.skip ?? 0;

	const [rows, total] = await Promise.all([
		prisma.mcqQuestion.findMany({
			where,
			include: { subject: true },
			orderBy: [{ topic: 'asc' }, { createdAt: 'desc' }],
			take,
			skip,
		}),
		prisma.mcqQuestion.count({ where }),
	]);

	return { items: rows.map(mapQuestion), total };
}

export async function findQuestionById(id: string): Promise<McqQuestionDTO | null> {
	const row = await prisma.mcqQuestion.findUnique({
		where: { id },
		include: { subject: true },
	});
	return row ? mapQuestion(row) : null;
}

export async function updateQuestion(
	id: string,
	input: UpdateMcqQuestionInput,
): Promise<McqQuestionDTO | null> {
	const existing = await prisma.mcqQuestion.findUnique({ where: { id } });
	if (!existing) return null;
	const row = await prisma.mcqQuestion.update({
		where: { id },
		data: {
			...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
			...(input.topic !== undefined ? { topic: input.topic } : {}),
			...(input.stem !== undefined ? { stem: input.stem } : {}),
			...(input.optionA !== undefined ? { optionA: input.optionA } : {}),
			...(input.optionB !== undefined ? { optionB: input.optionB } : {}),
			...(input.optionC !== undefined ? { optionC: input.optionC } : {}),
			...(input.optionD !== undefined ? { optionD: input.optionD } : {}),
			...(input.correctOption !== undefined ? { correctOption: input.correctOption } : {}),
			...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
			...(input.aacsb !== undefined ? { aacsb: input.aacsb } : {}),
			...(input.learningObjective !== undefined
				? { learningObjective: input.learningObjective }
				: {}),
			...(input.classification !== undefined ? { classification: input.classification } : {}),
			...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
		},
		include: { subject: true },
	});
	return mapQuestion(row);
}

export async function deleteQuestion(id: string): Promise<boolean> {
	const existing = await prisma.mcqQuestion.findUnique({ where: { id } });
	if (!existing) return false;
	await prisma.mcqQuestion.delete({ where: { id } });
	return true;
}

export async function isQuestionInAnySession(questionId: string): Promise<boolean> {
	const row = await prisma.spaceTestSession.findFirst({
		where: { questionIds: { has: questionId } },
		select: { id: true },
	});
	return Boolean(row);
}

export async function getFilterMeta(): Promise<{
	subjects: Array<{ id: string; name: string }>;
	topicsBySubjectId: Record<string, string[]>;
	difficulties: number[];
	classifications: string[];
}> {
	const [subjects, rows] = await Promise.all([
		prisma.subject.findMany({
			orderBy: { name: 'asc' },
			select: { id: true, name: true },
		}),
		prisma.mcqQuestion.findMany({
			where: { isActive: true },
			select: { subjectId: true, topic: true, difficulty: true, classification: true },
		}),
	]);

	const topicsBySubjectId: Record<string, Set<string>> = {};
	const difficulties = new Set<number>();
	const classifications = new Set<string>();

	for (const row of rows) {
		if (row.subjectId) {
			if (!topicsBySubjectId[row.subjectId]) topicsBySubjectId[row.subjectId] = new Set();
			topicsBySubjectId[row.subjectId]!.add(row.topic);
		}
		difficulties.add(row.difficulty);
		if (row.classification) classifications.add(row.classification);
	}

	return {
		subjects,
		topicsBySubjectId: Object.fromEntries(
			Object.entries(topicsBySubjectId).map(([k, v]) => [k, [...v].sort()]),
		),
		difficulties: [...difficulties].sort((a, b) => a - b),
		classifications: [...classifications].sort(),
	};
}

type PoolQuestion = {
	id: string;
	topic: string;
	difficulty: number;
	stem: string;
	optionA: string;
	optionB: string;
	optionC: string;
	optionD: string;
	correctOption: McqQuestion['correctOption'];
};

export type PoolMetaRow = {
	topic: string;
	difficulty: number;
	learningObjective: string;
	classification: string;
};

export type PoolQueryFilters = {
	topics?: string[];
	difficulties?: number[];
	learningObjectives?: string[];
	classifications?: string[];
};

const poolSelect = {
	id: true,
	topic: true,
	difficulty: true,
	stem: true,
	optionA: true,
	optionB: true,
	optionC: true,
	optionD: true,
	correctOption: true,
} as const;

const poolMetaSelect = {
	topic: true,
	difficulty: true,
	learningObjective: true,
	classification: true,
} as const;

function poolWhereExtras(filters?: PoolQueryFilters) {
	return {
		...(filters?.topics && filters.topics.length > 0
			? { topic: { in: filters.topics } }
			: {}),
		...(filters?.difficulties && filters.difficulties.length > 0
			? { difficulty: { in: filters.difficulties } }
			: {}),
		...(filters?.learningObjectives && filters.learningObjectives.length > 0
			? { learningObjective: { in: filters.learningObjectives } }
			: {}),
		...(filters?.classifications && filters.classifications.length > 0
			? { classification: { in: filters.classifications } }
			: {}),
	};
}

export async function findActivePool(filters: {
	subjectId: string;
	topics?: string[];
	difficulties?: number[];
	learningObjectives?: string[];
	classifications?: string[];
}): Promise<PoolQuestion[]> {
	return prisma.mcqQuestion.findMany({
		where: {
			isActive: true,
			subjectId: filters.subjectId,
			...poolWhereExtras(filters),
		},
		select: poolSelect,
	});
}

export async function findActivePoolByTestId(
	spaceTestId: string,
	filters?: PoolQueryFilters,
): Promise<PoolQuestion[]> {
	return prisma.mcqQuestion.findMany({
		where: {
			isActive: true,
			spaceTestId,
			...poolWhereExtras(filters),
		},
		select: poolSelect,
	});
}

export async function findPoolMetaByTestId(spaceTestId: string): Promise<PoolMetaRow[]> {
	return prisma.mcqQuestion.findMany({
		where: { isActive: true, spaceTestId },
		select: poolMetaSelect,
	});
}

export async function findPoolMetaByBank(filters: {
	subjectId: string;
	topics?: string[];
	difficulties?: number[];
	classifications?: string[];
}): Promise<PoolMetaRow[]> {
	return prisma.mcqQuestion.findMany({
		where: {
			isActive: true,
			subjectId: filters.subjectId,
			...(filters.topics && filters.topics.length > 0
				? { topic: { in: filters.topics } }
				: {}),
			...(filters.difficulties && filters.difficulties.length > 0
				? { difficulty: { in: filters.difficulties } }
				: {}),
			...(filters.classifications && filters.classifications.length > 0
				? { classification: { in: filters.classifications } }
				: {}),
		},
		select: poolMetaSelect,
	});
}

export async function countQuestionsByTestId(spaceTestId: string): Promise<number> {
	return prisma.mcqQuestion.count({
		where: { spaceTestId, isActive: true },
	});
}

export async function nextDisplayOrderForSubject(subjectId: string): Promise<number> {
	const agg = await prisma.spaceTest.aggregate({
		where: { subjectId },
		_max: { displayOrder: true },
	});
	return (agg._max.displayOrder ?? 0) + 1;
}

export async function createSpaceTestWithQuestions(input: {
	slug: string;
	title: string;
	description: string;
	subjectId: string;
	questionCount: number;
	status: PublishStatus;
	questions: McqQuestionInput[];
	displayOrder?: number;
}): Promise<SpaceTestDTO> {
	const status = input.status;
	return prisma.$transaction(async (tx) => {
		const maxOrder = await tx.spaceTest.aggregate({
			where: { subjectId: input.subjectId },
			_max: { displayOrder: true },
		});
		const displayOrder = input.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1;
		const test = await tx.spaceTest.create({
			data: {
				slug: input.slug,
				title: input.title.trim(),
				description: input.description.trim(),
				subjectId: input.subjectId,
				topics: [],
				difficulties: [],
				classifications: [],
				questionCount: input.questionCount,
				displayOrder,
				status,
				publishedAt: status === 'PUBLISHED' ? new Date() : null,
			},
			include: { subject: true },
		});

		if (input.questions.length > 0) {
			await tx.mcqQuestion.createMany({
				data: input.questions.map((q) => ({
					subjectId: input.subjectId,
					topic: q.topic,
					stem: q.stem,
					optionA: q.optionA,
					optionB: q.optionB,
					optionC: q.optionC,
					optionD: q.optionD,
					correctOption: q.correctOption,
					difficulty: q.difficulty,
					aacsb: q.aacsb,
					learningObjective: q.learningObjective,
					classification: q.classification,
					spaceTestId: test.id,
				})),
			});
		}

		return mapSpaceTest(test);
	});
}

export async function listSpaceTestsWithQuestionCounts(
	status?: PublishStatus,
): Promise<Array<SpaceTestDTO & { attachedQuestionCount: number }>> {
	const rows = await prisma.spaceTest.findMany({
		where: status ? { status } : undefined,
		orderBy: { updatedAt: 'desc' },
		include: { subject: true },
	});
	if (rows.length === 0) return [];

	const counts = await prisma.mcqQuestion.groupBy({
		by: ['spaceTestId'],
		where: {
			spaceTestId: { in: rows.map((r) => r.id) },
			isActive: true,
		},
		_count: { _all: true },
	});
	const countByTest = new Map(
		counts
			.filter((c): c is typeof c & { spaceTestId: string } => Boolean(c.spaceTestId))
			.map((c) => [c.spaceTestId, c._count._all]),
	);

	return rows.map((row) => ({
		...mapSpaceTest(row),
		attachedQuestionCount: countByTest.get(row.id) ?? 0,
	}));
}

export async function listSpaceTests(status?: PublishStatus): Promise<SpaceTestDTO[]> {
	const rows = await prisma.spaceTest.findMany({
		where: status ? { status } : undefined,
		orderBy: { updatedAt: 'desc' },
		include: { subject: true },
	});
	return rows.map(mapSpaceTest);
}

export async function findSpaceTestById(id: string): Promise<SpaceTestDTO | null> {
	const row = await prisma.spaceTest.findUnique({
		where: { id },
		include: { subject: true },
	});
	return row ? mapSpaceTest(row) : null;
}

export async function findSpaceTestBySlug(
	slug: string,
): Promise<(SpaceTest & { subject: Subject }) | null> {
	return prisma.spaceTest.findUnique({
		where: { slug },
		include: { subject: true },
	});
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
	const row = await prisma.spaceTest.findFirst({
		where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
		select: { id: true },
	});
	return Boolean(row);
}

export async function createSpaceTest(
	input: CreateSpaceTestInput & { slug: string; displayOrder?: number },
): Promise<SpaceTestDTO> {
	const status = input.status ?? 'DRAFT';
	const displayOrder =
		input.displayOrder ?? (await nextDisplayOrderForSubject(input.subjectId));
	const row = await prisma.spaceTest.create({
		data: {
			slug: input.slug,
			title: input.title.trim(),
			description: input.description?.trim() ?? '',
			subjectId: input.subjectId,
			topics: input.topics ?? [],
			difficulties: input.difficulties ?? [],
			classifications: input.classifications ?? [],
			questionCount: input.questionCount,
			displayOrder,
			status,
			publishedAt: status === 'PUBLISHED' ? new Date() : null,
		},
		include: { subject: true },
	});
	return mapSpaceTest(row);
}

export async function updateSpaceTest(
	id: string,
	input: UpdateSpaceTestInput & { slug?: string },
): Promise<SpaceTestDTO | null> {
	const existing = await prisma.spaceTest.findUnique({ where: { id } });
	if (!existing) return null;

	const row = await prisma.spaceTest.update({
		where: { id },
		data: {
			...(input.title !== undefined ? { title: input.title.trim() } : {}),
			...(input.slug !== undefined ? { slug: input.slug } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
			...(input.topics !== undefined ? { topics: input.topics } : {}),
			...(input.difficulties !== undefined ? { difficulties: input.difficulties } : {}),
			...(input.classifications !== undefined
				? { classifications: input.classifications }
				: {}),
			...(input.questionCount !== undefined ? { questionCount: input.questionCount } : {}),
			...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
			...(input.status !== undefined
				? {
						status: input.status,
						publishedAt:
							input.status === 'PUBLISHED'
								? (existing.publishedAt ?? new Date())
								: existing.publishedAt,
					}
				: {}),
		},
		include: { subject: true },
	});
	return mapSpaceTest(row);
}

export async function deleteSpaceTest(id: string): Promise<boolean> {
	const existing = await prisma.spaceTest.findUnique({ where: { id } });
	if (!existing) return false;
	await prisma.spaceTest.delete({ where: { id } });
	return true;
}

export async function createSession(
	spaceTestId: string,
	questionIds: string[],
	options?: {
		engaged?: boolean;
		userId?: string | null;
		guestId?: string | null;
	},
) {
	const now = new Date();
	return prisma.spaceTestSession.create({
		data: {
			spaceTestId,
			questionIds,
			...(options?.engaged ? { engagedAt: now } : {}),
			...(options?.userId ? { userId: options.userId } : {}),
			...(options?.guestId ? { guestId: options.guestId } : {}),
		},
	});
}

export async function findSessionById(id: string) {
	return prisma.spaceTestSession.findUnique({
		where: { id },
		include: { spaceTest: { include: { subject: true } } },
	});
}

export function sessionBelongsToActor(
	session: { userId: string | null; guestId: string | null },
	actor: ProgressActor,
): boolean {
	if (session.userId) {
		return Boolean(actor.userId && session.userId === actor.userId);
	}
	if (session.guestId) {
		return Boolean(actor.guestId && session.guestId === actor.guestId);
	}
	return false;
}

/**
 * Aggregate personal progress for many tests in one query.
 * Only submitted sessions with ownership count; orphan analytics rows are ignored.
 */
export async function getPersonalProgressByTestIds(
	testIds: string[],
	actor: ProgressActor,
): Promise<Map<string, PersonalProgress>> {
	const result = new Map<string, PersonalProgress>();
	for (const id of testIds) {
		result.set(id, emptyPersonalProgress());
	}
	if (testIds.length === 0) return result;

	const ownership = actorOwnershipFilter(actor);
	if (!ownership) return result;

	const sessions = await prisma.spaceTestSession.findMany({
		where: {
			spaceTestId: { in: testIds },
			submittedAt: { not: null },
			score: { not: null },
			total: { not: null },
			...ownership,
		},
		select: {
			spaceTestId: true,
			score: true,
			total: true,
			submittedAt: true,
		},
		orderBy: { submittedAt: 'desc' },
	});

	const buckets = new Map<
		string,
		Array<{ score: number; total: number; submittedAt: Date }>
	>();

	for (const session of sessions) {
		if (session.score == null || session.total == null || !session.submittedAt) continue;
		const list = buckets.get(session.spaceTestId) ?? [];
		list.push({
			score: session.score,
			total: session.total,
			submittedAt: session.submittedAt,
		});
		buckets.set(session.spaceTestId, list);
	}

	for (const [testId, completions] of buckets) {
		const recent = completions.slice(0, 5).map((c) => ({
			score: c.score,
			total: c.total,
			submittedAt: c.submittedAt.toISOString(),
		}));
		let best: number | null = null;
		for (const c of completions) {
			if (c.total <= 0) continue;
			const pct = (c.score / c.total) * 100;
			if (best == null || pct > best) best = pct;
		}
		result.set(testId, {
			status: 'completed',
			completedCount: completions.length,
			bestScorePercent: best == null ? null : Math.round(best * 10) / 10,
			lastCompletedAt: completions[0]?.submittedAt.toISOString() ?? null,
			recentCompletions: recent,
		});
	}

	return result;
}

/** Move guest-owned sessions onto a user account. Idempotent. */
export async function claimGuestSessions(
	userId: string,
	guestId: string,
): Promise<{ claimed: number }> {
	return prisma.$transaction(async (tx) => {
		const result = await tx.spaceTestSession.updateMany({
			where: { guestId },
			data: { userId, guestId: null },
		});
		return { claimed: result.count };
	});
}

/** Marks first real answer; no-op if already engaged or missing. */
export async function markSessionEngaged(id: string): Promise<void> {
	await prisma.spaceTestSession.updateMany({
		where: { id, engagedAt: null },
		data: { engagedAt: new Date() },
	});
}

export async function submitSession(
	id: string,
	score: number,
	total: number,
): Promise<void> {
	const now = new Date();
	await prisma.spaceTestSession.update({
		where: { id },
		data: { score, total, submittedAt: now },
	});
	// Ensure engaged even if /check was skipped; do not overwrite existing engagedAt
	await prisma.spaceTestSession.updateMany({
		where: { id, engagedAt: null },
		data: { engagedAt: now },
	});
}

export async function findQuestionsByIds(ids: string[]): Promise<McqQuestion[]> {
	if (ids.length === 0) return [];
	const rows = await prisma.mcqQuestion.findMany({ where: { id: { in: ids } } });
	const byId = new Map(rows.map((r) => [r.id, r]));
	return ids.map((id) => byId.get(id)).filter((r): r is McqQuestion => Boolean(r));
}

function avgScorePercent(
	rows: Array<{ score: number | null; total: number | null }>,
): number | null {
	const scored = rows.filter(
		(r): r is { score: number; total: number } =>
			typeof r.score === 'number' && typeof r.total === 'number' && r.total > 0,
	);
	if (scored.length === 0) return null;
	const sum = scored.reduce((acc, r) => acc + (r.score / r.total) * 100, 0);
	return Math.round((sum / scored.length) * 10) / 10;
}

export async function getAttemptStatsByTest(): Promise<
	import('../types').SpaceTestAttemptStats[]
> {
	const tests = await prisma.spaceTest.findMany({
		select: { id: true, slug: true, title: true, status: true },
		orderBy: { updatedAt: 'desc' },
	});
	if (tests.length === 0) return [];

	const sessions = await prisma.spaceTestSession.findMany({
		select: {
			spaceTestId: true,
			createdAt: true,
			engagedAt: true,
			submittedAt: true,
			score: true,
			total: true,
		},
	});

	const byTest = new Map<
		string,
		{
			opened: number;
			engaged: number;
			completed: number;
			scored: Array<{ score: number | null; total: number | null }>;
			durations: number[];
			lastCompletedAt: Date | null;
		}
	>();

	for (const t of tests) {
		byTest.set(t.id, {
			opened: 0,
			engaged: 0,
			completed: 0,
			scored: [],
			durations: [],
			lastCompletedAt: null,
		});
	}

	for (const s of sessions) {
		const bucket = byTest.get(s.spaceTestId);
		if (!bucket) continue;
		bucket.opened += 1;

		const timing = {
			createdAt: s.createdAt,
			engagedAt: s.engagedAt,
			submittedAt: s.submittedAt,
		};

		if (isQualifyingAttempt(timing)) {
			bucket.engaged += 1;
		}
		if (isQualifyingCompletion(timing)) {
			bucket.completed += 1;
			bucket.scored.push({ score: s.score, total: s.total });
			bucket.durations.push(sessionDurationMs(timing));
			if (!bucket.lastCompletedAt || s.submittedAt! > bucket.lastCompletedAt) {
				bucket.lastCompletedAt = s.submittedAt;
			}
		}
	}

	return tests.map((t) => {
		const b = byTest.get(t.id)!;
		return {
			spaceTestId: t.id,
			slug: t.slug,
			title: t.title,
			status: t.status,
			opened: b.opened,
			engaged: b.engaged,
			completed: b.completed,
			avgScorePercent: avgScorePercent(b.scored),
			avgDurationMs: avgDurationMs(b.durations),
			lastCompletedAt: b.lastCompletedAt?.toISOString() ?? null,
		};
	});
}

export async function getAnalyticsOverview(
	days = 30,
): Promise<import('../types').SpaceTestAnalyticsOverview> {
	const since = new Date();
	since.setUTCDate(since.getUTCDate() - Math.max(1, days) + 1);
	since.setUTCHours(0, 0, 0, 0);

	const [byTest, recent, windowSessions] = await Promise.all([
		getAttemptStatsByTest(),
		prisma.spaceTestSession.findMany({
			where: { submittedAt: { not: null } },
			orderBy: { submittedAt: 'desc' },
			take: 40,
			select: {
				id: true,
				score: true,
				total: true,
				createdAt: true,
				engagedAt: true,
				submittedAt: true,
				spaceTest: { select: { slug: true, title: true } },
			},
		}),
		prisma.spaceTestSession.findMany({
			where: { createdAt: { gte: since } },
			select: {
				createdAt: true,
				engagedAt: true,
				submittedAt: true,
			},
		}),
	]);

	const totals = {
		opened: byTest.reduce((a, t) => a + t.opened, 0),
		engaged: byTest.reduce((a, t) => a + t.engaged, 0),
		completed: byTest.reduce((a, t) => a + t.completed, 0),
		avgScorePercent: (() => {
			const withAvg = byTest.filter((t) => t.avgScorePercent != null && t.completed > 0);
			if (withAvg.length === 0) return null;
			const weighted = withAvg.reduce(
				(acc, t) => ({
					sum: acc.sum + (t.avgScorePercent as number) * t.completed,
					n: acc.n + t.completed,
				}),
				{ sum: 0, n: 0 },
			);
			return weighted.n === 0
				? null
				: Math.round((weighted.sum / weighted.n) * 10) / 10;
		})(),
	};

	const dayMap = new Map<
		string,
		{ opened: number; engaged: number; completed: number }
	>();
	for (let i = 0; i < days; i++) {
		const d = new Date(since);
		d.setUTCDate(since.getUTCDate() + i);
		const key = d.toISOString().slice(0, 10);
		dayMap.set(key, { opened: 0, engaged: 0, completed: 0 });
	}

	for (const s of windowSessions) {
		const openKey = s.createdAt.toISOString().slice(0, 10);
		const openBucket = dayMap.get(openKey);
		if (openBucket) openBucket.opened += 1;

		const timing = {
			createdAt: s.createdAt,
			engagedAt: s.engagedAt,
			submittedAt: s.submittedAt,
		};

		if (isQualifyingAttempt(timing) && (s.engagedAt || s.submittedAt)) {
			const engKey = (s.engagedAt ?? s.createdAt).toISOString().slice(0, 10);
			const engBucket = dayMap.get(engKey);
			if (engBucket) engBucket.engaged += 1;
		}
		if (isQualifyingCompletion(timing) && s.submittedAt) {
			const subKey = s.submittedAt.toISOString().slice(0, 10);
			const subBucket = dayMap.get(subKey);
			if (subBucket) subBucket.completed += 1;
		}
	}

	const daily = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

	return {
		totals,
		byTest,
		daily,
		recentCompletions: recent
			.filter(
				(r) =>
					r.submittedAt &&
					r.score != null &&
					r.total != null &&
					isQualifyingCompletion({
						createdAt: r.createdAt,
						engagedAt: r.engagedAt,
						submittedAt: r.submittedAt,
					}),
			)
			.slice(0, 20)
			.map((r) => ({
				id: r.id,
				slug: r.spaceTest.slug,
				title: r.spaceTest.title,
				score: r.score as number,
				total: r.total as number,
				submittedAt: r.submittedAt!.toISOString(),
			})),
	};
}

export { mapQuestion, mapSpaceTest, mapSubject };
