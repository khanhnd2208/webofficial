import { z } from 'zod';

export const LEARN_MAX_MARKDOWN = 200_000;
export const LEARN_MAX_QUESTIONS = 200;

const title = (label: string, max = 200) =>
	z.string().trim().min(1, `${label} không được để trống`).max(max, `${label} quá dài`);

export const learnLevelSchema = z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']);
export const learnStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const learnSectionTypeSchema = z.enum(['READING', 'QUIZ']);

const options = z
	.array(z.string().trim().max(1_000))
	.min(2, 'Cần ít nhất 2 phương án')
	.max(8, 'Tối đa 8 phương án');

export const learnCheckpointSchema = z
	.object({
		question: z.string().trim().max(2_000),
		options,
		correctIndex: z.number().int().min(0),
		explanation: z.string().trim().max(4_000).default(''),
	})
	.refine((value) => value.correctIndex < value.options.length, 'Đáp án đúng không hợp lệ');

export const learnQuizQuestionSchema = z
	.object({
		id: z.string().trim().min(1).max(64),
		question: z.string().trim().max(4_000),
		options,
		correctIndex: z.number().int().min(0),
		explanation: z.string().trim().max(4_000).default(''),
	})
	.refine((value) => value.correctIndex < value.options.length, 'Đáp án đúng không hợp lệ');

export const learnQuizSchema = z.object({
	passingScorePercent: z.number().int().min(0).max(100).default(70),
	timeLimitMinutes: z.number().int().min(1).max(600).nullable().default(null),
	questions: z.array(learnQuizQuestionSchema).max(LEARN_MAX_QUESTIONS),
});

export const createLearnCourseSchema = z.object({
	title: title('Tên khóa học'),
	subtitle: z.string().trim().max(500).default(''),
	description: z.string().trim().max(4_000).default(''),
	category: z.string().trim().max(100).default(''),
	level: learnLevelSchema.default('BASIC'),
});

export const updateLearnCourseSchema = z
	.object({
		title: title('Tên khóa học').optional(),
		slug: z.string().trim().max(180).optional(),
		subtitle: z.string().trim().max(500).optional(),
		description: z.string().trim().max(4_000).optional(),
		category: z.string().trim().max(100).optional(),
		level: learnLevelSchema.optional(),
		status: learnStatusSchema.optional(),
	})
	.strict();

export const createLearnLessonSchema = z.object({
	title: title('Tên bài học').default('Bài học mới'),
	description: z.string().trim().max(4_000).default(''),
});

export const importLearnLessonSchema = z.object({
	markdown: z.string().min(1, 'Chưa có nội dung').max(LEARN_MAX_MARKDOWN * 5, 'Nội dung quá dài'),
	mode: z.enum(['create', 'append', 'replace']).default('create'),
	lessonId: z.string().min(1).optional(),
});

export const updateLearnLessonSchema = z
	.object({
		title: title('Tên bài học').optional(),
		description: z.string().trim().max(4_000).optional(),
	})
	.strict();

export const createLearnSectionSchema = z.object({
	type: learnSectionTypeSchema.default('READING'),
	title: title('Tên mục').optional(),
});

export const updateLearnSectionSchema = z
	.object({
		title: title('Tên mục').optional(),
		type: learnSectionTypeSchema.optional(),
		durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
		summary: z.string().trim().max(2_000).optional(),
		keyTakeaways: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
		markdown: z.string().max(LEARN_MAX_MARKDOWN, 'Nội dung quá dài').optional(),
		checkpoint: learnCheckpointSchema.nullable().optional(),
		quiz: learnQuizSchema.nullable().optional(),
	})
	.strict();

export const reorderLearnOutlineSchema = z.object({
	lessons: z
		.array(z.object({ id: z.string().min(1), sectionIds: z.array(z.string().min(1)) }))
		.max(500),
});

export const updateLearnProgressSchema = z
	.object({
		completed: z.boolean().optional(),
		note: z.string().max(20_000).optional(),
	})
	.strict()
	.refine((value) => value.completed !== undefined || value.note !== undefined, 'Không có thay đổi');

export const submitLearnQuizSchema = z.object({
	answers: z.record(z.string(), z.number().int().min(0)),
});

export type CreateLearnCourseInput = z.infer<typeof createLearnCourseSchema>;
export type UpdateLearnCourseInput = z.infer<typeof updateLearnCourseSchema>;
export type CreateLearnLessonInput = z.infer<typeof createLearnLessonSchema>;
export type UpdateLearnLessonInput = z.infer<typeof updateLearnLessonSchema>;
export type CreateLearnSectionInput = z.infer<typeof createLearnSectionSchema>;
export type UpdateLearnSectionInput = z.infer<typeof updateLearnSectionSchema>;
export type ReorderLearnOutlineInput = z.infer<typeof reorderLearnOutlineSchema>;
export type UpdateLearnProgressInput = z.infer<typeof updateLearnProgressSchema>;
