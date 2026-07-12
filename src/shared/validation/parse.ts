import { z } from 'zod';

import { AppError } from '@/lib/appError';

export function parseSchema<T>(schema: z.ZodType<T>, data: unknown): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		const message = result.error.issues.map((issue) => issue.message).join('; ') || 'Invalid input';
		throw new AppError(message, 400);
	}
	return result.data;
}
