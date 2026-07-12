import { z } from 'zod';

export const publishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const createCourseSchema = z.object({
	title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().trim().max(500).optional(),
	description: z.string().max(50_000).optional(),
	thumbnailUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

export const updateCourseSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	slug: z.string().trim().min(1).max(120).optional(),
	summary: z.string().trim().max(500).optional(),
	description: z.string().max(50_000).optional(),
	thumbnailUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
	status: publishStatusSchema.optional(),
});

export const createModuleSchema = z.object({
	title: z.string().trim().min(1, 'Tiêu đề chương bắt buộc').max(200),
	description: z.string().trim().max(2000).optional(),
});

export const updateModuleSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional(),
});

export const createLessonSchema = z.object({
	title: z.string().trim().min(1, 'Tiêu đề bài bắt buộc').max(200),
	slug: z.string().trim().min(1).max(120).optional(),
	contentHtml: z.string().max(200_000).optional(),
	videoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

export const updateLessonSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	slug: z.string().trim().min(1).max(120).optional(),
	contentHtml: z.string().max(200_000).optional(),
	videoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
	status: publishStatusSchema.optional(),
});

export const reorderSchema = z.object({
	orderedIds: z.array(z.string().min(1)).min(1),
});

export const enrollSchema = z.object({
	courseId: z.string().min(1),
	userId: z.string().min(1),
});

export const enrollmentIdSchema = z.object({
	id: z.string().min(1),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
