import { routes } from '@/config/routes';

import { courseWorkspacePath } from '../domain/workspaceUrl';
import { htmlLevels } from '../domain/normalize';
import { combinedPublishStatus } from '../domain/outlineTests';
import { availableReadingLevels } from '../domain/readingLevel';
import { sanitizeMyClassHtml } from '../domain/sanitize';
import { parseQuestionOptions } from '../domain/options';
import type {
	MyClassAuthoringMeta,
	MyClassCourseCard,
	MyClassCourseDetail,
	MyClassKnowledgeUnit,
	MyClassLesson,
	MyClassOutlineUnit,
	MyClassPublishStatus,
	MyClassSection,
	MyClassTestListItem,
	MyClassVocabSetCard,
} from '../types';

function iso(value: Date | string) {
	return value instanceof Date ? value.toISOString() : String(value);
}

type PublishedRevision = {
	title: string;
	summary: string;
	foundationHtml?: string;
	academicHtml?: string;
	expertHtml?: string;
	estimatedMinutes?: number | null;
};

function revisionHtml(revision: PublishedRevision) {
	return {
		foundationHtml: revision.foundationHtml ?? '',
		academicHtml: revision.academicHtml ?? '',
		expertHtml: revision.expertHtml ?? '',
	};
}

type MappedUnit = {
	id: string;
	slug: string;
	status: string;
	updatedAt?: Date | string;
	currentPublishedRevision: PublishedRevision | null;
	revisions?: Array<PublishedRevision & { status?: string }>;
};

function authoringMeta(
	status: string,
	updatedAt: Date | string | undefined,
	hasDraft?: boolean,
): MyClassAuthoringMeta {
	return {
		status: (status as MyClassPublishStatus) || 'DRAFT',
		updatedAt: updatedAt ? iso(updatedAt) : new Date(0).toISOString(),
		hasDraft,
	};
}

function pickAuthoringRevision(
	unit: MappedUnit,
): (PublishedRevision & { status?: string }) | null {
	const latest = unit.revisions?.[0];
	if (latest) return latest;
	return unit.currentPublishedRevision;
}

export function mapAuthoringUnit(unit: MappedUnit): MyClassKnowledgeUnit {
	const revision = pickAuthoringRevision(unit);
	const html = revision ?? { title: unit.slug, summary: '', foundationHtml: '', academicHtml: '', expertHtml: '' };
	const body = revisionHtml(html);
	const hasDraft =
		unit.revisions?.[0]?.status === 'DRAFT' ||
		(!unit.currentPublishedRevision && Boolean(unit.revisions?.[0]));
	return {
		id: unit.id,
		slug: unit.slug,
		title: html.title || unit.slug,
		summary: html.summary,
		foundationHtml: sanitizeMyClassHtml(body.foundationHtml),
		academicHtml: sanitizeMyClassHtml(body.academicHtml),
		expertHtml: sanitizeMyClassHtml(body.expertHtml),
		levels: htmlLevels(body),
		availableLevels: availableReadingLevels(body),
		estimatedMinutes: html.estimatedMinutes ?? null,
		authoring: authoringMeta(unit.status, unit.updatedAt, hasDraft),
	};
}

export function mapAuthoringOutlineUnit(unit: MappedUnit, position: number): MyClassOutlineUnit {
	const published = mapAuthoringUnit(unit);
	return {
		id: published.id,
		slug: published.slug,
		title: published.title,
		summary: published.summary,
		position,
		availableLevels: published.availableLevels,
		estimatedMinutes: published.estimatedMinutes,
		authoring: published.authoring,
	};
}

type AuthoringSectionInput = {
	id: string;
	slug?: string;
	title: string;
	summary: string;
	position: number;
	status: string;
	updatedAt: Date | string;
	knowledge: Array<{ position: number; knowledgeUnit: MappedUnit }>;
	placements?: PlacementInput[];
};

export function mapAuthoringSection(section: AuthoringSectionInput): MyClassSection {
	return {
		id: section.id,
		slug: section.slug || `phan-${section.position + 1}`,
		title: section.title,
		summary: section.summary,
		position: section.position,
		knowledgeUnits: section.knowledge
			.filter((item) => item.knowledgeUnit.status !== 'ARCHIVED')
			.map((item) => mapAuthoringOutlineUnit(item.knowledgeUnit, item.position)),
		tests: livePlacements(section.placements ?? []).map(mapAuthoringTestListItem),
		authoring: authoringMeta(section.status, section.updatedAt),
	};
}

type AuthoringLessonInput = {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	status: string;
	updatedAt: Date | string;
	estimatedMinutes?: number | null;
	sections: AuthoringSectionInput[];
	placements?: PlacementInput[];
};

export function mapAuthoringLesson(lesson: AuthoringLessonInput): MyClassLesson {
	const sections = lesson.sections
		.filter((section) => section.status !== 'ARCHIVED')
		.map(mapAuthoringSection);
	const autoMinutes = sections.reduce(
		(sum, section) =>
			sum +
			section.knowledgeUnits.reduce((inner, unit) => inner + (unit.estimatedMinutes ?? 3), 0),
		0,
	);
	return {
		id: lesson.id,
		slug: lesson.slug,
		title: lesson.title,
		summary: lesson.summary,
		position: lesson.position,
		estimatedMinutes: lesson.estimatedMinutes ?? autoMinutes,
		sections,
		tests: livePlacements(lesson.placements ?? []).map(mapAuthoringTestListItem),
		authoring: authoringMeta(lesson.status, lesson.updatedAt),
	};
}

export function mapAuthoringCourse(course: {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	level?: MyClassCourseCard['level'];
	tags?: string[];
	status: string;
	updatedAt: Date | string;
	lessons: AuthoringLessonInput[];
	placements?: PlacementInput[];
}): MyClassCourseDetail {
	const lessons = course.lessons
		.filter((lesson) => lesson.status !== 'ARCHIVED')
		.map(mapAuthoringLesson);
	const unitCount = lessons.reduce(
		(sum, lesson) => sum + lesson.sections.reduce((s, section) => s + section.knowledgeUnits.length, 0),
		0,
	);
	const estimatedMinutes = lessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes ?? 0), 0);
	return {
		id: course.id,
		slug: course.slug,
		title: course.title,
		summary: course.summary,
		description: course.description,
		thumbnailUrl: course.thumbnailUrl,
		level: course.level ?? null,
		tags: course.tags ?? [],
		lessonCount: lessons.length,
		unitCount,
		estimatedMinutes,
		lessons,
		tests: livePlacements(course.placements ?? []).map(mapAuthoringTestListItem),
		vocabSets: [],
		authoring: authoringMeta(course.status, course.updatedAt),
	};
}

export function mapPublishedUnit(unit: MappedUnit): MyClassKnowledgeUnit | null {
	const revision = unit.currentPublishedRevision;
	if (!revision || unit.status !== 'PUBLISHED') return null;
	const body = revisionHtml(revision);
	return {
		id: unit.id,
		slug: unit.slug,
		title: revision.title,
		summary: revision.summary,
		foundationHtml: sanitizeMyClassHtml(body.foundationHtml),
		academicHtml: sanitizeMyClassHtml(body.academicHtml),
		expertHtml: sanitizeMyClassHtml(body.expertHtml),
		levels: htmlLevels(body),
		availableLevels:
			revision.foundationHtml === undefined &&
			revision.academicHtml === undefined &&
			revision.expertHtml === undefined
				? (['readable', 'academic', 'deep'] as const).slice()
				: availableReadingLevels(body),
		estimatedMinutes: revision.estimatedMinutes ?? null,
	};
}

export function mapOutlineUnit(unit: MappedUnit, position: number): MyClassOutlineUnit | null {
	const published = mapPublishedUnit(unit);
	if (!published) return null;
	return {
		id: published.id,
		slug: published.slug,
		title: published.title,
		summary: published.summary,
		position,
		availableLevels: published.availableLevels,
		estimatedMinutes: published.estimatedMinutes,
	};
}

type PlacementInput = {
	id: string;
	scope: MyClassTestListItem['scope'];
	position: number;
	status?: string;
	updatedAt?: Date | string;
	test: {
		id?: string;
		slug: string;
		title: string;
		description: string;
		passScore?: number | null;
		status?: string;
		updatedAt?: Date | string;
		_count: { questions: number };
	};
};

export function mapTestListItem(placement: PlacementInput): MyClassTestListItem {
	return {
		id: placement.test.id,
		slug: placement.test.slug,
		title: placement.test.title,
		description: placement.test.description,
		questionCount: placement.test._count.questions,
		scope: placement.scope,
		passScore: placement.test.passScore ?? null,
		placementId: placement.id,
		position: placement.position,
	};
}

export function mapAuthoringTestListItem(placement: PlacementInput): MyClassTestListItem {
	const status = combinedPublishStatus(placement.test.status, placement.status);
	return {
		...mapTestListItem(placement),
		authoring: authoringMeta(
			status,
			placement.test.updatedAt ?? placement.updatedAt,
			status !== 'PUBLISHED',
		),
	};
}

function livePlacements(rows: PlacementInput[]) {
	return rows.filter((row) => row.status !== 'ARCHIVED' && row.test.status !== 'ARCHIVED');
}

export function mapPublicSection(section: {
	id: string;
	slug?: string;
	title: string;
	summary: string;
	position: number;
	knowledge: Array<{ position: number; knowledgeUnit: MappedUnit }>;
	placements?: PlacementInput[];
}): MyClassSection | null {
	const knowledgeUnits = section.knowledge
		.map((item) => mapOutlineUnit(item.knowledgeUnit, item.position))
		.filter((item): item is MyClassOutlineUnit => Boolean(item));
	const tests = (section.placements ?? []).map(mapTestListItem);
	if (knowledgeUnits.length === 0 && tests.length === 0) return null;
	return {
		id: section.id,
		slug: section.slug || `phan-${section.position + 1}`,
		title: section.title,
		summary: section.summary,
		position: section.position,
		knowledgeUnits,
		tests,
	};
}

export function mapPublicLesson(lesson: {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	estimatedMinutes?: number | null;
	sections: Array<Parameters<typeof mapPublicSection>[0]>;
	placements?: PlacementInput[];
}): MyClassLesson | null {
	const sections = lesson.sections.map(mapPublicSection).filter((item): item is MyClassSection => Boolean(item));
	const tests = (lesson.placements ?? []).map(mapTestListItem);
	if (sections.length === 0 && tests.length === 0) return null;
	const autoMinutes = sections.reduce(
		(sum, section) =>
			sum +
			section.knowledgeUnits.reduce((inner, unit) => inner + (unit.estimatedMinutes ?? 3), 0),
		0,
	);
	return {
		id: lesson.id,
		slug: lesson.slug,
		title: lesson.title,
		summary: lesson.summary,
		position: lesson.position,
		estimatedMinutes: lesson.estimatedMinutes ?? autoMinutes,
		sections,
		tests,
	};
}

export function mapPublicCourse(course: {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	level?: MyClassCourseCard['level'];
	tags?: string[];
	lessons: Array<Parameters<typeof mapPublicLesson>[0]>;
	placements?: PlacementInput[];
}): MyClassCourseDetail {
	const lessons = course.lessons.map(mapPublicLesson).filter((item): item is MyClassLesson => Boolean(item));
	const unitCount = lessons.reduce(
		(sum, lesson) => sum + lesson.sections.reduce((s, section) => s + section.knowledgeUnits.length, 0),
		0,
	);
	const estimatedMinutes = lessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes ?? 0), 0);
	return {
		id: course.id,
		slug: course.slug,
		title: course.title,
		summary: course.summary,
		description: course.description,
		thumbnailUrl: course.thumbnailUrl,
		level: course.level ?? null,
		tags: course.tags ?? [],
		lessonCount: lessons.length,
		unitCount,
		estimatedMinutes,
		lessons,
		tests: (course.placements ?? []).map(mapTestListItem),
		vocabSets: [],
	};
}

export function mapVocabAssignment(row: {
	id: string;
	position: number;
	lessonId: string | null;
	vocabSet: { id: string; title: string; isArchived: boolean; words: Array<{ hintsHard: string[]; hintsMedium: string[]; hintsEasy: string[] }>; _count?: { words: number } };
	lesson: { id: string; slug: string; title: string } | null;
}): MyClassVocabSetCard {
	const wordCount = row.vocabSet._count?.words ?? row.vocabSet.words.length;
	const guessWhoReady = row.vocabSet.words.some(
		(word) => word.hintsHard.length + word.hintsMedium.length + word.hintsEasy.length > 0,
	);
	return {
		assignmentId: row.id,
		vocabSetId: row.vocabSet.id,
		title: row.vocabSet.title,
		wordCount,
		position: row.position,
		scope: row.lessonId ? 'lesson' : 'course',
		lessonId: row.lesson?.id ?? null,
		lessonSlug: row.lesson?.slug ?? null,
		lessonTitle: row.lesson?.title ?? null,
		isArchived: row.vocabSet.isArchived,
		guessWhoReady,
	};
}

export function flattenCurriculum(course: MyClassCourseDetail): Array<{
	id: string;
	slug: string;
	title: string;
	lessonId: string;
	lessonSlug: string;
	lessonTitle: string;
	sectionId: string;
	sectionSlug: string;
	sectionTitle: string;
}> {
	const items: Array<{
		id: string;
		slug: string;
		title: string;
		lessonId: string;
		lessonSlug: string;
		lessonTitle: string;
		sectionId: string;
		sectionSlug: string;
		sectionTitle: string;
	}> = [];
	for (const lesson of course.lessons) {
		for (const section of lesson.sections) {
			for (const unit of section.knowledgeUnits) {
				items.push({
					id: unit.id,
					slug: unit.slug,
					title: unit.title,
					lessonId: lesson.id,
					lessonSlug: lesson.slug,
					lessonTitle: lesson.title,
					sectionId: section.id,
					sectionSlug: section.slug,
					sectionTitle: section.title,
				});
			}
		}
	}
	return items;
}

export function testReturnTo(
	courseSlug: string,
	test: {
		scope: 'COURSE' | 'LESSON' | 'SECTION';
		lesson?: { slug: string; title: string } | null;
		section?: { slug?: string; title: string } | null;
	},
): { href: string; label: string } {
	if (test.scope === 'SECTION' && test.lesson) {
		return {
			href: courseWorkspacePath(courseSlug, {
				lesson: test.lesson.slug,
				s: test.section?.slug ?? null,
			}),
			label: test.section?.title ?? test.lesson.title,
		};
	}
	if (test.scope === 'LESSON' && test.lesson) {
		return {
			href: courseWorkspacePath(courseSlug, { lesson: test.lesson.slug }),
			label: test.lesson.title,
		};
	}
	return { href: routes.myClassCourse(courseSlug), label: 'Khóa học' };
}

export function parsePublicOptions(value: unknown) {
	return parseQuestionOptions(value).map(({ key, text }) => ({ key, text }));
}
