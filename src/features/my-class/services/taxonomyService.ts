import { AppError } from '@/lib/appError';

import { normalizeSlug } from '../domain/normalize';
import { withUniqueConflict } from '../domain/prismaErrors';
import { joinTopicPath, topicDepthFromPath, topicSlugFromName } from '../domain/topicPath';
import * as repo from '../repositories/taxonomyRepository';
import type {
	CreateSubjectInput,
	CreateTopicInput,
	UpdateSubjectInput,
	UpdateTopicInput,
} from '../schemas';

export async function listAdminSubjects() {
	return repo.listSubjects();
}

export async function getAdminSubject(id: string) {
	const subject = await repo.findSubject(id);
	if (!subject) throw new AppError('Không tìm thấy môn', 404);
	return subject;
}

export async function createSubject(input: CreateSubjectInput) {
	const slug = normalizeSlug(input.slug ?? input.name, 'subject');
	if (await repo.findSubjectBySlug(slug)) {
		throw new AppError(`Subject slug đã tồn tại: ${slug}`, 409, 'CONFLICT');
	}
	return withUniqueConflict(`Subject slug đã tồn tại: ${slug}`, () =>
		repo.createSubject({
			slug,
			name: input.name.trim(),
			summary: input.summary ?? '',
			position: input.position,
			status: input.status,
		}),
	);
}

export async function updateSubject(id: string, input: UpdateSubjectInput) {
	await getAdminSubject(id);
	return withUniqueConflict('Subject slug đã tồn tại', () =>
		repo.updateSubject(id, {
			name: input.name?.trim(),
			slug: input.slug ? normalizeSlug(input.slug) : undefined,
			summary: input.summary,
			position: input.position,
			status: input.status,
		}),
	);
}

export async function listAdminTopics(subjectId?: string) {
	return repo.listTopics(subjectId);
}

export async function getAdminTopic(id: string) {
	const topic = await repo.findTopic(id);
	if (!topic) throw new AppError('Không tìm thấy chủ đề', 404);
	return topic;
}

export async function createTopic(input: CreateTopicInput) {
	const parent = input.parentId ? await getAdminTopic(input.parentId) : null;
	if (parent && parent.subjectId !== input.subjectId) {
		throw new AppError('Chủ đề cha không thuộc môn này', 422);
	}
	const slug = input.slug ? normalizeSlug(input.slug) : topicSlugFromName(input.name);
	const path = joinTopicPath(parent?.path, slug);
	return withUniqueConflict('Topic path đã tồn tại', () =>
		repo.createTopic({
			subjectId: input.subjectId,
			parentId: input.parentId ?? null,
			slug,
			name: input.name.trim(),
			path,
			depth: topicDepthFromPath(path),
			position: input.position,
			status: input.status,
			knowledgeUnitIds: input.knowledgeUnitIds,
		}),
	);
}

export async function updateTopic(id: string, input: UpdateTopicInput) {
	const existing = await getAdminTopic(id);
	const parentId = input.parentId === undefined ? existing.parentId : input.parentId;
	if (parentId === id) throw new AppError('Chủ đề không thể là cha của chính nó', 422);
	const parent = parentId ? await getAdminTopic(parentId) : null;
	const subjectId = input.subjectId ?? existing.subjectId;
	if (parent && parent.subjectId !== subjectId) {
		throw new AppError('Chủ đề cha không thuộc môn này', 422);
	}
	const slug = input.slug ? normalizeSlug(input.slug) : existing.slug;
	const path = joinTopicPath(parent?.path, slug);
	if (path !== existing.path) {
		await repo.rewriteTopicSubtree(existing.path, path, existing.subjectId);
	}
	return withUniqueConflict('Topic path đã tồn tại', () =>
		repo.updateTopic(id, {
			name: input.name?.trim(),
			slug,
			parentId,
			subjectId,
			position: input.position,
			status: input.status,
			knowledgeUnitIds: input.knowledgeUnitIds,
			path,
			depth: topicDepthFromPath(path),
		}),
	);
}

export async function suggestTaxonomyFromKnowledgeUnits(knowledgeUnitIds: string[]) {
	const topics = await repo.topicsForKnowledgeUnits(knowledgeUnitIds);
	return topics.map((topic) => ({
		topicId: topic.id,
		topicName: topic.name,
		path: topic.path,
		subjectId: topic.subjectId,
		subjectName: topic.subject.name,
	}));
}
