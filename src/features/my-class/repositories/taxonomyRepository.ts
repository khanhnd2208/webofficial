import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import {
	joinTopicPath,
	rewriteDescendantPaths,
	topicDepthFromPath,
	topicSlugFromName,
} from '../domain/topicPath';

export async function listSubjects() {
	return prisma.myClassSubject.findMany({
		orderBy: [{ position: 'asc' }, { name: 'asc' }],
		include: { _count: { select: { topics: true, questions: true, tests: true, courses: true } } },
	});
}

export async function findSubject(id: string) {
	return prisma.myClassSubject.findUnique({ where: { id } });
}

export async function findSubjectBySlug(slug: string) {
	return prisma.myClassSubject.findUnique({ where: { slug } });
}

export async function createSubject(data: {
	slug: string;
	name: string;
	summary?: string;
	position?: number;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
	return prisma.myClassSubject.create({
		data: {
			slug: data.slug,
			name: data.name,
			summary: data.summary ?? '',
			position: data.position ?? 0,
			status: data.status ?? 'PUBLISHED',
		},
	});
}

export async function updateSubject(
	id: string,
	data: Partial<{
		slug: string;
		name: string;
		summary: string;
		position: number;
		status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	}>,
) {
	return prisma.myClassSubject.update({ where: { id }, data });
}

export async function listTopics(subjectId?: string) {
	return prisma.myClassTopic.findMany({
		where: subjectId ? { subjectId } : {},
		orderBy: [{ depth: 'asc' }, { position: 'asc' }, { name: 'asc' }],
		take: 500,
		include: {
			knowledgeUnits: {
				include: {
					knowledgeUnit: {
						select: { id: true, slug: true, currentPublishedRevision: { select: { title: true } } },
					},
				},
			},
			_count: { select: { questions: true, children: true } },
		},
	});
}

export async function findTopic(id: string) {
	return prisma.myClassTopic.findUnique({
		where: { id },
		include: {
			subject: true,
			parent: true,
			knowledgeUnits: true,
		},
	});
}

export async function createTopic(data: {
	subjectId: string;
	parentId?: string | null;
	slug: string;
	name: string;
	path: string;
	depth: number;
	position?: number;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	knowledgeUnitIds?: string[];
}) {
	return prisma.myClassTopic.create({
		data: {
			subjectId: data.subjectId,
			parentId: data.parentId ?? null,
			slug: data.slug,
			name: data.name,
			path: data.path,
			depth: data.depth,
			position: data.position ?? 0,
			status: data.status ?? 'PUBLISHED',
			knowledgeUnits: data.knowledgeUnitIds?.length
				? { create: data.knowledgeUnitIds.map((knowledgeUnitId) => ({ knowledgeUnitId })) }
				: undefined,
		},
	});
}

export async function updateTopic(
	id: string,
	data: {
		name?: string;
		slug?: string;
		parentId?: string | null;
		position?: number;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		knowledgeUnitIds?: string[];
		path?: string;
		depth?: number;
		subjectId?: string;
	},
) {
	const { knowledgeUnitIds, ...rest } = data;
	return prisma.$transaction(async (tx) => {
		if (knowledgeUnitIds) {
			await tx.myClassTopicKnowledgeUnit.deleteMany({ where: { topicId: id } });
			if (knowledgeUnitIds.length) {
				await tx.myClassTopicKnowledgeUnit.createMany({
					data: knowledgeUnitIds.map((knowledgeUnitId) => ({ topicId: id, knowledgeUnitId })),
				});
			}
		}
		return tx.myClassTopic.update({ where: { id }, data: rest });
	});
}

export async function rewriteTopicSubtree(oldPath: string, newPath: string, subjectId: string) {
	const rows = await prisma.myClassTopic.findMany({
		where: { subjectId, OR: [{ path: oldPath }, { path: { startsWith: `${oldPath}/` } }] },
		select: { id: true, path: true },
	});
	const next = rewriteDescendantPaths(oldPath, newPath, rows);
	await prisma.$transaction(
		next.map((row) =>
			prisma.myClassTopic.update({
				where: { id: row.id },
				data: { path: row.path, depth: row.depth },
			}),
		),
	);
}

export function topicPathFor(parentPath: string | null | undefined, nameOrSlug: string) {
	const slug = topicSlugFromName(nameOrSlug);
	const path = joinTopicPath(parentPath, slug);
	return { slug, path, depth: topicDepthFromPath(path) };
}

export async function topicsForKnowledgeUnits(knowledgeUnitIds: string[]) {
	if (!knowledgeUnitIds.length) return [];
	return prisma.myClassTopic.findMany({
		where: { knowledgeUnits: { some: { knowledgeUnitId: { in: knowledgeUnitIds } } } },
		include: { subject: true },
		orderBy: [{ path: 'asc' }],
	});
}

export async function knowledgeUnitsForTopic(topicId: string) {
	return prisma.myClassTopicKnowledgeUnit.findMany({
		where: { topicId },
		include: { knowledgeUnit: { include: { currentPublishedRevision: true } } },
	});
}

export type TopicCreateInput = Prisma.MyClassTopicCreateInput;
