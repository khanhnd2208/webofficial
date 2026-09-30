import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';

export const KNOWLEDGE_TABLE_SORTS = [
	'title',
	'status',
	'updatedAt',
	'mappings',
	'questions',
] as const;
export type KnowledgeTableSort = (typeof KNOWLEDGE_TABLE_SORTS)[number];

function knowledgeWhere(filter: {
	q?: string;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	courseId?: string;
}): Prisma.KnowledgeUnitWhereInput {
	const where: Prisma.KnowledgeUnitWhereInput = {};
	if (filter.status) where.status = filter.status;
	if (filter.q) {
		where.OR = [
			{ slug: { contains: filter.q, mode: 'insensitive' } },
			{ revisions: { some: { title: { contains: filter.q, mode: 'insensitive' } } } },
		];
	}
	if (filter.courseId) {
		where.mappings = { some: { section: { lesson: { courseId: filter.courseId } } } };
	}
	return where;
}

export async function listKnowledgeUnits(filter: {
	q?: string;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	courseId?: string;
}) {
	return prisma.knowledgeUnit.findMany({
		where: knowledgeWhere(filter),
		orderBy: { updatedAt: 'desc' },
		take: 200,
		include: {
			currentPublishedRevision: true,
			revisions: { where: { status: 'DRAFT' }, take: 1 },
			_count: { select: { mappings: true, questionLinks: true } },
		},
	});
}

export async function listKnowledgeUnitTable(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		courseId?: string;
		sortBy?: KnowledgeTableSort;
		sortDir?: 'asc' | 'desc';
		skip?: number;
		take?: number;
	} = {},
) {
	const where = knowledgeWhere(filter);
	const sortDir = filter.sortDir ?? 'desc';
	const orderBy =
		filter.sortBy === 'mappings'
			? { mappings: { _count: sortDir } }
			: filter.sortBy === 'questions'
				? { questionLinks: { _count: sortDir } }
				: filter.sortBy === 'title'
					? { currentPublishedRevision: { title: sortDir } }
					: { [filter.sortBy ?? 'updatedAt']: sortDir };
	const [items, total] = await Promise.all([
		prisma.knowledgeUnit.findMany({
			where,
			orderBy,
			skip: filter.skip,
			take: filter.take,
			select: {
				id: true,
				slug: true,
				status: true,
				updatedAt: true,
				currentPublishedRevision: {
					select: { title: true, foundationHtml: true, academicHtml: true, expertHtml: true },
				},
				revisions: { where: { status: 'DRAFT' }, take: 1, select: { title: true } },
				_count: { select: { mappings: true, questionLinks: true } },
			},
		}),
		prisma.knowledgeUnit.count({ where }),
	]);
	return { items, total };
}

export async function findKnowledgeUnit(id: string) {
	return prisma.knowledgeUnit.findUnique({
		where: { id },
		include: {
			currentPublishedRevision: true,
			revisions: { orderBy: { version: 'desc' } },
			relatedFrom: { include: { to: { include: { currentPublishedRevision: true } } } },
			relatedTo: { include: { from: { include: { currentPublishedRevision: true } } } },
			mappings: {
				include: {
					section: { include: { lesson: { include: { course: true } } } },
				},
			},
		},
	});
}

export async function findKnowledgeUnitBySlug(slug: string) {
	return prisma.knowledgeUnit.findUnique({ where: { slug } });
}

export async function findPublishedUnitBySlug(slug: string) {
	return prisma.knowledgeUnit.findFirst({
		where: { slug, status: 'PUBLISHED', currentPublishedRevisionId: { not: null } },
		include: { currentPublishedRevision: true },
	});
}

export async function createKnowledgeUnit(slug: string) {
	return prisma.knowledgeUnit.create({ data: { slug, status: 'DRAFT' } });
}

export async function createRevision(data: {
	knowledgeUnitId: string;
	version: number;
	title: string;
	summary: string;
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	publishedAt?: Date | null;
}) {
	return prisma.knowledgeUnitRevision.create({ data });
}

export async function updateRevision(
	id: string,
	data: Partial<{
		title: string;
		summary: string;
		foundationHtml: string;
		academicHtml: string;
		expertHtml: string;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		publishedAt: Date | null;
	}>,
) {
	return prisma.knowledgeUnitRevision.update({ where: { id }, data });
}

export async function updateKnowledgeUnit(
	id: string,
	data: Partial<{
		slug: string;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		currentPublishedRevisionId: string | null;
	}>,
) {
	return prisma.knowledgeUnit.update({ where: { id }, data });
}

export async function addRelation(fromId: string, toId: string) {
	return prisma.$transaction(async (tx) => {
		await tx.knowledgeUnitRelation.upsert({
			where: { fromId_toId: { fromId, toId } },
			create: { fromId, toId },
			update: {},
		});
		return tx.knowledgeUnitRelation.upsert({
			where: { fromId_toId: { fromId: toId, toId: fromId } },
			create: { fromId: toId, toId: fromId },
			update: {},
		});
	});
}

export async function removeRelation(fromId: string, toId: string) {
	return prisma.$transaction(async (tx) => {
		await tx.knowledgeUnitRelation.deleteMany({
			where: {
				OR: [
					{ fromId, toId },
					{ fromId: toId, toId: fromId },
				],
			},
		});
	});
}

export async function courseKnowledgeUnitIds(courseId: string): Promise<Set<string>> {
	const mappings = await prisma.myClassSectionKnowledgeUnit.findMany({
		where: { section: { lesson: { courseId } } },
		select: { knowledgeUnitId: true },
	});
	return new Set(mappings.map((item) => item.knowledgeUnitId));
}
