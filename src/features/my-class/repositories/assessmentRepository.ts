import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/appError';

import type { Prisma } from '@prisma/client';

import { descendantPathPrefix } from '../domain/topicPath';
import { normalizeBankFilter, type BankFilter } from '../domain/bankFilter';
import { placementKey } from '../domain/placementKey';
import type { AnswerSpec, MyClassQuestionType, MyClassTestRevealPolicy } from '../types';

export const questionInclude = {
	knowledgeUnits: {
		include: { knowledgeUnit: { include: { currentPublishedRevision: true } } },
	},
	subject: true,
	topic: true,
	_count: { select: { tests: true, answers: true } },
} satisfies Prisma.MyClassQuestionInclude;

const testQuestionInclude = {
	orderBy: { position: 'asc' as const },
	include: {
		question: {
			include: {
				knowledgeUnits: {
					include: { knowledgeUnit: { include: { currentPublishedRevision: true } } },
				},
				subject: true,
				topic: true,
			},
		},
	},
};

export async function buildQuestionWhere(filter: BankFilter): Promise<Prisma.MyClassQuestionWhereInput> {
	const normalized = normalizeBankFilter(filter);
	const and: Prisma.MyClassQuestionWhereInput[] = [];
	if (normalized.status) and.push({ status: normalized.status });
	if (normalized.types?.length) and.push({ type: { in: normalized.types } });
	if (normalized.bloom?.length) and.push({ difficulty: { in: normalized.bloom } });
	if (normalized.subjectId) and.push({ subjectId: normalized.subjectId });
	if (normalized.q) {
		and.push({
			OR: [
				{ slug: { contains: normalized.q, mode: 'insensitive' } },
				{ stem: { contains: normalized.q, mode: 'insensitive' } },
				{ tags: { has: normalized.q } },
				{ source: { contains: normalized.q, mode: 'insensitive' } },
			],
		});
	}
	if (normalized.tags?.length) {
		if (normalized.tagMode === 'OR') and.push({ tags: { hasSome: normalized.tags } });
		else for (const tag of normalized.tags) and.push({ tags: { has: tag } });
	}
	if (normalized.topicId) {
		const topic = await prisma.myClassTopic.findUnique({ where: { id: normalized.topicId } });
		if (topic) {
			if (normalized.includeDescendants) {
				and.push({
					topic: {
						subjectId: topic.subjectId,
						OR: [{ path: topic.path }, { path: { startsWith: descendantPathPrefix(topic.path) } }],
					},
				});
			} else {
				and.push({ topicId: topic.id });
			}
		}
	}
	if (normalized.knowledgeUnitIds?.length) {
		and.push({
			knowledgeUnits: { some: { knowledgeUnitId: { in: normalized.knowledgeUnitIds } } },
		});
	}
	if (normalized.courseId) {
		const inCourse: Prisma.MyClassQuestionWhereInput = {
			knowledgeUnits: {
				some: {
					knowledgeUnit: {
						mappings: { some: { section: { lesson: { courseId: normalized.courseId } } } },
					},
				},
			},
		};
		const topicFromCourse: Prisma.MyClassQuestionWhereInput = {
			topic: {
				knowledgeUnits: {
					some: {
						knowledgeUnit: {
							mappings: { some: { section: { lesson: { courseId: normalized.courseId } } } },
						},
					},
				},
			},
		};
		and.push({ OR: [inCourse, topicFromCourse] });
	}
	if (normalized.usedInTestId) and.push({ tests: { some: { testId: normalized.usedInTestId } } });
	if (normalized.excludeTestId) and.push({ tests: { none: { testId: normalized.excludeTestId } } });
	if (normalized.unusedOnly) and.push({ tests: { none: {} } });
	if (normalized.cursor) {
		const updatedAt = new Date(normalized.cursor.updatedAt);
		and.push({
			OR: [
				{ updatedAt: { lt: updatedAt } },
				{ updatedAt, id: { lt: normalized.cursor.id } },
			],
		});
	}
	return and.length ? { AND: and } : {};
}

export async function listQuestions(filter: BankFilter = {}) {
	const normalized = normalizeBankFilter(filter);
	const where = await buildQuestionWhere(normalized);
	const orderBy: Prisma.MyClassQuestionOrderByWithRelationInput[] =
		normalized.sort === 'difficulty'
			? [{ difficulty: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }]
			: normalized.sort === 'usage'
				? [{ tests: { _count: 'desc' } }, { updatedAt: 'desc' }, { id: 'desc' }]
				: [{ updatedAt: 'desc' }, { id: 'desc' }];
	return prisma.myClassQuestion.findMany({
		where,
		orderBy,
		include: questionInclude,
		take: normalized.take,
	});
}

export async function countQuestions(filter: BankFilter = {}) {
	const where = await buildQuestionWhere({ ...filter, cursor: undefined });
	return prisma.myClassQuestion.count({ where });
}

export async function listQuestionTable(
	filter: BankFilter & { skip?: number; sortDir?: 'asc' | 'desc' } = {},
) {
	const normalized = normalizeBankFilter(filter);
	const where = await buildQuestionWhere({ ...normalized, cursor: undefined });
	const dir = filter.sortDir ?? 'desc';
	const orderBy: Prisma.MyClassQuestionOrderByWithRelationInput[] =
		normalized.sort === 'difficulty'
			? [{ difficulty: dir }, { updatedAt: 'desc' }, { id: 'desc' }]
			: normalized.sort === 'usage'
				? [{ tests: { _count: dir } }, { updatedAt: 'desc' }, { id: 'desc' }]
				: [{ updatedAt: dir }, { id: 'desc' }];
	const [items, total] = await Promise.all([
		prisma.myClassQuestion.findMany({
			where,
			orderBy,
			skip: filter.skip,
			take: normalized.take,
			select: {
				id: true,
				stem: true,
				type: true,
				difficulty: true,
				status: true,
				tags: true,
				updatedAt: true,
				subject: { select: { name: true } },
				topic: { select: { path: true } },
				_count: { select: { tests: true } },
			},
		}),
		prisma.myClassQuestion.count({ where }),
	]);
	return { items, total };
}

export async function listQuestionFacets(filter: BankFilter = {}) {
	const base = await buildQuestionWhere({ ...filter, cursor: undefined, types: undefined, bloom: undefined, status: undefined, topicId: undefined });
	const [typeRows, bloomRows, statusRows, topicRows, tagRows] = await Promise.all([
		prisma.myClassQuestion.groupBy({ by: ['type'], where: base, _count: true }),
		prisma.myClassQuestion.groupBy({ by: ['difficulty'], where: base, _count: true }),
		prisma.myClassQuestion.groupBy({ by: ['status'], where: base, _count: true }),
		prisma.myClassQuestion.groupBy({
			by: ['topicId'],
			where: { ...base, topicId: { not: null } },
			_count: true,
		}),
		prisma.myClassQuestion.findMany({
			where: base,
			select: { tags: true },
			take: 2000,
		}),
	]);
	const tagCounts = new Map<string, number>();
	for (const row of tagRows) {
		for (const tag of row.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
	}
	const topicIds = topicRows.map((row) => row.topicId).filter((id): id is string => Boolean(id));
	const topics = topicIds.length
		? await prisma.myClassTopic.findMany({
				where: { id: { in: topicIds } },
				select: { id: true, name: true, path: true, subjectId: true },
			})
		: [];
	const topicCount = new Map(topicRows.map((row) => [row.topicId, row._count]));
	return {
		types: typeRows.map((row) => ({ type: row.type, count: row._count })),
		bloom: bloomRows.map((row) => ({ difficulty: row.difficulty, count: row._count })),
		status: statusRows.map((row) => ({ status: row.status, count: row._count })),
		topics: topics.map((topic) => ({ ...topic, count: topicCount.get(topic.id) ?? 0 })),
		tags: [...tagCounts.entries()]
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 40),
	};
}

export async function suggestedTopicsForCourse(courseId: string) {
	const mappings = await prisma.myClassSectionKnowledgeUnit.findMany({
		where: { section: { lesson: { courseId } } },
		select: { knowledgeUnitId: true },
	});
	const kuIds = [...new Set(mappings.map((row) => row.knowledgeUnitId))];
	if (!kuIds.length) return [];
	return prisma.myClassTopic.findMany({
		where: { knowledgeUnits: { some: { knowledgeUnitId: { in: kuIds } } } },
		include: { subject: true },
		orderBy: { path: 'asc' },
	});
}

export async function findQuestion(id: string) {
	return prisma.myClassQuestion.findUnique({
		where: { id },
		include: questionInclude,
	});
}

export async function findQuestionBySlug(slug: string) {
	return prisma.myClassQuestion.findUnique({ where: { slug } });
}

export async function findQuestionSlugs(slugs: string[]) {
	if (!slugs.length) return [];
	return prisma.myClassQuestion.findMany({
		where: { slug: { in: slugs } },
		select: { slug: true },
	});
}

export type QuestionWriteData = {
	slug: string;
	type: MyClassQuestionType;
	stem: string;
	options: Prisma.InputJsonValue;
	answer: Prisma.InputJsonValue;
	explanation: string;
	hint?: string;
	source?: string;
	difficulty: number;
	subjectId?: string | null;
	topicId?: string | null;
	tags?: string[];
	knowledgeUnitIds: string[];
	status?: 'ACTIVE' | 'ARCHIVED';
};

export async function createQuestion(data: QuestionWriteData) {
	return prisma.myClassQuestion.create({
		data: {
			slug: data.slug,
			type: data.type,
			stem: data.stem,
			options: data.options,
			answer: data.answer,
			explanation: data.explanation,
			hint: data.hint ?? '',
			source: data.source ?? '',
			difficulty: data.difficulty,
			subjectId: data.subjectId ?? null,
			topicId: data.topicId ?? null,
			tags: data.tags ?? [],
			knowledgeUnits: {
				create: data.knowledgeUnitIds.map((knowledgeUnitId) => ({ knowledgeUnitId })),
			},
		},
		include: questionInclude,
	});
}

export async function updateQuestion(
	id: string,
	data: Partial<Omit<QuestionWriteData, 'knowledgeUnitIds' | 'slug'>> & {
		slug?: string;
		knowledgeUnitIds?: string[];
	},
) {
	const { knowledgeUnitIds, ...rest } = data;
	return prisma.$transaction(async (tx) => {
		if (knowledgeUnitIds) {
			await tx.myClassQuestionKnowledgeUnit.deleteMany({ where: { questionId: id } });
			if (knowledgeUnitIds.length) {
				await tx.myClassQuestionKnowledgeUnit.createMany({
					data: knowledgeUnitIds.map((knowledgeUnitId) => ({ questionId: id, knowledgeUnitId })),
				});
			}
		}
		return tx.myClassQuestion.update({ where: { id }, data: rest, include: questionInclude });
	});
}

export async function bulkUpdateQuestions(
	ids: string[],
	data: Prisma.MyClassQuestionUncheckedUpdateManyInput,
) {
	return prisma.myClassQuestion.updateMany({ where: { id: { in: ids } }, data });
}

export const TEST_TABLE_SORTS = ['title', 'status', 'updatedAt', 'questions', 'attempts', 'placements'] as const;
export type TestTableSort = (typeof TEST_TABLE_SORTS)[number];

/** Slim row query for admin tables; keep sort fields aligned with TEST_TABLE_SORTS. */

function testWhere(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		subjectId?: string;
		placementCourseId?: string;
		unplaced?: boolean;
		hasAttempts?: boolean;
		topicId?: string;
		tags?: string[];
	} = {},
): Prisma.MyClassTestWhereInput {
	const and: Prisma.MyClassTestWhereInput[] = [];
	if (filter.status) and.push({ status: filter.status });
	else and.push({ status: { not: 'ARCHIVED' } });
	if (filter.subjectId) and.push({ subjectId: filter.subjectId });
	if (filter.q) {
		and.push({
			OR: [
				{ title: { contains: filter.q, mode: 'insensitive' } },
				{ slug: { contains: filter.q, mode: 'insensitive' } },
				{ tags: { has: filter.q } },
			],
		});
	}
	if (filter.tags?.length) {
		for (const tag of filter.tags) and.push({ tags: { has: tag } });
	}
	if (filter.topicId) {
		and.push({ questions: { some: { question: { topicId: filter.topicId } } } });
	}
	if (filter.placementCourseId) {
		and.push({ placements: { some: { courseId: filter.placementCourseId } } });
	}
	if (filter.unplaced === true) and.push({ placements: { none: {} } });
	if (filter.unplaced === false) and.push({ placements: { some: {} } });
	if (filter.hasAttempts === true) and.push({ attempts: { some: {} } });
	if (filter.hasAttempts === false) and.push({ attempts: { none: {} } });
	return and.length ? { AND: and } : {};
}

export async function listAdminTests(
	filter:
		| string
		| {
				q?: string;
				status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
				subjectId?: string;
				placementCourseId?: string;
				unplaced?: boolean;
				hasAttempts?: boolean;
				topicId?: string;
				tags?: string[];
		  } = {},
) {
	const resolved = typeof filter === 'string' ? { placementCourseId: filter } : filter;
	return prisma.myClassTest.findMany({
		where: testWhere(resolved),
		orderBy: { updatedAt: 'desc' },
		take: 200,
		include: {
			subject: true,
			placements: { include: { course: true, lesson: true, section: true } },
			_count: { select: { questions: true, attempts: true, placements: true } },
		},
	});
}

export async function listAdminTestTable(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		subjectId?: string;
		placementCourseId?: string;
		unplaced?: boolean;
		hasAttempts?: boolean;
		topicId?: string;
		tags?: string[];
		sortBy?: TestTableSort;
		sortDir?: 'asc' | 'desc';
		skip?: number;
		take?: number;
	} = {},
) {
	const where = testWhere(filter);
	const sortDir = filter.sortDir ?? 'desc';
	const orderBy =
		filter.sortBy === 'questions'
			? { questions: { _count: sortDir } }
			: filter.sortBy === 'attempts'
				? { attempts: { _count: sortDir } }
				: filter.sortBy === 'placements'
					? { placements: { _count: sortDir } }
					: { [filter.sortBy ?? 'updatedAt']: sortDir };
	const [items, total] = await Promise.all([
		prisma.myClassTest.findMany({
			where,
			orderBy,
			skip: filter.skip,
			take: filter.take,
			select: {
				id: true,
				slug: true,
				title: true,
				status: true,
				updatedAt: true,
				subject: { select: { name: true } },
				placements: { select: { course: { select: { title: true } } }, take: 6 },
				_count: { select: { questions: true, attempts: true, placements: true } },
			},
		}),
		prisma.myClassTest.count({ where }),
	]);
	return { items, total };
}

export async function findAdminTest(id: string) {
	return prisma.myClassTest.findUnique({
		where: { id },
		include: {
			subject: true,
			questions: testQuestionInclude,
			placements: {
				orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
				include: { course: true, lesson: true, section: true },
			},
			_count: { select: { attempts: true, placements: true } },
		},
	});
}

export async function findPublishedPlacement(courseSlug: string, testSlug: string) {
	const rows = await prisma.myClassTestPlacement.findMany({
		where: {
			status: 'PUBLISHED',
			test: { status: 'PUBLISHED', slug: testSlug },
			course: { slug: courseSlug, status: 'PUBLISHED' },
			OR: [
				{ scope: 'COURSE' },
				{ scope: 'LESSON', lesson: { status: 'PUBLISHED' } },
				{ scope: 'SECTION', lesson: { status: 'PUBLISHED' }, section: { status: 'PUBLISHED' } },
			],
		},
		include: {
			course: true,
			lesson: true,
			section: true,
			test: {
				include: {
					questions: {
						where: { question: { status: 'ACTIVE' } },
						orderBy: { position: 'asc' as const },
						include: testQuestionInclude.include,
					},
				},
			},
		},
	});
	const rank = { SECTION: 0, LESSON: 1, COURSE: 2 } as const;
	return [...rows].sort((a, b) => rank[a.scope] - rank[b.scope])[0] ?? null;
}

export async function createTest(data: {
	slug: string;
	title: string;
	description?: string;
	subjectId?: string | null;
	tags?: string[];
	passScore?: number | null;
	timeLimitMinutes?: number | null;
	maxAttempts?: number | null;
	shuffleQuestions?: boolean;
	shuffleOptions?: boolean;
	revealPolicy?: MyClassTestRevealPolicy;
}) {
	return prisma.myClassTest.create({
		data: {
			slug: data.slug,
			title: data.title,
			description: data.description ?? '',
			subjectId: data.subjectId ?? null,
			tags: data.tags ?? [],
			passScore: data.passScore ?? null,
			timeLimitMinutes: data.timeLimitMinutes ?? null,
			maxAttempts: data.maxAttempts ?? null,
			shuffleQuestions: data.shuffleQuestions ?? false,
			shuffleOptions: data.shuffleOptions ?? false,
			revealPolicy: data.revealPolicy ?? 'AFTER_SUBMIT',
		},
	});
}

export async function updateTest(
	id: string,
	data: Partial<{
		title: string;
		slug: string;
		description: string;
		subjectId: string | null;
		tags: string[];
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		publishedAt: Date | null;
		passScore: number | null;
		timeLimitMinutes: number | null;
		maxAttempts: number | null;
		shuffleQuestions: boolean;
		shuffleOptions: boolean;
		revealPolicy: MyClassTestRevealPolicy;
	}>,
) {
	return prisma.myClassTest.update({ where: { id }, data });
}

export async function unlinkAllTestQuestions(testId: string, tx?: Prisma.TransactionClient) {
	await (tx ?? prisma).myClassTestQuestion.deleteMany({ where: { testId } });
}

export async function appendTestQuestion(
	testId: string,
	data: QuestionWriteData,
	tx?: Prisma.TransactionClient,
) {
	const db = tx ?? prisma;
	const question = await db.myClassQuestion.create({
		data: {
			slug: data.slug,
			type: data.type,
			stem: data.stem,
			options: data.options,
			answer: data.answer,
			explanation: data.explanation,
			hint: data.hint ?? '',
			source: data.source ?? '',
			difficulty: data.difficulty,
			subjectId: data.subjectId ?? null,
			topicId: data.topicId ?? null,
			tags: data.tags ?? [],
			knowledgeUnits: {
				create: data.knowledgeUnitIds.map((knowledgeUnitId) => ({ knowledgeUnitId })),
			},
		},
	});
	const max = await db.myClassTestQuestion.aggregate({
		where: { testId },
		_max: { position: true },
	});
	await db.myClassTestQuestion.create({
		data: { testId, questionId: question.id, position: (max._max.position ?? -1) + 1, points: 1 },
	});
	await db.myClassTest.update({
		where: { id: testId },
		data: { status: 'DRAFT', publishedAt: null },
	});
	return question;
}

export async function setTestQuestions(
	testId: string,
	items: Array<{ questionId: string; points?: number }>,
) {
	await prisma.$transaction(async (tx) => {
		const ids = items.map((item) => item.questionId);
		if (new Set(ids).size !== ids.length) {
			throw new AppError('Không được thêm trùng câu hỏi vào Test', 422, 'DUPLICATE_TEST_QUESTION');
		}
		const questions = await tx.myClassQuestion.findMany({
			where: { id: { in: ids } },
			select: { id: true },
		});
		if (questions.length !== ids.length) {
			throw new AppError('Không tìm thấy một hoặc nhiều câu hỏi', 404, 'QUESTION_NOT_FOUND');
		}
		await tx.myClassTestQuestion.deleteMany({ where: { testId } });
		if (items.length) {
			await tx.myClassTestQuestion.createMany({
				data: items.map((item, position) => ({
					testId,
					questionId: item.questionId,
					position,
					points: item.points ?? 1,
				})),
			});
		}
		await tx.myClassTest.update({
			where: { id: testId },
			data: { status: 'DRAFT', publishedAt: null },
		});
	});
	return findAdminTest(testId);
}

export async function createPlacement(data: {
	testId: string;
	courseId: string;
	lessonId?: string | null;
	sectionId?: string | null;
	scope: 'COURSE' | 'LESSON' | 'SECTION';
	position?: number;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
	const key = placementKey(data);
	return prisma.myClassTestPlacement.create({
		data: {
			testId: data.testId,
			courseId: data.courseId,
			lessonId: data.lessonId ?? null,
			sectionId: data.sectionId ?? null,
			scope: data.scope,
			position: data.position ?? 0,
			status: data.status ?? 'PUBLISHED',
			placementKey: key,
		},
		include: { course: true, lesson: true, section: true, test: true },
	});
}

export async function findPlacement(id: string) {
	return prisma.myClassTestPlacement.findUnique({
		where: { id },
		include: { course: true, lesson: true, section: true, test: true },
	});
}

export async function deletePlacement(id: string) {
	return prisma.myClassTestPlacement.delete({ where: { id } });
}

export async function updatePlacement(
	id: string,
	data: Partial<{
		lessonId: string | null;
		sectionId: string | null;
		scope: 'COURSE' | 'LESSON' | 'SECTION';
		position: number;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		placementKey: string;
	}>,
) {
	return prisma.myClassTestPlacement.update({ where: { id }, data });
}

export async function countAttempts(
	testId: string,
	actor: { userId?: string | null; guestId?: string | null },
) {
	if (actor.userId) {
		return prisma.myClassTestAttempt.count({ where: { testId, userId: actor.userId } });
	}
	if (actor.guestId) {
		return prisma.myClassTestAttempt.count({ where: { testId, guestId: actor.guestId } });
	}
	return 0;
}

export async function createAttempt(data: {
	testId: string;
	placementId?: string | null;
	courseId?: string | null;
	userId?: string | null;
	guestId?: string | null;
	cohortId: string | null;
	score: number;
	total: number;
	earnedPoints: number;
	totalPoints: number;
	durationSeconds?: number | null;
	answers: Array<{
		questionId: string;
		typeSnapshot: MyClassQuestionType;
		stemSnapshot: string;
		optionsSnapshot: Prisma.InputJsonValue;
		answerSnapshot: Prisma.InputJsonValue;
		response: Prisma.InputJsonValue;
		correctKey?: string | null;
		chosenKey?: string | null;
		explanation: string;
		earned: number;
		max: number;
		isCorrect: boolean;
	}>;
	evidence: Array<{
		knowledgeUnitId: string;
		weight: number;
		correctCount: number;
		questionCount: number;
		knowledgeUnitSlugSnapshot?: string | null;
		knowledgeUnitTitleSnapshot?: string | null;
		rawResponseCount?: number | null;
	}>;
}) {
	return prisma.$transaction(async (tx) => {
		const attempt = await tx.myClassTestAttempt.create({
			data: {
				testId: data.testId,
				placementId: data.placementId ?? null,
				courseId: data.courseId ?? null,
				userId: data.userId ?? null,
				guestId: data.guestId ?? null,
				cohortId: data.cohortId,
				score: data.score,
				total: data.total,
				earnedPoints: data.earnedPoints,
				totalPoints: data.totalPoints,
				durationSeconds: data.durationSeconds ?? null,
			},
		});
		if (data.answers.length) {
			await tx.myClassAttemptAnswer.createMany({
				data: data.answers.map((answer) => ({
					...answer,
					attemptId: attempt.id,
				})) as Prisma.MyClassAttemptAnswerCreateManyInput[],
			});
		}
		if (data.evidence.length) {
			await tx.myClassAttemptKuEvidence.createMany({
				data: data.evidence.map((row) => ({ ...row, attemptId: attempt.id })),
			});
		}
		return attempt;
	});
}

export type StoredAnswerSpec = AnswerSpec;
