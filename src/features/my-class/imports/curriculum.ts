import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { hasHtmlContent, normalizeSlug } from '../domain/normalize';
import { sanitizeMyClassHtml } from '../domain/sanitize';
import * as courseRepo from '../repositories/courseRepository';
import * as kuRepo from '../repositories/knowledgeUnitRepository';
import type { CurriculumImportInput } from '../schemas';
import type { CurriculumImportPreview } from '../types';

export function analyzeCurriculum(
	input: CurriculumImportInput,
): Omit<CurriculumImportPreview, 'courseExists'> {
	const errors: string[] = [];
	const lessonSlugs = input.lessons.map((lesson) => lesson.slug);
	if (new Set(lessonSlugs).size !== lessonSlugs.length) {
		errors.push('Lesson slug trùng trong payload');
	}
	const knowledgeUnits: CurriculumImportPreview['knowledgeUnits'] = [];
	const seen = new Map<string, 'create' | 'reuse-payload'>();
	const payloadContent = new Map<string, string>();
	const positions = new Map<string, Set<number>>();
	const related: CurriculumImportPreview['related'] = [];
	for (const lesson of input.lessons) {
		const lessonPositions = positions.get(`lesson:${lesson.slug}`) ?? new Set<number>();
		lessonPositions.add(lesson.position);
		positions.set(`lesson:${lesson.slug}`, lessonPositions);
		const sectionSlugs = new Set<string>();
		for (const section of lesson.sections) {
			if (sectionSlugs.has(section.title))
				errors.push(`Section trùng trong Lesson: ${section.title}`);
			sectionSlugs.add(section.title);
			for (const unit of section.knowledgeUnits) {
				const slug = normalizeSlug(unit.slug, unit.slug);
				if (seen.has(slug)) {
					const signature = JSON.stringify([
						unit.title,
						unit.summary ?? '',
						unit.foundationHtml ?? '',
						unit.academicHtml ?? '',
						unit.expertHtml ?? '',
					]);
					if (payloadContent.get(slug) !== signature)
						errors.push(`KU slug trùng nhưng nội dung khác: ${slug}`);
					knowledgeUnits.push({ slug, action: 'reuse-payload' });
				} else {
					seen.set(slug, 'create');
					payloadContent.set(
						slug,
						JSON.stringify([
							unit.title,
							unit.summary ?? '',
							unit.foundationHtml ?? '',
							unit.academicHtml ?? '',
							unit.expertHtml ?? '',
						]),
					);
					knowledgeUnits.push({ slug, action: 'create' });
				}
				for (const relatedSlug of unit.relatedSlugs ?? []) {
					const to = normalizeSlug(relatedSlug, relatedSlug);
					if (to === slug) errors.push(`KU không thể related với chính nó: ${slug}`);
					related.push({ from: slug, to, resolvable: true });
				}
			}
		}
	}
	return {
		courseSlug: input.course.slug,
		lessons: input.lessons.length,
		sections: input.lessons.reduce((sum, lesson) => sum + lesson.sections.length, 0),
		knowledgeUnits,
		related,
		errors,
	};
}

export async function previewCurriculum(
	input: CurriculumImportInput,
): Promise<CurriculumImportPreview> {
	const analysis = analyzeCurriculum(input);
	const existingCourse = await courseRepo.findCourseBySlug(input.course.slug);
	if (existingCourse) analysis.errors.push(`Course slug đã tồn tại: ${input.course.slug}`);
	const knowledgeUnits = await Promise.all(
		analysis.knowledgeUnits.map(async (item) => {
			if (item.action === 'reuse-payload') return item;
			const existing = await kuRepo.findKnowledgeUnitBySlug(item.slug);
			return existing ? { ...item, action: 'reuse-database' as const } : item;
		}),
	);
	const payloadSlugs = new Set(knowledgeUnits.map((unit) => unit.slug));
	const related = await Promise.all(
		analysis.related.map(async (item) => {
			const fromOk =
				payloadSlugs.has(item.from) || Boolean(await kuRepo.findKnowledgeUnitBySlug(item.from));
			const toOk =
				payloadSlugs.has(item.to) || Boolean(await kuRepo.findKnowledgeUnitBySlug(item.to));
			return { ...item, resolvable: fromOk && toOk };
		}),
	);
	return {
		...analysis,
		courseExists: Boolean(existingCourse),
		knowledgeUnits,
		related,
	};
}

export async function importCurriculum(input: CurriculumImportInput) {
	const preview = await previewCurriculum(input);
	if (preview.errors.length)
		throw new AppError(preview.errors[0]!, preview.courseExists ? 409 : 422);
	return prisma.$transaction(async (tx) => {
		const course = await tx.myClassCourse.create({
			data: {
				slug: input.course.slug,
				title: input.course.title,
				summary: input.course.summary ?? '',
				description: input.course.description ?? '',
				status: 'DRAFT',
			},
		});
		const kuIds = new Map<string, string>();
		for (const item of preview.knowledgeUnits) {
			if (kuIds.has(item.slug)) continue;
			if (item.action === 'reuse-database') {
				const existing = await tx.knowledgeUnit.findUnique({ where: { slug: item.slug } });
				if (existing) kuIds.set(item.slug, existing.id);
				continue;
			}
			const source = input.lessons
				.flatMap((lesson) => lesson.sections.flatMap((section) => section.knowledgeUnits))
				.find((unit) => normalizeSlug(unit.slug, unit.slug) === item.slug);
			if (!source) continue;
			const unit = await tx.knowledgeUnit.create({ data: { slug: item.slug, status: 'DRAFT' } });
			await tx.knowledgeUnitRevision.create({
				data: {
					knowledgeUnitId: unit.id,
					version: 1,
					title: source.title,
					summary: source.summary ?? '',
					foundationHtml: sanitizeMyClassHtml(source.foundationHtml),
					academicHtml: sanitizeMyClassHtml(source.academicHtml),
					expertHtml: sanitizeMyClassHtml(source.expertHtml),
					status: 'DRAFT',
				},
			});
			kuIds.set(item.slug, unit.id);
		}
		for (const rel of preview.related) {
			if (!rel.resolvable) continue;
			if (!kuIds.has(rel.from)) {
				const existing = await tx.knowledgeUnit.findUnique({ where: { slug: rel.from } });
				if (existing) kuIds.set(rel.from, existing.id);
			}
			if (!kuIds.has(rel.to)) {
				const existing = await tx.knowledgeUnit.findUnique({ where: { slug: rel.to } });
				if (existing) kuIds.set(rel.to, existing.id);
			}
			const fromId = kuIds.get(rel.from);
			const toId = kuIds.get(rel.to);
			if (!fromId || !toId || fromId === toId) continue;
			await tx.knowledgeUnitRelation.upsert({
				where: { fromId_toId: { fromId, toId } },
				create: { fromId, toId },
				update: {},
			});
		}
		for (const lessonInput of input.lessons) {
			const lesson = await tx.myClassLesson.create({
				data: {
					courseId: course.id,
					slug: lessonInput.slug,
					title: lessonInput.title,
					summary: lessonInput.summary ?? '',
					position: lessonInput.position,
					status: 'DRAFT',
				},
			});
			for (const sectionInput of lessonInput.sections) {
				const section = await tx.myClassSection.create({
					data: {
						lessonId: lesson.id,
						title: sectionInput.title,
						summary: sectionInput.summary ?? '',
						position: sectionInput.position,
						status: 'DRAFT',
					},
				});
				for (const unitInput of sectionInput.knowledgeUnits) {
					const slug = normalizeSlug(unitInput.slug, unitInput.slug);
					const knowledgeUnitId = kuIds.get(slug);
					if (!knowledgeUnitId) continue;
					await tx.myClassSectionKnowledgeUnit.upsert({
						where: { sectionId_knowledgeUnitId: { sectionId: section.id, knowledgeUnitId } },
						create: { sectionId: section.id, knowledgeUnitId, position: unitInput.position },
						update: { position: unitInput.position },
					});
				}
			}
		}
		return course;
	});
}

export function curriculumHasContent(html?: string) {
	return hasHtmlContent(html);
}

/** Normalize the v2 learner vocabulary (subject → units → modules → items) to the legacy import DTO. */
export function normalizeCurriculumPayload(payload: unknown): unknown {
	if (!payload || typeof payload !== 'object') return payload;
	const value = payload as Record<string, unknown>;
	const subject =
		value.subject && typeof value.subject === 'object'
			? (value.subject as Record<string, unknown>)
			: null;
	if (!subject || !Array.isArray(subject.units)) return payload;
	const units = subject.units as Array<Record<string, unknown>>;
	return {
		course: {
			title: subject.title,
			slug: subject.slug,
			summary: subject.summary,
			description: subject.description,
		},
		lessons: units.map((unit, unitPosition) => ({
			slug: unit.slug,
			title: unit.title,
			summary: unit.summary,
			position: typeof unit.position === 'number' ? unit.position : unitPosition,
			sections: (Array.isArray(unit.modules)
				? (unit.modules as Array<Record<string, unknown>>)
				: []
			).map((module, modulePosition) => ({
				title: module.title,
				summary: module.summary,
				position: typeof module.position === 'number' ? module.position : modulePosition,
				knowledgeUnits: (Array.isArray(module.items)
					? (module.items as Array<Record<string, unknown>>)
					: []
				).map((item, itemPosition) => ({
					slug: item.slug,
					title: item.title,
					summary: item.summary,
					foundationHtml: item.shortHtml ?? item.foundationHtml,
					academicHtml: item.academicHtml ?? '',
					expertHtml: item.deepHtml ?? item.expertHtml,
					position: typeof item.position === 'number' ? item.position : itemPosition,
					relatedSlugs: item.relatedSlugs,
				})),
			})),
		})),
	};
}
