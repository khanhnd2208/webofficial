import { AppError } from '@/lib/appError';

import { answerSpecSchema, learnerResponseSchema } from '../schemas';
import type { AnswerSpec, LearnerResponse } from '../types';

export function parseAnswerSpec(value: unknown): AnswerSpec {
	const parsed = answerSpecSchema.safeParse(value);
	if (!parsed.success) {
		throw new AppError('Đáp án câu hỏi không hợp lệ', 422);
	}
	return parsed.data;
}

export function coerceLearnerResponse(value: unknown): LearnerResponse {
	const candidate =
		typeof value === 'string'
			? { type: 'MCQ_SINGLE' as const, key: value.trim().toUpperCase() }
			: value;
	const parsed = learnerResponseSchema.safeParse(candidate);
	if (!parsed.success) {
		throw new AppError('Câu trả lời không hợp lệ', 422);
	}
	return parsed.data;
}

export function displayCorrect(answer: AnswerSpec): string {
	if (answer.type === 'MCQ_SINGLE') return answer.correctKey;
	if (answer.type === 'MCQ_MULTI') return answer.correctKeys.join(', ');
	return answer.blanks.map((blank) => `${blank.id}: ${blank.accepted[0] ?? ''}`).join('; ');
}

export function displayChosen(response: LearnerResponse): string {
	if (response.type === 'MCQ_SINGLE') return response.key;
	if (response.type === 'MCQ_MULTI') return response.keys.join(', ');
	return Object.entries(response.blanks)
		.map(([id, text]) => `${id}: ${text}`)
		.join('; ');
}
