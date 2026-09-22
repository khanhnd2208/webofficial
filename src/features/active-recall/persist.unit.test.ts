import { describe, expect, it } from 'vitest';

import { planRecallCardWrites } from './persist';

const existing = {
	id: 'card-1',
	question: '<p>What is HRM?</p>',
	answer: '<p>Human resource management</p>',
	questionVi: '',
	answerVi: '',
	position: 0,
};

describe('planRecallCardWrites', () => {
	it('skips cards that already match stored content and order', () => {
		expect(planRecallCardWrites([existing], [existing])).toEqual({
			keepIds: ['card-1'],
			toCreate: [],
			toUpdate: [],
		});
	});

	it('updates only changed cards and creates cards without ids', () => {
		const next = [
			{ ...existing, answer: '<p>Updated</p>' },
			{
				question: '<p>New question</p>',
				answer: '<p>New answer</p>',
				questionVi: '',
				answerVi: '',
			},
		];

		expect(planRecallCardWrites([existing], next)).toEqual({
			keepIds: ['card-1'],
			toCreate: [
				{
					question: '<p>New question</p>',
					answer: '<p>New answer</p>',
					questionVi: '',
					answerVi: '',
					position: 1,
				},
			],
			toUpdate: [
				{
					id: 'card-1',
					question: '<p>What is HRM?</p>',
					answer: '<p>Updated</p>',
					questionVi: '',
					answerVi: '',
					position: 0,
				},
			],
		});
	});

	it('treats a position-only change as an update so reorder stays durable', () => {
		const moved = {
			id: 'card-2',
			question: '<p>Second</p>',
			answer: '<p>Answer</p>',
			questionVi: '',
			answerVi: '',
			position: 1,
		};
		expect(planRecallCardWrites([existing, moved], [moved, existing])).toEqual({
			keepIds: ['card-2', 'card-1'],
			toCreate: [],
			toUpdate: [
				{ ...moved, position: 0 },
				{ ...existing, position: 1 },
			],
		});
	});
});
