import type { McqQuestion, PublishStatus, SpaceTest, Subject } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type {
	CreateSpaceTestInput,
	UpdateMcqQuestionInput,
	UpdateSpaceTestInput,
} from '../schemas';
import type {
	McqQuestionInput,
	McqQuestionDTO,
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
		status: t.status,
		createdAt: t.createdAt.toISOString(),
		updatedAt: t.updatedAt.toISOString(),
		publishedAt: t.publishedAt?.toISOString() ?? null,
	};
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

export async function findActivePool(filters: {
	subjectId: string;
	topics?: string[];
	difficulties?: number[];
	classifications?: string[];
}): Promise<PoolQuestion[]> {
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
		select: poolSelect,
	});
}

export async function findActivePoolByTestId(spaceTestId: string): Promise<PoolQuestion[]> {
	return prisma.mcqQuestion.findMany({
		where: { isActive: true, spaceTestId },
		select: poolSelect,
	});
}

export async function countQuestionsByTestId(spaceTestId: string): Promise<number> {
	return prisma.mcqQuestion.count({
		where: { spaceTestId, isActive: true },
	});
}

export async function createSpaceTestWithQuestions(input: {
	slug: string;
	title: string;
	description: string;
	subjectId: string;
	questionCount: number;
	status: PublishStatus;
	questions: McqQuestionInput[];
}): Promise<SpaceTestDTO> {
	const status = input.status;
	return prisma.$transaction(async (tx) => {
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
	input: CreateSpaceTestInput & { slug: string },
): Promise<SpaceTestDTO> {
	const status = input.status ?? 'DRAFT';
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

export async function createSession(spaceTestId: string, questionIds: string[]) {
	return prisma.spaceTestSession.create({
		data: { spaceTestId, questionIds },
	});
}

export async function findSessionById(id: string) {
	return prisma.spaceTestSession.findUnique({
		where: { id },
		include: { spaceTest: { include: { subject: true } } },
	});
}

export async function submitSession(
	id: string,
	score: number,
	total: number,
): Promise<void> {
	await prisma.spaceTestSession.update({
		where: { id },
		data: { score, total, submittedAt: new Date() },
	});
}

export async function findQuestionsByIds(ids: string[]): Promise<McqQuestion[]> {
	if (ids.length === 0) return [];
	const rows = await prisma.mcqQuestion.findMany({ where: { id: { in: ids } } });
	const byId = new Map(rows.map((r) => [r.id, r]));
	return ids.map((id) => byId.get(id)).filter((r): r is McqQuestion => Boolean(r));
}

export { mapQuestion, mapSpaceTest, mapSubject };
