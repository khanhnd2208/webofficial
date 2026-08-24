import type { McqCorrectOption } from './schemas';

export interface McqQuestionInput {
	subjectId: string | null;
	topic: string;
	stem: string;
	optionA: string;
	optionB: string;
	optionC: string;
	optionD: string;
	correctOption: McqCorrectOption;
	difficulty: number;
	aacsb: string;
	learningObjective: string;
	classification: string;
}

export interface McqQuestionDTO extends McqQuestionInput {
	id: string;
	isActive: boolean;
	subjectName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SubjectDTO {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
	updatedAt: string;
}

export interface SubjectWithCounts extends SubjectDTO {
	testCount: number;
	questionCount: number;
}

export interface SpaceTestDTO {
	id: string;
	slug: string;
	title: string;
	description: string;
	subjectId: string;
	subjectName: string;
	topics: string[];
	difficulties: number[];
	classifications: string[];
	questionCount: number;
	displayOrder: number;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
}

export type PersonalProgressStatus = 'not_started' | 'completed';

export interface PersonalCompletion {
	score: number;
	total: number;
	submittedAt: string;
}

/** Learner-owned progress for one published test (submitted sessions only). */
export interface PersonalProgress {
	status: PersonalProgressStatus;
	completedCount: number;
	bestScorePercent: number | null;
	lastCompletedAt: string | null;
	/** Most recent submissions, newest first (max 5). */
	recentCompletions: PersonalCompletion[];
}

export interface ProgressActor {
	userId?: string | null;
	guestId?: string | null;
}

export interface PublicSpaceTestListItem {
	slug: string;
	title: string;
	description: string;
	subject: string;
	subjectId: string;
	/** Supporting study metadata, revealed only when a learner asks for details. */
	topics: string[];
	difficulties: number[];
	classifications: string[];
	questionCount: number;
	displayOrder: number;
	personalProgress: PersonalProgress;
}

export interface PublicSubjectGroup {
	subject: string;
	subjectId: string;
	tests: PublicSpaceTestListItem[];
}

export interface SpaceTestWithQuestionCount extends SpaceTestDTO {
	attachedQuestionCount: number;
}

/** Per-test attempt analytics (anonymous sessions). */
export interface SpaceTestAttemptStats {
	spaceTestId: string;
	slug: string;
	title: string;
	status: SpaceTestDTO['status'];
	/** Every play-page load / restart creates a session (noisy). */
	opened: number;
	/** Answered ≥1 question. */
	engaged: number;
	/** Submitted and spent ≥ 5 minutes. */
	completed: number;
	/** Average % from qualifying completions. */
	avgScorePercent: number | null;
	/** Mean duration (ms) of qualifying completions. */
	avgDurationMs: number | null;
	lastCompletedAt: string | null;
}

export interface SpaceTestDailyStat {
	date: string; // YYYY-MM-DD (UTC)
	opened: number;
	engaged: number;
	completed: number;
}

export interface SpaceTestAnalyticsOverview {
	totals: {
		opened: number;
		engaged: number;
		completed: number;
		avgScorePercent: number | null;
	};
	byTest: SpaceTestAttemptStats[];
	daily: SpaceTestDailyStat[];
	recentCompletions: Array<{
		id: string;
		slug: string;
		title: string;
		score: number;
		total: number;
		submittedAt: string;
	}>;
}

export interface PublicQuizQuestion {
	id: string;
	stem: string;
	options: { key: McqCorrectOption; text: string }[];
}

export interface SessionStartResult {
	/** Null until the learner answers the first question. */
	sessionId: string | null;
	title: string;
	subject: string;
	questions: PublicQuizQuestion[];
}

export interface SessionSubmitResult {
	score: number;
	total: number;
	review: Array<{
		questionId: string;
		stem: string;
		chosen: McqCorrectOption;
		correctOption: McqCorrectOption;
		isCorrect: boolean;
		options: { key: McqCorrectOption; text: string }[];
	}>;
}

export interface CheckAnswerResult {
	questionId: string;
	chosen: McqCorrectOption;
	correctOption: McqCorrectOption;
	isCorrect: boolean;
}

export interface QuestionFilterMeta {
	subjects: Array<{ id: string; name: string }>;
	topicsBySubjectId: Record<string, string[]>;
	difficulties: number[];
	classifications: string[];
}

export interface PlayFilterValue {
	value: string;
	count: number;
}

export interface PlayDifficultyValue {
	value: number;
	count: number;
}

export interface TestPlayOptions {
	title: string;
	subject: string;
	defaultQuestionCount: number;
	poolSize: number;
	difficulties: PlayDifficultyValue[];
	learningObjectives: PlayFilterValue[];
}

export interface PlayPoolCountResult {
	count: number;
}
