export type MyClassCourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type MyClassLevel = 'FOUNDATION' | 'ACADEMIC' | 'EXPERT';
export type MyClassPublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MyClassRevisionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MyClassQuestionStatus = 'ACTIVE' | 'ARCHIVED';
export type MyClassQuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'FILL_BLANK';
export type MyClassTestScope = 'COURSE' | 'LESSON' | 'SECTION';
export type MyClassTestRevealPolicy = 'AFTER_SUBMIT' | 'IMMEDIATE' | 'NEVER';
export type MyClassScoringMode = 'ALL_OR_NOTHING' | 'PARTIAL';
export type MyClassMembershipStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';
export type QuestionOptionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ReadingLevel = 'readable' | 'academic' | 'deep';
export type MyClassWorkspaceView = 'content' | 'vocab';
export type ExplanationMode = 'short' | 'deep';

export interface KnowledgeItemSummary {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	completed: boolean;
	availableModes: ExplanationMode[];
}

export interface LearningModule {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	sourceChapter: { id: string; slug: string; title: string; position: number };
	progressPercent: number;
	completedItems: number;
	totalItems: number;
	items: KnowledgeItemSummary[];
	tests: MyClassTestListItem[];
}

export interface LearningUnitSummary {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	progressPercent: number;
	completedItems: number;
	totalItems: number;
	modules: LearningModule[];
}

export interface LearningSubjectSummary {
	id: string;
	slug: string;
	title: string;
	summary: string;
	progressPercent: number;
	completedItems: number;
	totalItems: number;
	/** Flat learner-facing module list, ordered by chapter then module position. */
	modules: LearningModule[];
	/** Large lessons/topics remain visible as the grouping level above modules. */
	lessons: LearningUnitSummary[];
	/** @deprecated Alias retained for older clients during the transition. */
	units?: LearningUnitSummary[];
}

export type PublishBlocker = {
	code: string;
	severity: 'error' | 'warning';
	nodeType: 'course' | 'lesson' | 'section' | 'unit' | 'vocab' | 'test';
	nodeId: string;
	message: string;
	href: string;
	path?: string;
};

export interface QuestionOption {
	key: QuestionOptionKey;
	text: string;
	feedback?: string;
}

export interface FillBlankSpec {
	id: string;
	length: number;
	accepted: string[];
	caseSensitive: boolean;
	ignoreDiacritics: boolean;
	hint?: string;
}

export type AnswerSpec =
	| { type: 'MCQ_SINGLE'; correctKey: QuestionOptionKey }
	| { type: 'MCQ_MULTI'; correctKeys: QuestionOptionKey[]; scoring: MyClassScoringMode }
	| { type: 'FILL_BLANK'; scoring: MyClassScoringMode; blanks: FillBlankSpec[] };

export type LearnerResponse =
	| { type: 'MCQ_SINGLE'; key: QuestionOptionKey }
	| { type: 'MCQ_MULTI'; keys: QuestionOptionKey[] }
	| { type: 'FILL_BLANK'; blanks: Record<string, string> };

export interface FillBlankPlay {
	id: string;
	length: number;
	hint?: string;
}

export interface PublishIssue {
	code: string;
	message: string;
	path: string;
	href?: string;
	severity?: 'error' | 'warning';
	nodeType?: PublishBlocker['nodeType'];
	nodeId?: string;
}

export interface MyClassCourseCard {
	id: string;
	slug: string;
	title: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	level: MyClassCourseLevel | null;
	tags: string[];
	subjectId?: string | null;
	lessonCount?: number;
	unitCount?: number;
	estimatedMinutes?: number;
	firstUnitHref?: string;
}

export type MyClassAuthoringMeta = {
	status: MyClassPublishStatus;
	updatedAt: string;
	hasDraft?: boolean;
};

export interface MyClassOutlineUnit {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	availableLevels: ReadingLevel[];
	estimatedMinutes?: number | null;
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassKnowledgeUnit {
	id: string;
	slug: string;
	title: string;
	summary: string;
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
	shortHtml?: string;
	deepHtml?: string;
	availableModes?: ExplanationMode[];
	levels: MyClassLevel[];
	availableLevels: ReadingLevel[];
	estimatedMinutes?: number | null;
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassVocabSetCard {
	assignmentId: string;
	vocabSetId: string;
	title: string;
	wordCount: number;
	position: number;
	scope: 'course' | 'lesson';
	lessonId: string | null;
	lessonSlug: string | null;
	lessonTitle: string | null;
	isArchived: boolean;
	guessWhoReady: boolean;
}

export interface MyClassTestListItem {
	id?: string;
	slug: string;
	title: string;
	description: string;
	questionCount: number;
	scope: MyClassTestScope;
	passScore?: number | null;
	placementId?: string;
	position?: number;
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassSection {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	knowledgeUnits: MyClassOutlineUnit[];
	tests: MyClassTestListItem[];
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassLesson {
	id: string;
	slug: string;
	title: string;
	summary: string;
	position: number;
	estimatedMinutes?: number | null;
	sections: MyClassSection[];
	tests: MyClassTestListItem[];
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassCourseDetail extends MyClassCourseCard {
	lessons: MyClassLesson[];
	tests: MyClassTestListItem[];
	vocabSets: MyClassVocabSetCard[];
	authoring?: MyClassAuthoringMeta;
}

export interface MyClassLessonDetail {
	course: { slug: string; title: string };
	lesson: MyClassLesson;
}

export interface MyClassKnowledgeUnitDetail {
	course: { id: string; slug: string; title: string };
	context: {
		lessonId: string;
		lessonSlug: string;
		lessonTitle: string;
		sectionId: string;
		sectionSlug: string;
		sectionTitle: string;
	};
	unit: MyClassKnowledgeUnit;
	previous: {
		slug: string;
		title: string;
		lessonSlug: string;
		sectionId: string;
		sectionSlug?: string;
		knowledgeUnitId: string;
	} | null;
	next: {
		slug: string;
		title: string;
		lessonSlug: string;
		sectionId: string;
		sectionSlug?: string;
		knowledgeUnitId: string;
	} | null;
	related: Array<{ slug: string; title: string; href?: string }>;
}

export interface MyClassProgressCourseSummary {
	courseId: string;
	courseSlug: string;
	courseTitle?: string;
	thumbnailUrl?: string | null;
	level?: MyClassCourseLevel | null;
	tags?: string[];
	lessonCount?: number;
	unitCount?: number;
	estimatedMinutes?: number | null;
	resumeEstimatedMinutes?: number | null;
	totalItems: number;
	completedItems: number;
	percent: number;
	currentItem: OutlineItemLinkShape | null;
	nextItem: OutlineItemLinkShape | null;
	resumeItem: OutlineItemLinkShape | null;
	afterResumeItem: OutlineItemLinkShape | null;
	isComplete: boolean;
}

type OutlineItemLinkShape = {
	href: string;
	courseSlug: string;
	lessonSlug: string;
	sectionId: string;
	sectionSlug?: string;
	kuSlug: string;
	knowledgeUnitId: string;
	title: string;
};

export interface MyClassProgressResponse {
	actor: { type: 'user' | 'guest' };
	courses: MyClassProgressCourseSummary[];
}

export interface MyClassQuestionForPlay {
	id: string;
	type: MyClassQuestionType;
	stem: string;
	options: QuestionOption[];
	blanks?: FillBlankPlay[];
	position: number;
	points?: number;
}

export interface MyClassTestForPlay extends MyClassTestListItem {
	courseSlug: string;
	returnTo: { href: string; label: string };
	questions: MyClassQuestionForPlay[];
	passScore?: number | null;
	timeLimitMinutes?: number | null;
	maxAttempts?: number | null;
	attemptsUsed?: number;
	shuffleQuestions?: boolean;
	shuffleOptions?: boolean;
	revealPolicy?: MyClassTestRevealPolicy;
}

export interface MyClassQuestionCheck {
	questionId: string;
	isCorrect: boolean;
	explanation: string;
	chosenLabel: string;
	correctLabel: string;
}

export interface MyClassTestResult {
	attemptId: string | null;
	saved: boolean;
	score: number;
	total: number;
	earnedPoints?: number;
	totalPoints?: number;
	review: Array<{
		questionId: string;
		type: MyClassQuestionType;
		stem: string;
		options: QuestionOption[];
		blanks?: FillBlankPlay[];
		response: LearnerResponse;
		answer: AnswerSpec;
		chosenKey: string;
		correctKey: string;
		explanation: string;
		earned: number;
		max: number;
		isCorrect: boolean;
	}>;
	kuBreakdown: Array<{
		slug: string;
		title: string;
		questions: number;
		correct: number;
		accuracy: number;
		evidenceLabel: string;
	}>;
}

export interface MyClassProgressDashboard {
	knowledge: Array<{
		courseSlug: string;
		courseTitle: string;
		knowledgeUnitSlug: string;
		knowledgeUnitId: string;
		title: string;
		viewedAt: string | null;
		completedAt: string | null;
	}>;
	tests: Array<{
		courseSlug: string;
		testSlug: string;
		title: string;
		attemptCount: number;
		latestScore: number;
		bestScore: number;
		total: number;
		attempts: Array<{ id: string; score: number; total: number; submittedAt: string }>;
		kuAccuracy: Array<{
			slug: string;
			title: string;
			attempts: number;
			questions: number;
			correct: number;
			accuracy: number;
			lastActivityAt: string;
			evidenceLabel: string;
		}>;
	}>;
	streak: number;
	activityDays: string[];
}

export interface AdminOverviewStats {
	courses: { draft: number; published: number; archived: number };
	lessons: number;
	sections: number;
	knowledgeUnits: number;
	knowledgeUnitsMissingPublished: number;
	tests: { draft: number; published: number };
	cohortsActive: number;
	memberships: { pending: number; active: number };
	attemptsLast7Days: number;
	attemptsLast30Days: number;
}

export interface CurriculumImportPreview {
	courseSlug: string;
	courseExists: boolean;
	lessons: number;
	sections: number;
	knowledgeUnits: Array<{ slug: string; action: 'create' | 'reuse-payload' | 'reuse-database' }>;
	related: Array<{ from: string; to: string; resolvable: boolean }>;
	errors: string[];
}

export interface QuestionCsvPreviewRow {
	row: number;
	testSlug: string;
	questionSlug: string;
	ok: boolean;
	errors: string[];
}

export interface TestQuestionCsvPreviewRow {
	row: number;
	stem: string;
	type: string;
	optionCount: number;
	correctKey: string;
	difficulty: number;
	ok: boolean;
	errors: string[];
}

export interface TestQuestionCsvPreview {
	rows: TestQuestionCsvPreviewRow[];
	summary: { total: number; valid: number; invalid: number };
}

export type {
	MyClassLearnerState,
	MyClassOutlineItem,
	OutlineItemLink,
} from '../domain/learnerState';
export type { ReadingLevel as DomainReadingLevel } from '../domain/readingLevel';
export * from './analytics';
export * from './adminTables';
