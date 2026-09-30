import { z } from 'zod';

import { AppError } from '@/lib/appError';

import { extractBlankIds } from '../domain/blanks';
import { BLOOM_MAX, BLOOM_MIN } from '../domain/bloom';

export const publishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const courseLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export const questionStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export const questionTypeSchema = z.enum(['MCQ_SINGLE', 'MCQ_MULTI', 'FILL_BLANK']);
export const testScopeSchema = z.enum(['COURSE', 'LESSON', 'SECTION']);
export const revealPolicySchema = z.enum(['AFTER_SUBMIT', 'IMMEDIATE', 'NEVER']);
export const optionKeySchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);
export const membershipStatusSchema = z.enum(['PENDING', 'ACTIVE', 'REMOVED']);
export const scoringModeSchema = z.enum(['ALL_OR_NOTHING', 'PARTIAL']);
export const bloomSchema = z.number().int().min(BLOOM_MIN).max(BLOOM_MAX);

export const questionOptionSchema = z.object({
	key: optionKeySchema,
	text: z.string().trim().min(1, 'Option không được trống').max(2000),
	feedback: z.string().max(4000).optional(),
});

export const questionOptionListSchema = z.array(questionOptionSchema).max(6);

export const mcqOptionsSchema = z
	.array(questionOptionSchema)
	.min(2, 'Cần từ 2 đến 6 options')
	.max(6, 'Cần từ 2 đến 6 options')
	.superRefine((options, ctx) => {
		const keys = options.map((option) => option.key);
		if (new Set(keys).size !== keys.length) {
			ctx.addIssue({ code: 'custom', message: 'Option key không được trùng' });
		}
	});

/** @deprecated Prefer mcqOptionsSchema or questionOptionListSchema. */
export const questionOptionsSchema = mcqOptionsSchema;

export const fillBlankItemSchema = z.object({
	id: z.string().trim().min(1).max(40),
	length: z.number().int().min(1).max(40),
	accepted: z.array(z.string().trim().min(1).max(200)).min(1),
	caseSensitive: z.boolean().default(false),
	ignoreDiacritics: z.boolean().default(true),
	hint: z.string().max(400).optional(),
});

export const mcqSingleAnswerSchema = z.object({
	type: z.literal('MCQ_SINGLE'),
	correctKey: optionKeySchema,
});

export const mcqMultiAnswerSchema = z.object({
	type: z.literal('MCQ_MULTI'),
	correctKeys: z.array(optionKeySchema).min(2),
	scoring: scoringModeSchema.default('ALL_OR_NOTHING'),
});

export const fillBlankAnswerSchema = z.object({
	type: z.literal('FILL_BLANK'),
	scoring: scoringModeSchema.default('ALL_OR_NOTHING'),
	blanks: z.array(fillBlankItemSchema).min(1),
});

export const answerSpecSchema = z.discriminatedUnion('type', [
	mcqSingleAnswerSchema,
	mcqMultiAnswerSchema,
	fillBlankAnswerSchema,
]);

export const learnerResponseSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('MCQ_SINGLE'), key: optionKeySchema }),
	z.object({ type: z.literal('MCQ_MULTI'), keys: z.array(optionKeySchema).min(1) }),
	z.object({ type: z.literal('FILL_BLANK'), blanks: z.record(z.string(), z.string().max(200)) }),
]);

export const submitAnswerValueSchema = z.union([optionKeySchema, learnerResponseSchema]);

export function parseWithAppError<T>(schema: z.ZodType<T>, data: unknown): T {
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		const fields: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const key = issue.path.join('.') || '_';
			if (!fields[key]) fields[key] = issue.message;
		}
		throw new AppError('Dữ liệu không hợp lệ', 422, 'VALIDATION', fields);
	}
	return parsed.data;
}

export const createCourseSchema = z.object({
	title: z.string().trim().min(1).max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().max(500).optional(),
	description: z.string().max(10_000).optional(),
	thumbnailUrl: z.string().trim().max(2000).nullable().optional(),
	level: courseLevelSchema.nullable().optional(),
	tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
	subjectId: z.string().min(1).nullable().optional(),
});
export const updateCourseSchema = createCourseSchema.partial().extend({
	status: publishStatusSchema.optional(),
	expectedUpdatedAt: z.string().min(1).optional(),
});

export const lessonInputSchema = z.object({
	title: z.string().trim().min(1).max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().max(1000).optional(),
	status: publishStatusSchema.optional(),
});

export const sectionInputSchema = z.object({
	title: z.string().trim().min(1).max(200),
	summary: z.string().max(1000).optional(),
	status: publishStatusSchema.optional(),
});

export const reorderSchema = z.object({
	ids: z.array(z.string().min(1)).min(1),
});

export const attachKnowledgeSchema = z.object({
	knowledgeUnitId: z.string().min(1),
});

export const createKnowledgeUnitSchema = z.object({
	slug: z.string().trim().min(1).max(120).optional(),
	title: z.string().trim().min(1).max(200),
	summary: z.string().max(1000).optional(),
	foundationHtml: z.string().max(100_000).optional(),
	academicHtml: z.string().max(100_000).optional(),
	expertHtml: z.string().max(100_000).optional(),
});

export const saveDraftRevisionSchema = z.object({
	title: z.string().trim().min(1).max(200),
	summary: z.string().max(1000).optional(),
	foundationHtml: z.string().max(100_000).optional(),
	academicHtml: z.string().max(100_000).optional(),
	expertHtml: z.string().max(100_000).optional(),
	slug: z.string().trim().min(1).max(120).optional(),
	expectedUpdatedAt: z.string().min(1).optional(),
});

export const relatedKnowledgeSchema = z.object({
	toId: z.string().min(1),
});

export const questionBodySchema = z
	.object({
		slug: z.string().trim().min(1).max(120).optional(),
		type: questionTypeSchema.default('MCQ_SINGLE'),
		stem: z.string().trim().min(1).max(10_000),
		options: questionOptionListSchema.optional(),
		answer: answerSpecSchema,
		explanation: z.string().max(20_000).optional(),
		hint: z.string().max(4_000).optional(),
		source: z.string().max(400).optional(),
		difficulty: bloomSchema,
		subjectId: z.string().min(1).nullable().optional(),
		topicId: z.string().min(1).nullable().optional(),
		tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
		knowledgeUnitIds: z.array(z.string().min(1)).optional(),
		status: questionStatusSchema.optional(),
	})
	.superRefine((value, ctx) => {
		const options = value.options ?? [];
		if (value.type === 'FILL_BLANK') {
			if (options.length > 0) {
				ctx.addIssue({
					code: 'custom',
					path: ['options'],
					message: 'Fill-in-the-blank không dùng options',
				});
			}
			if (value.answer.type !== 'FILL_BLANK') {
				ctx.addIssue({
					code: 'custom',
					path: ['answer'],
					message: 'answer.type phải khớp type FILL_BLANK',
				});
				return;
			}
			const stemIds = extractBlankIds(value.stem);
			const blankIds = value.answer.blanks.map((blank) => blank.id);
			if (new Set(blankIds).size !== blankIds.length) {
				ctx.addIssue({
					code: 'custom',
					path: ['answer', 'blanks'],
					message: 'Blank id không được trùng',
				});
			}
			const stemSet = new Set(stemIds);
			const blankSet = new Set(blankIds);
			if (stemSet.size !== blankSet.size || [...stemSet].some((id) => !blankSet.has(id))) {
				ctx.addIssue({
					code: 'custom',
					path: ['stem'],
					message: 'Token [[n]] trong stem phải khớp đúng danh sách blanks',
				});
			}
			return;
		}
		const parsedOptions = mcqOptionsSchema.safeParse(options);
		if (!parsedOptions.success) {
			ctx.addIssue({
				code: 'custom',
				path: ['options'],
				message: 'Cần từ 2 đến 6 options không trùng key',
			});
			return;
		}
		const keys = new Set(parsedOptions.data.map((option) => option.key));
		if (value.type === 'MCQ_SINGLE') {
			if (value.answer.type !== 'MCQ_SINGLE') {
				ctx.addIssue({
					code: 'custom',
					path: ['answer'],
					message: 'answer.type phải khớp type MCQ_SINGLE',
				});
				return;
			}
			if (!keys.has(value.answer.correctKey)) {
				ctx.addIssue({
					code: 'custom',
					path: ['answer', 'correctKey'],
					message: 'correctKey phải tồn tại trong options',
				});
			}
			return;
		}
		if (value.answer.type !== 'MCQ_MULTI') {
			ctx.addIssue({
				code: 'custom',
				path: ['answer'],
				message: 'answer.type phải khớp type MCQ_MULTI',
			});
			return;
		}
		if (value.answer.correctKeys.some((key) => !keys.has(key))) {
			ctx.addIssue({
				code: 'custom',
				path: ['answer', 'correctKeys'],
				message: 'correctKeys phải tồn tại trong options',
			});
		}
		if (new Set(value.answer.correctKeys).size !== value.answer.correctKeys.length) {
			ctx.addIssue({
				code: 'custom',
				path: ['answer', 'correctKeys'],
				message: 'correctKeys không được trùng',
			});
		}
		if (value.answer.correctKeys.length >= keys.size) {
			ctx.addIssue({
				code: 'custom',
				path: ['answer', 'correctKeys'],
				message: 'MCQ nhiều đáp án không được đánh đúng tất cả options',
			});
		}
	});

export const createSubjectSchema = z.object({
	name: z.string().trim().min(1).max(120),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().max(1000).optional(),
	position: z.number().int().nonnegative().optional(),
	status: publishStatusSchema.optional(),
});
export const updateSubjectSchema = createSubjectSchema.partial();

export const createTopicSchema = z.object({
	subjectId: z.string().min(1),
	parentId: z.string().min(1).nullable().optional(),
	name: z.string().trim().min(1).max(160),
	slug: z.string().trim().min(1).max(120).optional(),
	position: z.number().int().nonnegative().optional(),
	status: publishStatusSchema.optional(),
	knowledgeUnitIds: z.array(z.string().min(1)).optional(),
});
export const updateTopicSchema = createTopicSchema
	.partial()
	.omit({ subjectId: true })
	.extend({
		subjectId: z.string().min(1).optional(),
	});

export const createTestSchema = z.object({
	title: z.string().trim().min(1).max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	description: z.string().max(10_000).optional(),
	subjectId: z.string().min(1).nullable().optional(),
	tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
	passScore: z.number().int().min(0).max(100).nullable().optional(),
	timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
	maxAttempts: z.number().int().min(1).max(50).nullable().optional(),
	shuffleQuestions: z.boolean().optional(),
	shuffleOptions: z.boolean().optional(),
	revealPolicy: revealPolicySchema.optional(),
});

export const updateTestSchema = createTestSchema.partial().extend({
	status: publishStatusSchema.optional(),
});

export const testPlacementSchema = z.object({
	courseId: z.string().min(1),
	scope: testScopeSchema,
	lessonId: z.string().min(1).nullable().optional(),
	sectionId: z.string().min(1).nullable().optional(),
	position: z.number().int().nonnegative().optional(),
	status: publishStatusSchema.optional(),
});

export const testQuestionsSchema = z
	.object({
		questionIds: z.array(z.string().min(1)).optional(),
		items: z
			.array(
				z.object({
					questionId: z.string().min(1),
					points: z.number().int().min(1).max(100).optional(),
				}),
			)
			.optional(),
	})
	.superRefine((value, ctx) => {
		if (!value.questionIds?.length && !value.items?.length) {
			ctx.addIssue({ code: 'custom', path: ['questionIds'], message: 'Cần danh sách câu hỏi' });
		}
	});

export const testQuestionInputSchema = questionBodySchema;

export const randomFillSchema = z.object({
	count: z.number().int().min(1).max(50),
	replace: z.boolean().optional(),
});

export const bankBulkSchema = z.object({
	ids: z.array(z.string().min(1)).min(1).max(200),
	action: z.enum(['archive', 'restore', 'set-topic', 'add-tags', 'remove-tags', 'add-to-test']),
	topicId: z.string().min(1).nullable().optional(),
	subjectId: z.string().min(1).nullable().optional(),
	tags: z.array(z.string().trim().min(1).max(40)).optional(),
	testId: z.string().min(1).optional(),
});

export const testCsvImportSchema = z.object({
	csv: z.string().min(1),
	mode: z.enum(['preview', 'commit']).default('preview'),
	strategy: z.enum(['append', 'replace']).default('append'),
});

export const submitTestSchema = z.object({
	answers: z
		.record(z.string().min(1), submitAnswerValueSchema)
		.refine((value) => Object.keys(value).length <= 200, 'Payload vượt giới hạn'),
	durationSeconds: z.number().int().min(0).max(86_400).optional(),
	timedOut: z.boolean().optional(),
});

export const checkTestQuestionSchema = z.object({
	questionId: z.string().min(1),
	answer: submitAnswerValueSchema,
});

export const createCohortSchema = z.object({
	courseId: z.string().min(1),
	name: z.string().trim().min(1).max(200),
	term: z.string().max(80).optional(),
	startsAt: z.string().min(1).nullable().optional(),
	endsAt: z.string().min(1).nullable().optional(),
	status: publishStatusSchema.optional(),
});
export const updateCohortSchema = createCohortSchema.partial();

export const membershipInputSchema = z.object({
	email: z.string().trim().email(),
	name: z.string().trim().max(200).optional(),
});

export const rosterCommitSchema = z.object({
	rows: z.array(membershipInputSchema).min(1).max(500),
});

export const vocabAssignmentSchema = z.object({
	vocabSetId: z.string().min(1),
	lessonId: z.string().min(1).nullable().optional(),
	position: z.number().int().nonnegative().optional(),
});

export const updateVocabAssignmentSchema = z.object({
	lessonId: z.string().min(1).nullable().optional(),
	position: z.number().int().nonnegative().optional(),
});

export const vocabCsvImportSchema = z.object({
	lessonId: z.string().min(1).nullable().optional(),
	title: z.string().trim().max(200).optional(),
	description: z.string().max(10_000).optional(),
	csv: z.string().min(1),
	mode: z.enum(['preview', 'commit']).default('preview'),
	targetSetId: z.string().min(1).optional(),
	strategy: z.enum(['append', 'replace']).default('append'),
});

export const vocabWordInputSchema = z.object({
	term: z.string().trim().min(1),
	definition: z.string().optional(),
	partOfSpeech: z.string().optional(),
	example: z.string().optional(),
	pronunciation: z.string().optional(),
	meaningEn: z.string().optional(),
	meaningVi: z.string().optional(),
	ndkExplanation: z.string().nullable().optional(),
	hintsHard: z.array(z.string()).optional(),
	hintsMedium: z.array(z.string()).optional(),
	hintsEasy: z.array(z.string()).optional(),
});

export const createMyClassVocabSetSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().max(10_000).optional(),
	words: z.array(vocabWordInputSchema).min(1).max(2000),
	courseId: z.string().min(1).optional(),
	lessonId: z.string().min(1).nullable().optional(),
});

export const updateMyClassVocabSetSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().max(10_000).optional(),
	isArchived: z.boolean().optional(),
	words: z
		.array(vocabWordInputSchema.extend({ id: z.string().min(1).optional() }))
		.max(2000)
		.optional(),
	deleteWordIds: z.array(z.string().min(1)).optional(),
});

export const progressActionSchema = z.object({
	courseId: z.string().min(1).optional(),
	courseSlug: z.string().min(1).optional(),
	lessonSlug: z.string().min(1).optional(),
	sectionId: z.string().min(1).optional(),
});

export const completeKnowledgeSchema = z.object({
	lessonSlug: z.string().min(1).optional(),
	sectionId: z.string().min(1).optional(),
});

export const nodePatchSchema = z.object({
	expectedUpdatedAt: z.string().min(1),
	changes: z.record(z.string(), z.unknown()),
});

export const lessonNodeChangesSchema = z.object({
	title: z.string().trim().min(1).max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().max(1000).optional(),
});

export const sectionNodeChangesSchema = z.object({
	title: z.string().trim().min(1).max(200),
	summary: z.string().max(1000).optional(),
});

export const unitNodeChangesSchema = z.object({
	title: z.string().trim().min(1).max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().max(1000).optional(),
	foundationHtml: z.string().max(100_000).optional(),
	academicHtml: z.string().max(100_000).optional(),
	expertHtml: z.string().max(100_000).optional(),
});

export const nodeStatusSchema = z.object({
	expectedUpdatedAt: z.string().min(1),
	status: publishStatusSchema,
});

export const publishRevisionSchema = z.object({
	expectedUpdatedAt: z.string().min(1),
	requireBoth: z.boolean().optional(),
});

export const workspaceReorderSchema = z.object({
	parentType: z.enum(['course', 'lesson', 'section']),
	parentId: z.string().min(1),
	orderedNodeIds: z.array(z.string().min(1)).min(1),
});

export const curriculumKnowledgeSchema = z.object({
	slug: z.string().min(1),
	title: z.string().min(1),
	summary: z.string().optional(),
	foundationHtml: z.string().optional(),
	academicHtml: z.string().optional(),
	expertHtml: z.string().optional(),
	position: z.number().int().nonnegative(),
	relatedSlugs: z.array(z.string().min(1)).optional(),
});

export const curriculumImportSchema = z.object({
	course: z.object({
		title: z.string().min(1),
		slug: z.string().min(1),
		summary: z.string().optional(),
		description: z.string().optional(),
	}),
	lessons: z.array(
		z.object({
			slug: z.string().min(1),
			title: z.string().min(1),
			summary: z.string().optional(),
			position: z.number().int().nonnegative(),
			sections: z.array(
				z.object({
					title: z.string().min(1),
					summary: z.string().optional(),
					position: z.number().int().nonnegative(),
					knowledgeUnits: z.array(curriculumKnowledgeSchema),
				}),
			),
		}),
	),
});

export const questionCsvImportSchema = z.object({
	csv: z.string().min(1),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type LessonInput = z.infer<typeof lessonInputSchema>;
export type SectionInput = z.infer<typeof sectionInputSchema>;
export type CreateKnowledgeUnitInput = z.infer<typeof createKnowledgeUnitSchema>;
export type SaveDraftRevisionInput = z.infer<typeof saveDraftRevisionSchema>;
export type QuestionBodyInput = z.infer<typeof questionBodySchema>;
export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type TestQuestionInput = z.infer<typeof testQuestionInputSchema>;
export type TestCsvImportInput = z.infer<typeof testCsvImportSchema>;
export type SubmitTestInput = z.infer<typeof submitTestSchema>;
export type CheckTestQuestionInput = z.infer<typeof checkTestQuestionSchema>;
export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;
export type CurriculumImportInput = z.infer<typeof curriculumImportSchema>;
export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type AnswerSpecInput = z.infer<typeof answerSpecSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type TestPlacementInput = z.infer<typeof testPlacementSchema>;
export type BankBulkInput = z.infer<typeof bankBulkSchema>;
export type VocabCsvImportInput = z.infer<typeof vocabCsvImportSchema>;
export type UpdateMyClassVocabSetInput = z.infer<typeof updateMyClassVocabSetSchema>;
