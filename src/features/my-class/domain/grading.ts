import type { AnswerSpec, LearnerResponse, QuestionOptionKey } from '../types';

export type GradedResult = {
	earned: number;
	max: number;
	isCorrect: boolean;
};

function empty(): GradedResult {
	return { earned: 0, max: 1, isCorrect: false };
}

export function stripDiacritics(value: string): string {
	return value
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function normalizeBlankText(
	value: string,
	options: { caseSensitive: boolean; ignoreDiacritics: boolean },
): string {
	let next = value.trim().replace(/\s+/g, ' ');
	if (!options.caseSensitive) next = next.toLowerCase();
	if (options.ignoreDiacritics) next = stripDiacritics(next);
	return next;
}

function sameSet(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const left = [...a].sort();
	const right = [...b].sort();
	return left.every((item, index) => item === right[index]);
}

function gradeMcqSingle(answer: Extract<AnswerSpec, { type: 'MCQ_SINGLE' }>, response: LearnerResponse): GradedResult {
	if (response.type !== 'MCQ_SINGLE') return empty();
	const earned = response.key === answer.correctKey ? 1 : 0;
	return { earned, max: 1, isCorrect: earned === 1 };
}

function gradeMcqMulti(answer: Extract<AnswerSpec, { type: 'MCQ_MULTI' }>, response: LearnerResponse): GradedResult {
	if (response.type !== 'MCQ_MULTI') return empty();
	const correct = new Set(answer.correctKeys);
	const chosen = new Set(response.keys);
	if (answer.scoring === 'ALL_OR_NOTHING') {
		const earned = sameSet([...correct], [...chosen]) ? 1 : 0;
		return { earned, max: 1, isCorrect: earned === 1 };
	}
	let hits = 0;
	let misses = 0;
	for (const key of chosen) {
		if (correct.has(key)) hits += 1;
		else misses += 1;
	}
	const ratio = correct.size ? Math.max(0, hits - misses) / correct.size : 0;
	return { earned: ratio, max: 1, isCorrect: ratio === 1 };
}

function gradeFillBlank(answer: Extract<AnswerSpec, { type: 'FILL_BLANK' }>, response: LearnerResponse): GradedResult {
	if (response.type !== 'FILL_BLANK') return empty();
	if (answer.blanks.length === 0) return empty();
	let correctCount = 0;
	for (const blank of answer.blanks) {
		const raw = response.blanks[blank.id] ?? '';
		const given = normalizeBlankText(raw, {
			caseSensitive: blank.caseSensitive,
			ignoreDiacritics: blank.ignoreDiacritics,
		});
		const matched = blank.accepted.some(
			(item) =>
				normalizeBlankText(item, {
					caseSensitive: blank.caseSensitive,
					ignoreDiacritics: blank.ignoreDiacritics,
				}) === given,
		);
		if (matched) correctCount += 1;
	}
	if (answer.scoring === 'ALL_OR_NOTHING') {
		const earned = correctCount === answer.blanks.length ? 1 : 0;
		return { earned, max: 1, isCorrect: earned === 1 };
	}
	const ratio = correctCount / answer.blanks.length;
	return { earned: ratio, max: 1, isCorrect: ratio === 1 };
}

export function gradeResponse(answer: AnswerSpec, response: LearnerResponse): GradedResult {
	if (answer.type === 'MCQ_SINGLE') return gradeMcqSingle(answer, response);
	if (answer.type === 'MCQ_MULTI') return gradeMcqMulti(answer, response);
	return gradeFillBlank(answer, response);
}

export function scalePoints(result: GradedResult, points: number): { earned: number; max: number } {
	const max = points > 0 ? points : 1;
	return { earned: result.earned * max, max };
}

export function optionKeysOf(options: Array<{ key: QuestionOptionKey }>): Set<string> {
	return new Set(options.map((option) => option.key));
}
