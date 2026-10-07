import type { PublishStatus } from '@prisma/client';

export type LearnLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
/**
 * A course holds lectures and, optionally, a set of critical questions per lesson. The database
 * enum still lists the retired QUIZ and PRACTICE types; queries filter on these kinds so any
 * leftover rows never reach a page.
 */
export const LEARN_SECTION_KINDS = ['READING', 'DISCUSSION'] as const;
export type LearnSectionKind = (typeof LEARN_SECTION_KINDS)[number];

export const LEARN_SECTION_KIND_LABELS: Record<LearnSectionKind, string> = {
	READING: 'Bài giảng',
	DISCUSSION: 'Câu hỏi phản biện',
};

/** Shorter labels for outlines and import previews. */
export const LEARN_SECTION_KIND_SHORT: Record<LearnSectionKind, string> = {
	READING: 'Bài giảng',
	DISCUSSION: 'Phản biện',
};

export const LEARN_LEVEL_LABELS: Record<LearnLevel, string> = {
	BASIC: 'Cơ bản',
	INTERMEDIATE: 'Trung cấp',
	ADVANCED: 'Nâng cao',
};

export interface LearnCheckpoint {
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

export interface LearnDiscussionQuestion {
	id: string;
	/** Markdown. */
	question: string;
	/** Markdown sample answer. */
	answer: string;
}

export interface LearnDiscussion {
	questions: LearnDiscussionQuestion[];
}

export interface LearnCourseMeta {
	id: string;
	slug: string;
	title: string;
	subtitle: string;
	description: string;
	category: string;
	level: LearnLevel;
	status: PublishStatus;
	updatedAt: string;
}

export interface LearnCourseListItem extends LearnCourseMeta {
	lessonCount: number;
	sectionCount: number;
	totalMinutes: number;
	completedCount: number;
	/** First unfinished section, so "Tiếp tục" lands where the learner left off. */
	nextSectionId: string | null;
	/** Last time this learner touched the course (completion or note). */
	lastActivityAt: string | null;
}

export interface LearnOutlineSection {
	id: string;
	title: string;
	type: LearnSectionKind;
	minutes: number;
}

export interface LearnOutlineLesson {
	id: string;
	title: string;
	description: string;
	sections: LearnOutlineSection[];
}

export interface LearnCourseOutline extends LearnCourseMeta {
	lessons: LearnOutlineLesson[];
}

export interface LearnSectionProgressState {
	completed: boolean;
	note: string;
}

/** Everything the reader needs for one section page. */
export interface LearnReaderSection {
	id: string;
	lessonId: string;
	type: LearnSectionKind;
	title: string;
	minutes: number;
	summary: string;
	keyTakeaways: string[];
	markdown: string;
	discussion: LearnDiscussion | null;
}

/** Full editable section for the studio. */
export interface LearnStudioSection {
	id: string;
	lessonId: string;
	type: LearnSectionKind;
	title: string;
	durationMinutes: number | null;
	summary: string;
	keyTakeaways: string[];
	markdown: string;
	discussion: LearnDiscussion | null;
	estimatedMinutes: number;
	updatedAt: string;
}

/** Autosave acknowledgement. Import and create still receive a full LearnStudioSection. */
export interface LearnSectionWriteResult {
	id: string;
	updatedAt: string;
	estimatedMinutes: number;
}

export interface LearnStudioLesson {
	id: string;
	title: string;
	description: string;
	sections: LearnStudioSection[];
}

export interface LearnStudioCourse extends LearnCourseMeta {
	lessons: LearnStudioLesson[];
}
