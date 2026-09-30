import type { ListPage } from '../domain/listQuery';
import type {
	MyClassCourseLevel,
	MyClassPublishStatus,
	MyClassQuestionStatus,
	MyClassQuestionType,
} from './index';

export type AdminCourseOption = {
	id: string;
	title: string;
	slug: string;
	status: MyClassPublishStatus;
};

export type AdminCourseTableRow = {
	id: string;
	slug: string;
	title: string;
	status: MyClassPublishStatus;
	level: MyClassCourseLevel | null;
	tags: string[];
	lessonCount: number;
	placementCount: number;
	cohortCount: number;
	memberCount: number;
	updatedAt: string;
	hasUnpublishedDraft: boolean;
};

export type AdminCohortTableRow = {
	id: string;
	name: string;
	term: string;
	status: MyClassPublishStatus;
	courseId: string;
	courseTitle: string;
	memberCount: number;
	attemptCount: number;
	createdAt: string;
	updatedAt: string;
};

export type AdminKnowledgeTableRow = {
	id: string;
	slug: string;
	title: string;
	status: MyClassPublishStatus;
	levelCount: number;
	mappingCount: number;
	questionCount: number;
	updatedAt: string;
	hasDraft: boolean;
};

export type AdminVocabTableRow = {
	id: string;
	title: string;
	wordCount: number;
	assignmentCount: number;
	libraryCount: number;
	isArchived: boolean;
	isCourseOnly: boolean;
	courses: Array<{ id: string; title: string }>;
	updatedAt: string;
};

export type AdminTestTableRow = {
	id: string;
	slug: string;
	title: string;
	status: MyClassPublishStatus;
	subjectName: string | null;
	placementCount: number;
	questionCount: number;
	attemptCount: number;
	courseTitles: string[];
	updatedAt: string;
};

export type AdminQuestionTableRow = {
	id: string;
	stem: string;
	type: MyClassQuestionType;
	difficulty: number;
	status: MyClassQuestionStatus;
	tags: string[];
	subjectName: string | null;
	topicPath: string | null;
	testCount: number;
	updatedAt: string;
};

export type AdminPerformanceTableRow = {
	id: string;
	title: string;
	subtitle?: string;
	accuracy: number | null;
	evidence: number;
	href?: string;
	meta?: string;
};

export type AdminCourseTablePage = ListPage<AdminCourseTableRow>;
export type AdminCohortTablePage = ListPage<AdminCohortTableRow>;
export type AdminKnowledgeTablePage = ListPage<AdminKnowledgeTableRow>;
export type AdminVocabTablePage = ListPage<AdminVocabTableRow>;
export type AdminTestTablePage = ListPage<AdminTestTableRow>;
export type AdminQuestionTablePage = ListPage<AdminQuestionTableRow>;
