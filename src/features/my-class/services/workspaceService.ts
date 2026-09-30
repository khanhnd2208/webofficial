import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import {
	archiveLesson,
	archiveSection,
	getAdminCourse,
	reorderLessons,
	reorderSectionKnowledge,
	reorderSections,
	updateLesson,
	updateSection,
} from './courseService';
import { getAdminKnowledgeUnit, saveDraftRevision } from './knowledgeUnitService';
import type { SaveDraftRevisionInput } from '../schemas';
import { validateCoursePublish } from '../domain/publishValidation';

function assertFresh(updatedAt: Date, expected: string) {
	if (updatedAt.toISOString() !== expected) {
		throw new AppError('Dữ liệu đã được người khác cập nhật', 409, 'CONFLICT');
	}
}

export async function patchCourseNode(
	courseId: string,
	nodeType: string,
	nodeId: string,
	input: { expectedUpdatedAt: string; changes: Record<string, unknown> },
) {
	const course = await getAdminCourse(courseId);
	if (nodeType === 'lesson') {
		const lesson = course.lessons.find((item) => item.id === nodeId);
		if (!lesson) throw new AppError('Node không thuộc Course', 404);
		assertFresh(lesson.updatedAt, input.expectedUpdatedAt);
		return updateLesson(nodeId, {
			title: String(input.changes.title ?? lesson.title),
			slug: typeof input.changes.slug === 'string' ? input.changes.slug : undefined,
			summary: typeof input.changes.summary === 'string' ? input.changes.summary : undefined,
			status: input.changes.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
		});
	}
	if (nodeType === 'section') {
		const section = course.lessons
			.flatMap((lesson) => lesson.sections)
			.find((item) => item.id === nodeId);
		if (!section) throw new AppError('Node không thuộc Course', 404);
		assertFresh(section.updatedAt, input.expectedUpdatedAt);
		return updateSection(nodeId, {
			title: String(input.changes.title ?? section.title),
			summary: typeof input.changes.summary === 'string' ? input.changes.summary : undefined,
			status: input.changes.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
		});
	}
	if (nodeType === 'unit') {
		const mapping = course.lessons
			.flatMap((lesson) => lesson.sections.flatMap((section) => section.knowledge))
			.find((item) => item.knowledgeUnit.id === nodeId);
		if (!mapping) throw new AppError('Node không thuộc Course', 404);
		const unit = await getAdminKnowledgeUnit(nodeId);
		assertFresh(unit.updatedAt, input.expectedUpdatedAt);
		const draft = unit.revisions.find((item) => item.status === 'DRAFT') ?? unit.revisions[0];
		return saveDraftRevision(nodeId, {
			title: String(input.changes.title ?? draft?.title ?? unit.slug),
			summary: typeof input.changes.summary === 'string' ? input.changes.summary : draft?.summary,
			foundationHtml:
				typeof input.changes.foundationHtml === 'string'
					? input.changes.foundationHtml
					: draft?.foundationHtml,
			academicHtml:
				typeof input.changes.academicHtml === 'string'
					? input.changes.academicHtml
					: draft?.academicHtml,
			expertHtml:
				typeof input.changes.expertHtml === 'string' ? input.changes.expertHtml : draft?.expertHtml,
			slug: typeof input.changes.slug === 'string' ? input.changes.slug : undefined,
			expectedUpdatedAt: input.expectedUpdatedAt,
		} as SaveDraftRevisionInput);
	}
	throw new AppError('Loại node không hợp lệ', 400);
}

export async function updateCourseNodeStatus(
	courseId: string,
	nodeType: 'lesson' | 'section',
	nodeId: string,
	input: { expectedUpdatedAt: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' },
) {
	const course = await getAdminCourse(courseId);
	const next = course.lessons.map((lesson) => ({
		id: lesson.id,
		title: lesson.title,
		status: nodeType === 'lesson' && lesson.id === nodeId ? input.status : lesson.status,
		sections: lesson.sections.map((section) => ({
			id: section.id,
			title: section.title,
			status: nodeType === 'section' && section.id === nodeId ? input.status : section.status,
			publishedKuCount: section.knowledge.filter(
				(item) =>
					item.knowledgeUnit.status === 'PUBLISHED' && item.knowledgeUnit.currentPublishedRevision,
			).length,
		})),
	}));
	const target =
		nodeType === 'lesson'
			? course.lessons.find((lesson) => lesson.id === nodeId)
			: course.lessons
					.flatMap((lesson) => lesson.sections)
					.find((section) => section.id === nodeId);
	if (!target) throw new AppError('Node không thuộc Course', 404);
	assertFresh(target.updatedAt, input.expectedUpdatedAt);
	if (course.status === 'PUBLISHED') {
		const issues = validateCoursePublish({ title: course.title, lessons: next });
		if (issues.length) throw new AppError(issues[0]!.message, 422, 'PUBLISH_BLOCKED');
	}
	if (nodeType === 'lesson') {
		return input.status === 'ARCHIVED'
			? archiveLesson(nodeId)
			: updateLesson(nodeId, { title: target.title, status: input.status });
	}
	return input.status === 'ARCHIVED'
		? archiveSection(nodeId)
		: updateSection(nodeId, { title: target.title, status: input.status });
}

function sameIdSet(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		new Set(left).size === left.length &&
		left.every((id) => right.includes(id))
	);
}

function reconcileOrderedIds(
	requested: string[],
	nodes: Array<{ id: string; status: string }>,
	mismatchMessage: string,
) {
	if (
		new Set(requested).size !== requested.length ||
		requested.some((id) => !nodes.some((node) => node.id === id))
	) {
		throw new AppError(mismatchMessage, 422);
	}
	const all = nodes.map((node) => node.id);
	const active = nodes.filter((node) => node.status !== 'ARCHIVED').map((node) => node.id);
	const archived = nodes.filter((node) => node.status === 'ARCHIVED').map((node) => node.id);
	if (sameIdSet(requested, all)) return requested;
	if (sameIdSet(requested, active)) return [...requested, ...archived];
	throw new AppError(mismatchMessage, 422);
}

export async function reorderCourseNodes(
	courseId: string,
	input: {
		parentType: 'course' | 'lesson' | 'section';
		parentId: string;
		orderedNodeIds: string[];
	},
) {
	const course = await getAdminCourse(courseId);
	if (input.parentType === 'course') {
		if (input.parentId !== courseId) throw new AppError('Parent không thuộc Course', 422);
		const orderedNodeIds = reconcileOrderedIds(
			input.orderedNodeIds,
			course.lessons.map((item) => ({ id: item.id, status: item.status })),
			'Danh sách Lesson không khớp Course',
		);
		const next = await reorderLessons(courseId, orderedNodeIds);
		return { tree: next, revision: new Date().toISOString() };
	}
	if (input.parentType === 'lesson') {
		const lesson = course.lessons.find((item) => item.id === input.parentId);
		if (!lesson) throw new AppError('Lesson không thuộc Course', 404);
		const orderedNodeIds = reconcileOrderedIds(
			input.orderedNodeIds,
			lesson.sections.map((item) => ({ id: item.id, status: item.status })),
			'Danh sách Section không khớp Lesson',
		);
		await reorderSections(lesson.id, orderedNodeIds);
		return { tree: await getAdminCourse(courseId), revision: new Date().toISOString() };
	}
	const section = course.lessons
		.flatMap((lesson) => lesson.sections)
		.find((item) => item.id === input.parentId);
	if (!section) throw new AppError('Section không thuộc Course', 404);
	const orderedNodeIds = reconcileOrderedIds(
		input.orderedNodeIds,
		section.knowledge.map((item) => ({
			id: item.knowledgeUnit.id,
			status: item.knowledgeUnit.status,
		})),
		'Danh sách nội dung không khớp Section',
	);
	await reorderSectionKnowledge(section.id, orderedNodeIds);
	return { tree: await getAdminCourse(courseId), revision: new Date().toISOString() };
}

export async function touchCourseRevision(courseId: string) {
	await prisma.myClassCourse.update({ where: { id: courseId }, data: { updatedAt: new Date() } });
}
