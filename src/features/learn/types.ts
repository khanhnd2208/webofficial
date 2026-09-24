import type { PublishStatus } from '@prisma/client';

export type LearnLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
export type LearnSectionKind = 'READING' | 'QUIZ';

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

export interface LearnQuizQuestion {
	id: string;
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

export interface LearnQuiz {
	passingScorePercent: number;
	timeLimitMinutes: number | null;
	questions: LearnQuizQuestion[];
}

/** Quiz as a learner sees it before submitting: no answers, no explanations. */
export interface LearnQuizForLearner {
	passingScorePercent: number;
	timeLimitMinutes: number | null;
	questions: Array<Pick<LearnQuizQuestion, 'id' | 'question' | 'options'>>;
}

export interface LearnQuizResult {
	score: number;
	total: number;
	percentage: number;
	passed: boolean;
	answers: Record<string, number>;
	completedAt: string;
}

/** Result plus the answer key, returned once the learner has submitted. */
export interface LearnQuizReview {
	result: LearnQuizResult;
	key: Array<{ id: string; correctIndex: number; explanation: string }>;
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
	quizCount: number;
	/** First unfinished section, so "Tiếp tục" lands where the learner left off. */
	nextSectionId: string | null;
	/** Last time this learner touched the course (completion, note or quiz). */
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
	quizResult: LearnQuizResult | null;
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
	checkpoint: LearnCheckpoint | null;
	quiz: LearnQuizForLearner | null;
	review: LearnQuizReview | null;
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
	checkpoint: LearnCheckpoint | null;
	quiz: LearnQuiz | null;
	updatedAt: string;
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
