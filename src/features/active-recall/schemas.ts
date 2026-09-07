import { z } from 'zod';

import { recallHasContent, recallImportToStoredHtml, recallVisibleLength } from './richText';

export const ACTIVE_RECALL_MAX_CARDS = 1_000;
export const ACTIVE_RECALL_MAX_QUESTION_LENGTH = 2_000;
export const ACTIVE_RECALL_MAX_ANSWER_LENGTH = 10_000;

export const recallCardDraftSchema = z.object({
	id: z.string().trim().min(1).optional(),
	question: z.string(),
	answer: z.string(),
});

const requiredText = (max: number, label: string) =>
	z.string().trim().min(1, `${label} không được để trống`).max(max, `${label} quá dài`);

const requiredRecallHtml = (max: number, label: string) =>
	z.preprocess(
		(value) => (typeof value === 'string' ? recallImportToStoredHtml(value) : value),
		z
			.string()
			.refine((value) => recallHasContent(value), `${label} không được để trống`)
			.refine((value) => recallVisibleLength(value) <= max, `${label} quá dài`),
	);

export const activeRecallStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const activeRecallCardInputSchema = z.object({
	id: z.string().trim().min(1).optional(),
	question: requiredRecallHtml(ACTIVE_RECALL_MAX_QUESTION_LENGTH, 'Câu hỏi'),
	answer: requiredRecallHtml(ACTIVE_RECALL_MAX_ANSWER_LENGTH, 'Đáp án'),
});

export const createActiveRecallDeckSchema = z.object({
	title: requiredText(160, 'Tên bộ thẻ'),
	slug: z.string().trim().max(180).optional(),
	courseId: z.string().trim().min(1).optional(),
	courseCode: z.string().trim().max(40).optional(),
	subject: z.string().trim().max(120).default(''),
	lessonLabel: z.string().trim().max(120).default(''),
	description: z.string().trim().max(2_000).default(''),
	status: activeRecallStatusSchema.default('DRAFT'),
	cards: z
		.array(recallCardDraftSchema)
		.max(ACTIVE_RECALL_MAX_CARDS, `Tối đa ${ACTIVE_RECALL_MAX_CARDS} thẻ mỗi bộ`)
		.optional(),
});

export const updateActiveRecallDeckMetaSchema = z
	.object({
		title: requiredText(160, 'Tên bộ thẻ').optional(),
		lessonLabel: z.string().trim().max(120).optional(),
		status: activeRecallStatusSchema.optional(),
		expectedUpdatedAt: z.string().datetime(),
	})
	.strict()
	.refine(
		(value) =>
			value.title !== undefined || value.lessonLabel !== undefined || value.status !== undefined,
		'Provide title, lessonLabel or status',
	);

export const updateActiveRecallDeckSchema = z.object({
	title: requiredText(160, 'Tên bộ thẻ'),
	slug: z.string().trim().max(180).optional(),
	courseId: z.string().trim().min(1).optional(),
	courseCode: z.string().trim().max(40).optional(),
	subject: z.string().trim().max(120).default(''),
	lessonLabel: z.string().trim().max(120).default(''),
	description: z.string().trim().max(2_000).default(''),
	status: activeRecallStatusSchema,
	expectedUpdatedAt: z.string().datetime(),
	cards: z
		.array(recallCardDraftSchema)
		.max(ACTIVE_RECALL_MAX_CARDS, `Tối đa ${ACTIVE_RECALL_MAX_CARDS} thẻ mỗi bộ`),
});

export const activeRecallImportSchema = z.object({
	text: z.string().trim().min(1, 'Hãy dán dữ liệu trước').max(2_000_000, 'Dữ liệu import quá lớn'),
	expectedUpdatedAt: z.string().datetime().optional(),
	mode: z.enum(['append', 'replace']).default('append'),
});

export type RecallCardDraftInput = z.infer<typeof recallCardDraftSchema>;
export type CreateActiveRecallDeckInput = z.infer<typeof createActiveRecallDeckSchema>;
export type UpdateActiveRecallDeckInput = z.infer<typeof updateActiveRecallDeckSchema>;
export type UpdateActiveRecallDeckMetaInput = z.infer<typeof updateActiveRecallDeckMetaSchema>;
export type ActiveRecallImportInput = z.infer<typeof activeRecallImportSchema>;
