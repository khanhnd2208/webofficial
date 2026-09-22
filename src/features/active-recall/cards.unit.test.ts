import { describe, expect, it } from 'vitest';

import { AppError } from '@/lib/appError';

import { prepareRecallCardsForSave } from './cards';

describe('prepareRecallCardsForSave', () => {
	it('skips completely blank cards and keeps valid ones', () => {
		expect(
			prepareRecallCardsForSave([
				{ question: '', answer: '' },
				{ question: '<p></p>', answer: '<p>   </p>' },
				{ question: 'What is HRM?', answer: 'Human resource management' },
			]),
		).toEqual([
			expect.objectContaining({
				question: expect.stringContaining('What is HRM?'),
				answer: expect.stringContaining('Human resource management'),
			}),
		]);
	});

	it('reports one-sided cards with field-level errors', () => {
		try {
			prepareRecallCardsForSave([
				{ question: 'Only a question', answer: '' },
				{ question: '', answer: 'Only an answer' },
			]);
			throw new Error('expected validation error');
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({
				status: 422,
				fields: {
					'cards.0.answer': 'Thẻ thiếu đáp án',
					'cards.1.question': 'Thẻ thiếu câu hỏi',
				},
			});
		}
	});

	it('reuses stored HTML when a card has not changed, so save does not resanitize the whole deck', () => {
		const stored = {
			id: 'card-1',
			question: '<p>What is HRM?</p>',
			answer: '<p>Human resource management</p>',
			questionVi: '',
			answerVi: '',
		};
		expect(
			prepareRecallCardsForSave(
				[
					{
						id: 'card-1',
						question: '<p>What is HRM?</p>',
						answer: '<p>Human resource management</p>',
						questionVi: '',
						answerVi: '',
					},
				],
				new Map([[stored.id, stored]]),
			),
		).toEqual([stored]);
	});
});
