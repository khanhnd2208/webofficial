import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '../content/questions';
import {
	computeResult,
	expectedLength,
	nextQuestion,
	questionPath,
	type Answers,
	type OptionKey,
	type QuestionId,
} from './quiz';

const keysOf = (id: QuestionId) => QUESTIONS[id].options.map((option) => option.key);

/** Every answer sheet a real person can produce by following the branches. */
function allCompletedSheets(): Answers[] {
	const done: Answers[] = [];
	const walk = (answers: Answers) => {
		const next = nextQuestion(answers);
		if (!next) {
			done.push(answers);
			return;
		}
		for (const key of keysOf(next)) walk({ ...answers, [next]: key });
	};
	walk({});
	return done;
}

describe('UNRELEASED quiz branching', () => {
	it('asks only Q1, Q3, Q4 when there is no direction yet', () => {
		expect(questionPath({ q1: 'D', q3: 'A', q4: 'A' })).toEqual(['q1', 'q3', 'q4']);
		expect(computeResult({ q1: 'C', q3: 'D', q4: 'E' })).toMatchObject({
			group: 'chua-chon-bai',
			variant: 'no-direction',
		});
	});

	it('stops after Q4 when the JD was not read closely', () => {
		const answers: Answers = { q1: 'A', q2: 'B', q3: 'B', q4: 'C' };
		expect(nextQuestion(answers)).toBeNull();
		expect(computeResult(answers)).toMatchObject({ variant: 'no-jd' });
		expect(expectedLength(answers)).toBe(4);
	});

	it('stops after Q5 when the job itself is unclear', () => {
		const answers: Answers = { q1: 'B', q2: 'A', q3: 'A', q4: 'A', q5: 'D' };
		expect(nextQuestion(answers)).toBeNull();
		expect(computeResult(answers)).toMatchObject({ variant: 'unclear-job' });
	});

	it('flags an example without a readable JD', () => {
		const result = computeResult({ q1: 'A', q2: 'A', q3: 'A', q4: 'B', q5: 'C', q6: 'A', q7: 'D' });
		expect(result).toMatchObject({
			group: 'chua-chon-bai',
			variant: 'unclear-requirements',
			hasExampleButUnclearJd: true,
		});
	});

	it('takes the middle level of Q5–Q7', () => {
		const base: Answers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A' };
		expect(computeResult({ ...base, q5: 'A', q6: 'C', q7: 'A' }).group).toBe('ban-nhap'); // 0-0-2
		expect(computeResult({ ...base, q5: 'A', q6: 'B', q7: 'A' }).group).toBe('doi-giong'); // 0-1-2
		expect(computeResult({ ...base, q5: 'B', q6: 'A', q7: 'A' }).group).toBe('dung-bai'); // 1-2-2
	});

	it('shows at most the right mismatch note', () => {
		const base: Answers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A' };
		expect(computeResult({ ...base, q5: 'A', q6: 'B', q7: 'B' }).note).toBe('more-than-you-think');
		expect(computeResult({ ...base, q5: 'C', q6: 'D', q7: 'C' }).note).toBe('no-clear-example');
		expect(computeResult({ ...base, q5: 'B', q6: 'A', q7: 'C' }).note).toBe('one-is-not-all');
		expect(computeResult({ ...base, q5: 'B', q6: 'B', q7: 'B' }).note).toBeNull();
	});

	it('does not put an accounting intern applying for marketing in Đúng bài by default', () => {
		// Past work differs, skills overlap a little, few requirements covered.
		const result = computeResult({ q1: 'A', q2: 'A', q3: 'C', q4: 'D', q5: 'B', q6: 'B', q7: 'C' });
		expect(result.group).not.toBe('dung-bai');
	});

	it('gives every reachable answer sheet exactly one valid result', () => {
		const sheets = allCompletedSheets();
		// 2 no-direction Q1 × 4 × 5 + 2 × 2 no-JD × 4 × 5 + 2 × 4 × 5 × (1 + 3 × 4 × 4)
		expect(sheets).toHaveLength(40 + 80 + 40 * 49);
		const seen = new Set<string>();
		for (const answers of sheets) {
			const result = computeResult(answers);
			seen.add(`${result.group}:${result.variant ?? ''}`);
			const path = questionPath(answers);
			expect(Object.keys(answers).sort()).toEqual([...path].sort());
			expect(path.length).toBe(expectedLength(answers));
			for (const id of result.decidingQuestions) expect(answers[id]).toBeDefined();
			if (result.group !== 'chua-chon-bai') expect(result.variant).toBeNull();
			else expect(result.note).toBeNull();
		}
		expect([...seen].sort()).toEqual([
			'ban-nhap:',
			'chua-chon-bai:no-direction',
			'chua-chon-bai:no-jd',
			'chua-chon-bai:unclear-job',
			'chua-chon-bai:unclear-requirements',
			'doi-giong:',
			'dung-bai:',
		]);
	});

	it('refuses to score an unfinished quiz', () => {
		expect(() => computeResult({ q1: 'A' as OptionKey })).toThrow();
	});
});
