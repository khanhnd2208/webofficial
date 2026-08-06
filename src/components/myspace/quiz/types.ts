import type {
	CheckAnswerResult,
	McqCorrectOption,
	PublicQuizQuestion,
	SessionSubmitResult,
} from '@/features/myspace-tests';

export type QuizPhase = 'playing' | 'checking' | 'submitting' | 'done' | 'error';

export type AnswerOptionState =
	| 'idle'
	| 'selected'
	| 'checking'
	| 'correct'
	| 'wrongPick'
	| 'other';

export type QuestionNavStatus = 'pending' | 'current' | 'correct' | 'wrong' | 'locked';

export type Reveal = CheckAnswerResult;

export type { McqCorrectOption, PublicQuizQuestion, SessionSubmitResult };
