import { describe, expect, it } from 'vitest';

import { questionOptionsSchema } from '../schemas';
import { buildKuEvidence, kuShare, weightedAccuracy } from '../domain/scoring';
import type { ScoredAnswer } from '../domain/scoring';

describe('question options schema', () => {
	it('accepts 2 to 6 unique options', () => {
		expect(questionOptionsSchema.safeParse([{ key: 'A', text: 'Yes' }]).success).toBe(false);
		expect(
			questionOptionsSchema.safeParse([
				{ key: 'A', text: 'Yes' },
				{ key: 'B', text: 'No' },
			]).success,
		).toBe(true);
	});

	it('rejects duplicate keys and empty text', () => {
		expect(
			questionOptionsSchema.safeParse([
				{ key: 'A', text: 'Yes' },
				{ key: 'A', text: 'No' },
			]).success,
		).toBe(false);
		expect(
			questionOptionsSchema.safeParse([
				{ key: 'A', text: 'Yes' },
				{ key: 'B', text: '   ' },
			]).success,
		).toBe(false);
	});
});

describe('KU attribution', () => {
	it('splits 1/n across mapped knowledge units using earned/max', () => {
		expect(kuShare(2)).toBe(0.5);
		const answers: ScoredAnswer[] = [
			{
				questionId: 'q1',
				knowledgeUnitIds: ['ku1', 'ku2'],
				earned: 1,
				max: 1,
				isCorrect: true,
			},
			{
				questionId: 'q2',
				knowledgeUnitIds: ['ku1'],
				earned: 0,
				max: 1,
				isCorrect: false,
			},
		];
		const evidence = buildKuEvidence(answers);
		const ku1 = evidence.find((row) => row.knowledgeUnitId === 'ku1')!;
		const ku2 = evidence.find((row) => row.knowledgeUnitId === 'ku2')!;
		expect(ku1.questionCount).toBeCloseTo(1.5);
		expect(ku1.correctCount).toBeCloseTo(0.5);
		expect(ku2.questionCount).toBeCloseTo(0.5);
		expect(ku2.correctCount).toBeCloseTo(0.5);
		expect(weightedAccuracy(ku1.correctCount, ku1.questionCount)).toBe(33);
	});
});
