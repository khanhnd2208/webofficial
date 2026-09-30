import type { Prisma } from '@prisma/client';
import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { validateCoursePublish } from '../domain/publishValidation';
import { normalizeSlug } from '../domain/normalize';
import { withUniqueConflict } from '../domain/prismaErrors';
import { seedsFromCourseOutline, toOutlineItemLink } from '../domain/learnerState';
import { isReservedLessonSlug } from '../domain/workspaceUrl';
import * as repo from '../repositories/courseRepository';
import * as kuRepo from '../repositories/knowledgeUnitRepository';
import type { CreateCourseInput, LessonInput, SectionInput, UpdateCourseInput } from '../schemas';
import {
	listSkip,
	parseCourseLevel,
	parseListQuery,
	parseOptionalSortDir,
	parsePublishStatus,
	toListPage,
	unwrapItems,
} from '../domain/listQuery';
import { COURSE_TABLE_SORTS } from '../repositories/courseRepository';
import type {
	AdminCourseOption,
	AdminCourseTablePage,
	AdminOverviewStats,
	MyClassCourseCard,
	MyClassCourseDetail,
	MyClassLessonDetail,
	PublishIssue,
} from '../types';
import { isLearnerVisibleVocabAssignment } from '../domain/vocabScope';
import { mapPublicCourse, mapVocabAssignment } from './mappers';
import * as vocabRepo from '../repositories/vocabAssignmentRepository';

export async function listCourses(): Promise<MyClassCourseCard[]> {
	const courses = await repo.listPublishedCourseOutlines();
	return courses.map((course) => {
		const mapped = mapPublicCourse(course);
		const seeds = seedsFromCourseOutline(mapped);
		const firstUnit = seeds[0];
		return {
			id: mapped.id,
			slug: mapped.slug,
			title: mapped.title,
			summary: mapped.summary,
			description: mapped.description,
			thumbnailUrl: mapped.thumbnailUrl,
			level: mapped.level,
			tags: mapped.tags,
			lessonCount: mapped.lessonCount,
			unitCount: mapped.unitCount,
			estimatedMinutes: mapped.estimatedMinutes,
			firstUnitHref: firstUnit ? toOutlineItemLink(firstUnit, seeds).href : undefined,
		};
	});
}

export async function hasPublishedCourses(): Promise<boolean> {
	return (await repo.countPublishedCourses()) > 0;
}

export async function getCourse(slug: string): Promise<MyClassCourseDetail> {
	const course = await repo.findPublishedCourse(slug);
	if (!course) throw new AppError('Không tìm thấy lớp học', 404);
	const mapped = mapPublicCourse(course);
	const assignments = await vocabRepo.listAssignments(course.id);
	mapped.vocabSets = assignments.filter(isLearnerVisibleVocabAssignment).map(mapVocabAssignment);
	return mapped;
}

export async function getLesson(
	courseSlug: string,
	lessonSlug: string,
): Promise<MyClassLessonDetail> {
	const course = await getCourse(courseSlug);
	const lesson = course.lessons.find((item) => item.slug === lessonSlug);
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	return { course: { slug: course.slug, title: course.title }, lesson };
}

export async function listAdminCourseOptions(): Promise<AdminCourseOption[]> {
	return unwrapItems(await repo.listAdminCourseOptions());
}

export async function listAdminCourses(
	filter: {
		q?: string;
		status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
		level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortDir?: 'asc' | 'desc';
	} = {},
): Promise<AdminCourseTablePage> {
	const query = parseListQuery(
		{
			q: filter.q,
			page: filter.page ? String(filter.page) : undefined,
			pageSize: filter.pageSize ? String(filter.pageSize) : undefined,
			sortBy: filter.sortBy,
			sortDir: filter.sortDir,
		},
		{ sortFields: COURSE_TABLE_SORTS, defaultSortBy: 'updatedAt' },
	);
	const { items, total } = await repo.listAdminCourses({
		q: query.q ?? filter.q,
		status: filter.status,
		level: filter.level,
		sortBy: query.sortBy as (typeof COURSE_TABLE_SORTS)[number],
		sortDir: query.sortDir,
		skip: listSkip(query.page, query.pageSize),
		take: query.pageSize,
	});
	const draftIds = await repo.coursesWithUnpublishedDraft(items.map((item) => item.id));
	return toListPage(
		items.map((course) => ({
			id: course.id,
			slug: course.slug,
			title: course.title,
			status: course.status,
			level: course.level,
			tags: course.tags,
			lessonCount: course._count.lessons,
			placementCount: course._count.placements,
			cohortCount: course._count.cohorts,
			memberCount: course._count.memberships,
			updatedAt: course.updatedAt.toISOString(),
			hasUnpublishedDraft: draftIds.has(course.id),
		})),
		total,
		query.page,
		query.pageSize,
	);
}

export function courseTableQueryFromSearch(search: {
	q?: string;
	status?: string;
	level?: string;
	page?: string;
	pageSize?: string;
	sortBy?: string;
	sortDir?: string;
}) {
	return {
		q: search.q,
		status: parsePublishStatus(search.status),
		level: parseCourseLevel(search.level),
		page: search.page ? Number(search.page) : undefined,
		pageSize: search.pageSize ? Number(search.pageSize) : undefined,
		sortBy: search.sortBy,
		sortDir: parseOptionalSortDir(search.sortDir),
	};
}

export async function getAdminCourse(id: string) {
	const course = await repo.findAdminCourse(id);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	return course;
}

export async function getAdminCourseOutline(id: string) {
	const course = await repo.findAdminCourseOutline(id);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	return course;
}

export async function getAdminOverview(): Promise<AdminOverviewStats> {
	return repo.overviewCounts();
}

export async function createAdminCourse(input: CreateCourseInput) {
	const slug = normalizeSlug(input.slug ?? input.title, 'my-class-course');
	const existing = await repo.findCourseBySlug(slug);
	if (existing) throw new AppError(`Course slug đã tồn tại: ${slug}`, 409, 'CONFLICT');
	return withUniqueConflict(`Course slug đã tồn tại: ${slug}`, () =>
		repo.createCourse({
			slug,
			title: input.title.trim(),
			summary: input.summary?.trim() ?? '',
			description: input.description ?? '',
			thumbnailUrl: input.thumbnailUrl ?? null,
			level: input.level ?? null,
			tags: input.tags ?? [],
			subjectId: input.subjectId ?? null,
		}),
	);
}

export async function updateAdminCourse(id: string, input: UpdateCourseInput) {
	const existing = await getAdminCourse(id);
	if (input.expectedUpdatedAt && existing.updatedAt.toISOString() !== input.expectedUpdatedAt) {
		throw new AppError('Dữ liệu đã được người khác cập nhật', 409, 'CONFLICT');
	}
	if (input.status === 'PUBLISHED') {
		const report = await validateAdminCoursePublish(id);
		if (report.length) throw new AppError(report[0]!.message, 422, 'PUBLISH_BLOCKED');
	}
	return withUniqueConflict('Course slug đã tồn tại', () =>
		repo.updateCourse(id, {
			...(input.title !== undefined ? { title: input.title.trim() } : {}),
			...(input.slug !== undefined ? { slug: normalizeSlug(input.slug, existing.slug) } : {}),
			...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
			...(input.level !== undefined ? { level: input.level } : {}),
			...(input.tags !== undefined ? { tags: input.tags } : {}),
			...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
			...(input.status !== undefined
				? {
						status: input.status,
						publishedAt: input.status === 'PUBLISHED' ? new Date() : existing.publishedAt,
					}
				: {}),
		}),
	);
}

async function draftTestsForPlacements(
	tx: Prisma.TransactionClient,
	where: { courseId?: string; lessonId?: string; sectionId?: string },
) {
	const rows = await tx.myClassTestPlacement.findMany({ where, select: { testId: true } });
	const ids = [...new Set(rows.map((row) => row.testId))];
	if (!ids.length) return;
	await tx.myClassTest.updateMany({
		where: { id: { in: ids }, status: 'PUBLISHED' },
		data: { status: 'DRAFT', publishedAt: null },
	});
}

export async function archiveAdminCourse(id: string) {
	await getAdminCourse(id);
	return prisma.$transaction(async (tx) => {
		await tx.myClassCourse.update({ where: { id }, data: { status: 'ARCHIVED' } });
		await draftTestsForPlacements(tx, { courseId: id });
		return tx.myClassCourse.findUnique({ where: { id } });
	});
}

export async function createLesson(courseId: string, input: LessonInput) {
	await getAdminCourse(courseId);
	const slug = normalizeSlug(input.slug ?? input.title, 'lesson');
	if (isReservedLessonSlug(slug)) {
		throw new AppError(`Slug "${slug}" được dành riêng cho hệ thống`, 422);
	}
	const position = (await repo.maxLessonPosition(courseId)) + 1;
	return withUniqueConflict('Lesson slug đã tồn tại trong Course', () =>
		repo.createLesson({
			courseId,
			slug,
			title: input.title.trim(),
			summary: input.summary?.trim() ?? '',
			position,
			status: input.status ?? 'DRAFT',
		}),
	);
}

export async function updateLesson(lessonId: string, input: LessonInput) {
	const lesson = await repo.findLesson(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy Lesson', 404);
	return withUniqueConflict('Lesson slug đã tồn tại trong Course', () =>
		repo.updateLesson(lessonId, {
			title: input.title.trim(),
			...(input.slug !== undefined ? { slug: normalizeSlug(input.slug, lesson.slug) } : {}),
			...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
			...(input.status !== undefined ? { status: input.status } : {}),
		}),
	);
}

export async function archiveLesson(lessonId: string) {
	const lesson = await repo.findLesson(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy Lesson', 404);
	return prisma.$transaction(async (tx) => {
		await tx.myClassLesson.update({ where: { id: lessonId }, data: { status: 'ARCHIVED' } });
		await draftTestsForPlacements(tx, { lessonId });
		return tx.myClassLesson.findUnique({ where: { id: lessonId } });
	});
}

export async function reorderLessons(courseId: string, ids: string[]) {
	const course = await getAdminCourse(courseId);
	const expected = course.lessons.map((item) => item.id);
	if (
		ids.length !== expected.length ||
		new Set(ids).size !== ids.length ||
		ids.some((id) => !expected.includes(id))
	) {
		throw new AppError('Danh sách Lesson không khớp Course', 422);
	}
	return repo.reorderLessons(courseId, ids);
}

export async function createSection(lessonId: string, input: SectionInput) {
	const lesson = await repo.findLesson(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy Lesson', 404);
	const position = (await repo.maxSectionPosition(lessonId)) + 1;
	const baseSlug = normalizeSlug(input.title, `phan-${position + 1}`);
	const existing = lesson.sections.map((section) => section.slug);
	let slug = baseSlug;
	let n = 2;
	while (existing.includes(slug)) {
		slug = `${baseSlug}-${n}`;
		n += 1;
	}
	return repo.createSection({
		lessonId,
		slug,
		title: input.title.trim(),
		summary: input.summary?.trim() ?? '',
		position,
		status: input.status ?? 'DRAFT',
	});
}

export async function updateSection(sectionId: string, input: SectionInput) {
	const section = await repo.findSection(sectionId);
	if (!section) throw new AppError('Không tìm thấy Section', 404);
	return repo.updateSection(sectionId, {
		title: input.title.trim(),
		...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
		...(input.status !== undefined ? { status: input.status } : {}),
	});
}

export async function archiveSection(sectionId: string) {
	const section = await repo.findSection(sectionId);
	if (!section) throw new AppError('Không tìm thấy Section', 404);
	return prisma.$transaction(async (tx) => {
		await tx.myClassSection.update({ where: { id: sectionId }, data: { status: 'ARCHIVED' } });
		await draftTestsForPlacements(tx, { sectionId });
		return tx.myClassSection.findUnique({ where: { id: sectionId } });
	});
}

export async function reorderSections(lessonId: string, ids: string[]) {
	const lesson = await repo.findLesson(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy Lesson', 404);
	const expected = lesson.sections.map((item) => item.id);
	if (
		ids.length !== expected.length ||
		new Set(ids).size !== ids.length ||
		ids.some((id) => !expected.includes(id))
	) {
		throw new AppError('Danh sách Section không khớp Lesson', 422);
	}
	return repo.reorderSections(lessonId, ids);
}

export async function attachKnowledgeUnit(sectionId: string, knowledgeUnitId: string) {
	const section = await repo.findSection(sectionId);
	if (!section) throw new AppError('Không tìm thấy Section', 404);
	const unit = await kuRepo.findKnowledgeUnit(knowledgeUnitId);
	if (!unit) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const position = (await repo.maxKnowledgePosition(sectionId)) + 1;
	return withUniqueConflict('Knowledge Unit đã được gắn vào Section này', () =>
		repo.attachKnowledge(sectionId, knowledgeUnitId, position),
	);
}

export async function detachKnowledgeUnit(sectionId: string, knowledgeUnitId: string) {
	const section = await repo.findSection(sectionId);
	if (!section) throw new AppError('Không tìm thấy Section', 404);
	const result = await repo.detachKnowledge(sectionId, knowledgeUnitId);
	await prisma.myClassTest.updateMany({
		where: {
			status: 'PUBLISHED',
			placements: { some: { courseId: section.lesson.courseId } },
			questions: { some: { question: { knowledgeUnits: { some: { knowledgeUnitId } } } } },
		},
		data: { status: 'DRAFT', publishedAt: null },
	});
	return result;
}

export async function reorderSectionKnowledge(sectionId: string, knowledgeUnitIds: string[]) {
	const section = await repo.findSection(sectionId);
	if (!section) throw new AppError('Không tìm thấy Section', 404);
	const mappings = await prisma.myClassSectionKnowledgeUnit.findMany({
		where: { sectionId },
		select: { knowledgeUnitId: true },
	});
	const expected = mappings.map((item) => item.knowledgeUnitId);
	if (
		knowledgeUnitIds.length !== expected.length ||
		new Set(knowledgeUnitIds).size !== knowledgeUnitIds.length ||
		knowledgeUnitIds.some((id) => !expected.includes(id))
	) {
		throw new AppError('Danh sách Knowledge Unit không khớp Section', 422);
	}
	await repo.reorderSectionKnowledge(sectionId, knowledgeUnitIds);
	return getAdminCourse(section.lesson.courseId);
}

export async function validateAdminCoursePublish(id: string): Promise<PublishIssue[]> {
	const course = await getAdminCourse(id);
	const issues = validateCoursePublish({
		title: course.title,
		lessons: course.lessons.map((lesson) => ({
			id: lesson.id,
			title: lesson.title,
			status: lesson.status,
			sections: lesson.sections.map((section) => ({
				id: section.id,
				title: section.title,
				status: section.status,
				publishedKuCount: section.knowledge.filter(
					(item) =>
						item.knowledgeUnit.status === 'PUBLISHED' &&
						item.knowledgeUnit.currentPublishedRevision,
				).length,
			})),
		})),
	});
	return issues.map((issue) => {
		const nodeType = issue.nodeType ?? 'course';
		const nodeId = issue.nodeId || id;
		const tab =
			nodeType === 'vocab'
				? 'vocabulary'
				: nodeType === 'test'
					? 'practice'
					: nodeType === 'course' && issue.path === 'title'
						? 'settings'
						: 'content';
		const nodeQuery = nodeType === 'course' ? '' : `?node=${nodeType}:${nodeId}`;
		return {
			...issue,
			severity: issue.severity ?? 'error',
			nodeType,
			nodeId,
			href: `/admin/my-class/courses/${id}/${tab}${nodeQuery}`,
		};
	});
}

export async function publishAdminCourse(id: string) {
	const issues = await validateAdminCoursePublish(id);
	if (issues.length) {
		throw new AppError('Course chưa đủ điều kiện publish', 422, 'PUBLISH_BLOCKED');
	}
	return repo.updateCourse(id, { status: 'PUBLISHED', publishedAt: new Date() });
}
