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
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
}

export interface PublicSpaceTestListItem {
	slug: string;
	title: string;
	description: string;
	subject: string;
	subjectId: string;
	questionCount: number;
}

export interface PublicSubjectGroup {
	subject: string;
	subjectId: string;
	tests: PublicSpaceTestListItem[];
}

export interface SpaceTestWithQuestionCount extends SpaceTestDTO {
	attachedQuestionCount: number;
}

export interface PublicQuizQuestion {
	id: string;
	stem: string;
	options: { key: McqCorrectOption; text: string }[];
}

export interface SessionStartResult {
	sessionId: string;
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
