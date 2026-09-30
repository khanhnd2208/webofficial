import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { routes } from '@/config/routes';

import { htmlLevels, normalizeSlug } from '../domain/normalize';
import {
	listSkip,
	parseListQuery,
	parseOptionalSortDir,
	parsePublishStatus,
	toListPage,
} from '../domain/listQuery';
import { validateKnowledgeUnitPublish } from '../domain/publishValidation';
import { withUniqueConflict } from '../domain/prismaErrors';
import { sanitizeMyClassHtml } from '../domain/sanitize';
import * as repo from '../repositories/knowledgeUnitRepository';
import { KNOWLEDGE_TABLE_SORTS } from '../repositories/knowledgeUnitRepository';
import * as courseRepo from '../repositories/courseRepository';
import type { CreateKnowledgeUnitInput, SaveDraftRevisionInput } from '../schemas';
import type { AdminKnowledgeTablePage, MyClassKnowledgeUnitDetail } from '../types';
import { flattenCurriculum, mapPublicCourse, mapPublishedUnit } from './mappers';

function displayTitle(unit: {
	slug: string;
	currentPublishedRevision?: { title: string } | null;
	revisions?: Array<{ title: string; status?: string }>;
}) {
	return (
		unit.currentPublishedRevision?.title ??
		unit.revisions?.find((item) => item.status === 'DRAFT')?.title ??
		unit.slug
	);
}

export async function listAdminKnowledgeTable(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		courseId?: string;
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
	} = {},
): Promise<AdminKnowledgeTablePage> {
	const query = parseListQuery(
		{
			q: filter.q,
			page: filter.page ? String(filter.page) : undefined,
			pageSize: filter.pageSize ? String(filter.pageSize) : undefined,
			sortBy: filter.sortBy,
			sortDir: filter.sortDir,
		},
		{ sortFields: KNOWLEDGE_TABLE_SORTS, defaultSortBy: 'updatedAt' },
	);
	const { items, total } = await repo.listKnowledgeUnitTable({
		q: query.q ?? filter.q,
		status: filter.status,
		courseId: filter.courseId,
		sortBy: query.sortBy as (typeof KNOWLEDGE_TABLE_SORTS)[number],
		sortDir: query.sortDir,
		skip: listSkip(query.page, query.pageSize),
		take: query.pageSize,
	});
	return toListPage(
		items.map((item) => ({
			id: item.id,
			slug: item.slug,
			title: displayTitle(item),
			status: item.status,
			levelCount: item.currentPublishedRevision
				? htmlLevels(item.currentPublishedRevision).length
				: 0,
			mappingCount: item._count.mappings,
			questionCount: item._count.questionLinks,
			updatedAt: item.updatedAt.toISOString(),
			hasDraft: Boolean(item.revisions[0]),
		})),
		total,
		query.page,
		query.pageSize,
	);
}

export function knowledgeTableQueryFromSearch(search: {
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

export async function listAdminKnowledgeUnits(filter: {
	q?: string;
	status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	courseId?: string;
}) {
	const items = await repo.listKnowledgeUnits(filter);
	return items.map((item) => ({
		...item,
		title: displayTitle(item),
		levels: item.currentPublishedRevision ? htmlLevels(item.currentPublishedRevision) : [],
	}));
}

export async function getAdminKnowledgeUnit(id: string) {
	const unit = await repo.findKnowledgeUnit(id);
	if (!unit) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	return {
		...unit,
		title: displayTitle(unit),
		whereUsed: unit.mappings.map((mapping) => ({
			courseId: mapping.section.lesson.course.id,
			courseTitle: mapping.section.lesson.course.title,
			lessonTitle: mapping.section.lesson.title,
			sectionTitle: mapping.section.title,
			href: `${routes.admin.myClassCourseContent(mapping.section.lesson.course.id)}?node=unit:${id}`,
		})),
		related: [
			...unit.relatedFrom.map((rel) => ({
				id: rel.to.id,
				slug: rel.to.slug,
				title: displayTitle(rel.to),
			})),
			...unit.relatedTo.map((rel) => ({
				id: rel.from.id,
				slug: rel.from.slug,
				title: displayTitle(rel.from),
			})),
		].filter(
			(item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
		),
	};
}

export async function createKnowledgeUnit(
	input: CreateKnowledgeUnitInput,
	attach?: { sectionId: string },
) {
	const slug = normalizeSlug(input.slug ?? input.title, 'knowledge-unit');
	if (await repo.findKnowledgeUnitBySlug(slug)) {
		throw new AppError(`Knowledge Unit slug đã tồn tại: ${slug}`, 409, 'CONFLICT');
	}
	const created = await prisma.$transaction(async (tx) => {
		const unit = await tx.knowledgeUnit.create({ data: { slug, status: 'DRAFT' } });
		await tx.knowledgeUnitRevision.create({
			data: {
				knowledgeUnitId: unit.id,
				version: 1,
				title: input.title.trim(),
				summary: input.summary?.trim() ?? '',
				foundationHtml: sanitizeMyClassHtml(input.foundationHtml),
				academicHtml: sanitizeMyClassHtml(input.academicHtml),
				expertHtml: sanitizeMyClassHtml(input.expertHtml),
				status: 'DRAFT',
			},
		});
		if (attach?.sectionId) {
			const max = await tx.myClassSectionKnowledgeUnit.aggregate({
				where: { sectionId: attach.sectionId },
				_max: { position: true },
			});
			await tx.myClassSectionKnowledgeUnit.create({
				data: {
					sectionId: attach.sectionId,
					knowledgeUnitId: unit.id,
					position: (max._max.position ?? -1) + 1,
				},
			});
		}
		return unit;
	});
	return getAdminKnowledgeUnit(created.id);
}

async function ensureDraft(knowledgeUnitId: string) {
	const unit = await repo.findKnowledgeUnit(knowledgeUnitId);
	if (!unit) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const draft = unit.revisions.find((item) => item.status === 'DRAFT');
	if (draft) return { unit, draft };
	const source = unit.currentPublishedRevision ?? unit.revisions[0];
	const version = (unit.revisions[0]?.version ?? 0) + 1;
	const created = await repo.createRevision({
		knowledgeUnitId,
		version,
		title: source?.title ?? unit.slug,
		summary: source?.summary ?? '',
		foundationHtml: source?.foundationHtml ?? '',
		academicHtml: source?.academicHtml ?? '',
		expertHtml: source?.expertHtml ?? '',
		status: 'DRAFT',
	});
	return { unit, draft: created };
}

export async function saveDraftRevision(id: string, input: SaveDraftRevisionInput) {
	const { unit, draft } = await ensureDraft(id);
	if (input.expectedUpdatedAt && unit.updatedAt.toISOString() !== input.expectedUpdatedAt) {
		throw new AppError('Dữ liệu đã được người khác cập nhật', 409, 'CONFLICT');
	}
	if (input.slug) {
		const slug = normalizeSlug(input.slug, draft.title);
		await withUniqueConflict('Knowledge Unit slug đã tồn tại', () =>
			repo.updateKnowledgeUnit(id, { slug }),
		);
	}
	await repo.updateRevision(draft.id, {
		title: input.title.trim(),
		summary: input.summary?.trim() ?? '',
		foundationHtml: sanitizeMyClassHtml(input.foundationHtml),
		academicHtml: sanitizeMyClassHtml(input.academicHtml),
		expertHtml: sanitizeMyClassHtml(input.expertHtml),
	});
	await prisma.knowledgeUnit.update({ where: { id }, data: { updatedAt: new Date() } });
	return getAdminKnowledgeUnit(id);
}

export async function publishRevision(id: string, expectedUpdatedAt?: string, requireBoth = false) {
	const unit = await repo.findKnowledgeUnit(id);
	if (!unit) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	if (expectedUpdatedAt && unit.updatedAt.toISOString() !== expectedUpdatedAt) {
		throw new AppError('Dữ liệu đã được người khác cập nhật', 409, 'CONFLICT');
	}
	const draft = unit.revisions.find((item) => item.status === 'DRAFT');
	if (!draft) throw new AppError('Không có bản nháp để xuất bản', 422, 'PUBLISH_BLOCKED');
	const issues = validateKnowledgeUnitPublish({ ...draft, requireShortAndDeep: requireBoth });
	if (issues.length) throw new AppError(issues[0]!.message, 422, 'PUBLISH_BLOCKED');
	await prisma.$transaction(async (tx) => {
		if (unit.currentPublishedRevisionId && unit.currentPublishedRevisionId !== draft.id) {
			await tx.knowledgeUnitRevision.update({
				where: { id: unit.currentPublishedRevisionId },
				data: { status: 'ARCHIVED' },
			});
		}
		await tx.knowledgeUnitRevision.update({
			where: { id: draft.id },
			data: { status: 'PUBLISHED', publishedAt: new Date() },
		});
		await tx.knowledgeUnit.update({
			where: { id },
			data: { status: 'PUBLISHED', currentPublishedRevisionId: draft.id },
		});
	});
	return getAdminKnowledgeUnit(id);
}

export async function archiveKnowledgeUnit(id: string) {
	await getAdminKnowledgeUnit(id);
	return prisma.$transaction(async (tx) => {
		await tx.knowledgeUnit.update({
			where: { id },
			data: { status: 'ARCHIVED', currentPublishedRevisionId: null },
		});
		const questions = await tx.myClassQuestion.findMany({
			where: {
				knowledgeUnits: { some: { knowledgeUnitId: id } },
				tests: { some: { test: { status: 'PUBLISHED' } } },
			},
			select: { tests: { select: { testId: true } } },
		});
		const testIds = [
			...new Set(questions.flatMap((item) => item.tests.map((link) => link.testId))),
		];
		if (testIds.length)
			await tx.myClassTest.updateMany({
				where: { id: { in: testIds } },
				data: { status: 'DRAFT', publishedAt: null },
			});
		return tx.knowledgeUnit.findUnique({ where: { id } });
	});
}

export async function addRelatedKnowledgeUnit(fromId: string, toId: string) {
	if (fromId === toId) throw new AppError('Không thể liên kết Knowledge Unit với chính nó', 422);
	await getAdminKnowledgeUnit(fromId);
	await getAdminKnowledgeUnit(toId);
	await withUniqueConflict('Related KU đã tồn tại', () => repo.addRelation(fromId, toId));
	return getAdminKnowledgeUnit(fromId);
}

export async function removeRelatedKnowledgeUnit(fromId: string, toId: string) {
	await repo.removeRelation(fromId, toId);
	return getAdminKnowledgeUnit(fromId);
}

export async function getKnowledgeUnit(
	courseSlug: string,
	kuSlug: string,
	requestedContext?: { lessonSlug?: string; sectionId?: string },
): Promise<MyClassKnowledgeUnitDetail> {
	const [course, unitRow] = await Promise.all([
		courseRepo.findPublishedCourse(courseSlug),
		repo.findPublishedUnitBySlug(kuSlug),
	]);
	if (!course) throw new AppError('Không tìm thấy lớp học', 404);
	if (!unitRow) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const mapped = mapPublicCourse(course);
	const flow = flattenCurriculum(mapped);
	const index = flow.findIndex(
		(item) =>
			item.slug === kuSlug &&
			(!requestedContext?.lessonSlug || item.lessonSlug === requestedContext.lessonSlug) &&
			(!requestedContext?.sectionId || item.sectionId === requestedContext.sectionId),
	);
	if (index < 0) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	if (requestedContext?.lessonSlug || requestedContext?.sectionId) {
		const contextMatch = flow[index]!;
		if (requestedContext.lessonSlug && contextMatch.lessonSlug !== requestedContext.lessonSlug) {
			throw new AppError('Không tìm thấy Knowledge Unit', 404);
		}
		if (requestedContext.sectionId && contextMatch.sectionId !== requestedContext.sectionId) {
			throw new AppError('Không tìm thấy Knowledge Unit', 404);
		}
	}
	const context = flow[index]!;
	const unit = mapPublishedUnit(unitRow);
	if (!unit) throw new AppError('Không tìm thấy Knowledge Unit', 404);

	const relatedIds = await prisma.knowledgeUnitRelation.findMany({
		where: { fromId: unit.id },
		select: { toId: true },
	});
	const inCourse = new Set(flow.map((item) => item.slug));
	const relatedUnits = await prisma.knowledgeUnit.findMany({
		where: { id: { in: relatedIds.map((item) => item.toId) }, status: 'PUBLISHED' },
		include: { currentPublishedRevision: true },
	});
	const related = relatedUnits
		.map((item) => mapPublishedUnit(item))
		.filter((item): item is NonNullable<typeof item> => item !== null && inCourse.has(item.slug))
		.map((item) => {
			const relatedContext =
				flow.find(
					(candidate) => candidate.slug === item.slug && candidate.sectionId === context.sectionId,
				) ?? flow.find((candidate) => candidate.slug === item.slug);
			return {
				slug: item.slug,
				title: item.title,
				href: relatedContext
					? routes.myClassUnit(course.slug, relatedContext.lessonSlug, item.slug, {
							sectionSlug: relatedContext.sectionSlug,
						})
					: undefined,
			};
		});

	const neighbor = (offset: number) => {
		const item = flow[index + offset];
		if (!item) return null;
		return {
			slug: item.slug,
			title: item.title,
			lessonSlug: item.lessonSlug,
			sectionId: item.sectionId,
			sectionSlug: item.sectionSlug,
			knowledgeUnitId: item.id,
		};
	};

	return {
		course: { id: course.id, slug: course.slug, title: course.title },
		context: {
			lessonId: context.lessonId,
			lessonSlug: context.lessonSlug,
			lessonTitle: context.lessonTitle,
			sectionId: context.sectionId,
			sectionSlug: context.sectionSlug,
			sectionTitle: context.sectionTitle,
		},
		unit,
		previous: neighbor(-1),
		next: neighbor(1),
		related,
	};
}
