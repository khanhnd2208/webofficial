import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { nextUnfinishedAfter, resolveLearnerState, seedsFromCourseOutline } from '../domain/learnerState';
import type { MyClassActor } from '../domain/actor';
import * as courseRepo from '../repositories/courseRepository';
import * as progressRepo from '../repositories/progressRepository';
import * as vocabRepo from '../repositories/vocabAssignmentRepository';
import type { MyClassCourseDetail, MyClassKnowledgeUnitDetail } from '../types';
import { flattenCurriculum, mapAuthoringCourse, mapAuthoringUnit, mapVocabAssignment } from './mappers';

function assertAdmin(role: string | null | undefined) {
	if (role !== 'admin') throw new AppError('Forbidden', 403);
}

export async function getAuthoringCourse(
	slug: string,
	actorRole: string | null | undefined,
): Promise<MyClassCourseDetail> {
	assertAdmin(actorRole);
	const course = await courseRepo.findAuthoringCourse(slug);
	if (!course) throw new AppError('Không tìm thấy lớp học', 404);
	const mapped = mapAuthoringCourse(course);
	const assignments = await vocabRepo.listAssignments(course.id);
	mapped.vocabSets = assignments.map(mapVocabAssignment);
	return mapped;
}

export async function loadCourseAuthoringState(
	courseSlug: string,
	actor: MyClassActor | null,
	actorRole: string | null | undefined,
	openedUnitId?: string | null,
) {
	const course = await getAuthoringCourse(courseSlug, actorRole);
	const seeds = seedsFromCourseOutline(course);
	const completedUnitIds = actor ? await progressRepo.listCompletedUnitIds(actor, course.id) : [];
	const lastViewedUnitId = actor
		? await progressRepo.findLatestViewedUnitId(actor, course.id)
		: null;
	const activityResume =
		lastViewedUnitId && completedUnitIds.includes(lastViewedUnitId)
			? (nextUnfinishedAfter(lastViewedUnitId, seeds, completedUnitIds)?.knowledgeUnitId ?? null)
			: lastViewedUnitId;
	return {
		course,
		learnerState: resolveLearnerState({
			seeds,
			completedUnitIds,
			openedUnitId: openedUnitId ?? activityResume,
		}),
	};
}

export async function getAuthoringKnowledgeUnit(
	courseSlug: string,
	kuSlug: string,
	actorRole: string | null | undefined,
	requestedContext?: { lessonSlug?: string; sectionId?: string },
): Promise<MyClassKnowledgeUnitDetail> {
	assertAdmin(actorRole);
	const course = await courseRepo.findAuthoringCourse(courseSlug);
	if (!course) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const mapped = mapAuthoringCourse(course);
	const flow = flattenCurriculum(mapped);
	const index = flow.findIndex(
		(item) =>
			item.slug === kuSlug &&
			(!requestedContext?.lessonSlug || item.lessonSlug === requestedContext.lessonSlug) &&
			(!requestedContext?.sectionId || item.sectionId === requestedContext.sectionId),
	);
	if (index < 0) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const context = flow[index]!;
	const unitRow = course.lessons
		.flatMap((lesson) => lesson.sections.flatMap((section) => section.knowledge))
		.find((item) => item.knowledgeUnit.id === context.id);
	if (!unitRow) throw new AppError('Không tìm thấy Knowledge Unit', 404);
	const unit = mapAuthoringUnit(unitRow.knowledgeUnit);

	const relatedIds = await prisma.knowledgeUnitRelation.findMany({
		where: { fromId: unit.id },
		select: { toId: true },
	});
	const inCourse = new Set(flow.map((item) => item.slug));
	const relatedUnits = await prisma.knowledgeUnit.findMany({
		where: { id: { in: relatedIds.map((item) => item.toId) } },
		include: {
			currentPublishedRevision: true,
			revisions: { orderBy: { version: 'desc' }, take: 1 },
		},
	});
	const related = relatedUnits
		.map((item) => mapAuthoringUnit(item))
		.filter((item) => inCourse.has(item.slug))
		.map((item) => ({ slug: item.slug, title: item.title }));

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
