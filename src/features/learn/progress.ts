import type { LearnCourseOutline, LearnSectionKind, LearnSectionProgressState } from './types';

export type LearnCourseStatus = 'not-started' | 'in-progress' | 'completed';

export function courseStatus(completed: number, total: number): LearnCourseStatus {
	if (total > 0 && completed >= total) return 'completed';
	return completed > 0 ? 'in-progress' : 'not-started';
}

/**
 * Lectures make up the course. Critical questions are an optional advanced layer, so they never
 * count towards completion, the progress bar or "Học tiếp".
 */
export function isRequiredSection(type: LearnSectionKind): boolean {
	return type === 'READING';
}

export function percentOf(completed: number, total: number): number {
	return total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
}

export interface LearnFlatSection {
	id: string;
	title: string;
	type: LearnSectionKind;
	minutes: number;
	lessonId: string;
	lessonTitle: string;
	lessonIndex: number;
	sectionIndex: number;
	completed: boolean;
	note: string;
}

export interface LearnLessonSummary {
	id: string;
	title: string;
	description: string;
	index: number;
	sections: LearnFlatSection[];
	/** Lectures only, like the course totals. */
	completedCount: number;
	requiredCount: number;
	minutes: number;
}

/** Everything the overview and the player derive from an outline plus one learner's progress. */
export interface LearnCourseSummary {
	/** Every section in course order, lectures and critical questions, for prev/next. */
	sections: LearnFlatSection[];
	lessons: LearnLessonSummary[];
	completedCount: number;
	totalCount: number;
	percent: number;
	totalMinutes: number;
	remainingMinutes: number;
	status: LearnCourseStatus;
	/** First lecture not yet completed, in course order; null once every lecture is done. */
	nextSection: LearnFlatSection | null;
}

export function summarizeCourse(
	course: Pick<LearnCourseOutline, 'lessons'>,
	progress: Record<string, LearnSectionProgressState>,
): LearnCourseSummary {
	const lessons: LearnLessonSummary[] = course.lessons.map((lesson, lessonIndex) => {
		const sections = lesson.sections.map((section, sectionIndex) => {
			const state = progress[section.id];
			return {
				...section,
				lessonId: lesson.id,
				lessonTitle: lesson.title,
				lessonIndex,
				sectionIndex,
				completed: Boolean(state?.completed),
				note: state?.note ?? '',
			};
		});
		return {
			id: lesson.id,
			title: lesson.title,
			description: lesson.description,
			index: lessonIndex,
			sections,
			completedCount: sections.filter(
				(section) => isRequiredSection(section.type) && section.completed,
			).length,
			requiredCount: sections.filter((section) => isRequiredSection(section.type)).length,
			minutes: sections.reduce((sum, section) => sum + section.minutes, 0),
		};
	});
	const sections = lessons.flatMap((lesson) => lesson.sections);
	const required = sections.filter((section) => isRequiredSection(section.type));
	const completedCount = required.filter((section) => section.completed).length;

	return {
		sections,
		lessons,
		completedCount,
		totalCount: required.length,
		percent: percentOf(completedCount, required.length),
		totalMinutes: required.reduce((sum, section) => sum + section.minutes, 0),
		remainingMinutes: required
			.filter((section) => !section.completed)
			.reduce((sum, section) => sum + section.minutes, 0),
		status: courseStatus(completedCount, required.length),
		nextSection: required.find((section) => !section.completed) ?? null,
	};
}

/** Curated hues that read well as white-on-colour covers. */
const COVER_HUES = [222, 262, 199, 168, 14, 330, 36, 146, 286, 190];

/** Stable cover hue per course (FNV-1a), so near-identical slugs still get distinct colours. */
export function courseHue(seed: string): number {
	let hash = 0x811c9dc5;
	for (const char of seed) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return COVER_HUES[hash % COVER_HUES.length];
}

/** Outline data the client needs; note bodies stay on the server. */
export type LearnCurriculumLesson = Omit<LearnLessonSummary, 'sections'> & {
	sections: Array<Omit<LearnFlatSection, 'note'> & { hasNote: boolean }>;
};

export function toCurriculumLessons(lessons: LearnLessonSummary[]): LearnCurriculumLesson[] {
	return lessons.map((lesson) => ({
		...lesson,
		sections: lesson.sections.map(({ note, ...section }) => ({
			...section,
			hasNote: Boolean(note.trim()),
		})),
	}));
}
