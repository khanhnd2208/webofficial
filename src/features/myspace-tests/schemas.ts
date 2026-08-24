import { z } from 'zod';

export const mcqCorrectOptionSchema = z.enum(['A', 'B', 'C', 'D']);

export const publishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const createSubjectSchema = z.object({
	name: z.string().trim().min(1, 'Tên môn bắt buộc').max(200),
});

export const updateSubjectSchema = z.object({
	name: z.string().trim().min(1, 'Tên môn bắt buộc').max(200),
});

export const createSpaceTestSchema = z.object({
	title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	description: z.string().max(10_000).optional(),
	subjectId: z.string().trim().min(1, 'Môn học bắt buộc'),
	topics: z.array(z.string().trim().min(1).max(300)).max(100).optional(),
	difficulties: z.array(z.number().int().min(1).max(10)).max(10).optional(),
	classifications: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
	questionCount: z.number().int().min(1).max(200),
	displayOrder: z.number().int().min(0).max(100_000).optional(),
	status: publishStatusSchema.optional(),
});

export const updateSpaceTestSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	slug: z.string().trim().min(1).max(120).optional(),
	description: z.string().max(10_000).optional(),
	subjectId: z.string().trim().min(1).optional(),
	topics: z.array(z.string().trim().min(1).max(300)).max(100).optional(),
	difficulties: z.array(z.number().int().min(1).max(10)).max(10).optional(),
	classifications: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
	questionCount: z.number().int().min(1).max(200).optional(),
	displayOrder: z.number().int().min(0).max(100_000).optional(),
	status: publishStatusSchema.optional(),
});

export const updateMcqQuestionSchema = z.object({
	subjectId: z.string().trim().min(1).nullable().optional(),
	topic: z.string().trim().min(1).max(300).optional(),
	stem: z.string().trim().min(1).max(10_000).optional(),
	optionA: z.string().trim().min(1).max(5_000).optional(),
	optionB: z.string().trim().min(1).max(5_000).optional(),
	optionC: z.string().trim().min(1).max(5_000).optional(),
	optionD: z.string().trim().min(1).max(5_000).optional(),
	correctOption: mcqCorrectOptionSchema.optional(),
	difficulty: z.number().int().min(1).max(10).optional(),
	aacsb: z.string().trim().max(500).optional(),
	learningObjective: z.string().trim().max(1_000).optional(),
	classification: z.string().trim().max(200).optional(),
	isActive: z.boolean().optional(),
});

export const importTestMetaSchema = z.object({
	subjectId: z.string().trim().min(1, 'Môn học bắt buộc'),
	title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	description: z.string().max(10_000).optional(),
	questionCount: z.number().int().min(1).max(200).optional(),
	status: publishStatusSchema.optional(),
});

export const submitSessionSchema = z.object({
	answers: z
		.array(
			z.object({
				questionId: z.string().min(1),
				chosen: mcqCorrectOptionSchema,
			}),
		)
		.min(1)
		.max(200),
});

export const checkAnswerSchema = z.object({
	questionId: z.string().min(1),
	chosen: mcqCorrectOptionSchema,
});

export const playPoolFiltersSchema = z.object({
	difficulties: z.array(z.number().int().min(1).max(10)).max(10).optional(),
	learningObjectives: z.array(z.string().trim().min(1).max(1_000)).max(100).optional(),
});

export const startSessionSchema = z
	.object({
		mode: z.enum(['default', 'custom']).default('default'),
		questionCount: z.number().int().min(1).max(200).optional(),
		difficulties: z.array(z.number().int().min(1).max(10)).max(10).optional(),
		learningObjectives: z.array(z.string().trim().min(1).max(1_000)).max(100).optional(),
		/** Reuse a prepared question set (e.g. after first answer). */
		questionIds: z.array(z.string().min(1)).min(1).max(200).optional(),
		/** Persist session row. False = preview/prepare only (no DB write). */
		persist: z.boolean().default(true),
		/** Mark as real attempt (answered ≥1). Use when creating on first answer. */
		engage: z.boolean().default(false),
	})
	.superRefine((val, ctx) => {
		if (val.mode === 'custom' && val.questionCount === undefined && !val.questionIds) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Số câu bắt buộc khi chọn chế độ tự điều chỉnh',
				path: ['questionCount'],
			});
		}
	});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateSpaceTestInput = z.infer<typeof createSpaceTestSchema>;
export type UpdateSpaceTestInput = z.infer<typeof updateSpaceTestSchema>;
export type UpdateMcqQuestionInput = z.infer<typeof updateMcqQuestionSchema>;
export type ImportTestMetaInput = z.infer<typeof importTestMetaSchema>;
export type SubmitSessionInput = z.infer<typeof submitSessionSchema>;
export type CheckAnswerInput = z.infer<typeof checkAnswerSchema>;
export type PlayPoolFiltersInput = z.infer<typeof playPoolFiltersSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type McqCorrectOption = z.infer<typeof mcqCorrectOptionSchema>;
