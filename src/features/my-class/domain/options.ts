import { AppError } from '@/lib/appError';

import { questionOptionListSchema } from '../schemas';
import type { QuestionOption } from '../types';

export function parseQuestionOptions(value: unknown): QuestionOption[] {
	const parsed = questionOptionListSchema.safeParse(value);
	if (!parsed.success) {
		throw new AppError('Options câu hỏi không hợp lệ', 422);
	}
	return parsed.data;
}

export function parsePublicOptions(value: unknown): QuestionOption[] {
	return parseQuestionOptions(value).map(({ key, text }) => ({ key, text }));
}
