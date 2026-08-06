import { describe, expect, it } from 'vitest';

import { allocateEvenly, sampleBalancedQuestions } from '../sampleBalanced';
import { mapMcqRow, parseMcqCsvRows, parseMcqCsvText, SAMPLE_MCQ_CSV } from '../parseMcqCsv';

describe('allocateEvenly', () => {
	it('splits equally when divisible', () => {
		const alloc = allocateEvenly(['a', 'b', 'c'], 9);
		expect([...alloc.values()]).toEqual([3, 3, 3]);
	});

	it('uses largest remainder for uneven totals', () => {
		const alloc = allocateEvenly(['a', 'b', 'c'], 10);
		expect([...alloc.values()].reduce((s, n) => s + n, 0)).toBe(10);
		expect(Math.max(...alloc.values())).toBe(4);
		expect(Math.min(...alloc.values())).toBe(3);
	});
});

describe('sampleBalancedQuestions', () => {
	const pool = [
		{ id: 't1-d1-a', topic: 'T1', difficulty: 1 },
		{ id: 't1-d1-b', topic: 'T1', difficulty: 1 },
		{ id: 't1-d2-a', topic: 'T1', difficulty: 2 },
		{ id: 't1-d2-b', topic: 'T1', difficulty: 2 },
		{ id: 't2-d1-a', topic: 'T2', difficulty: 1 },
		{ id: 't2-d1-b', topic: 'T2', difficulty: 1 },
		{ id: 't2-d2-a', topic: 'T2', difficulty: 2 },
		{ id: 't2-d2-b', topic: 'T2', difficulty: 2 },
		{ id: 't3-d1-a', topic: 'T3', difficulty: 1 },
		{ id: 't3-d2-a', topic: 'T3', difficulty: 2 },
	];

	it('returns requested count without duplicates', () => {
		const seq = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.15, 0.55];
		let i = 0;
		const random = () => {
			const v = seq[i % seq.length]!;
			i += 1;
			return v;
		};
		const sampled = sampleBalancedQuestions(pool, 6, random);
		expect(sampled).toHaveLength(6);
		expect(new Set(sampled.map((q) => q.id)).size).toBe(6);
	});

	it('balances topics as evenly as possible', () => {
		const sampled = sampleBalancedQuestions(pool, 6, () => 0.5);
		const byTopic = new Map<string, number>();
		for (const q of sampled) {
			byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
		}
		const counts = [...byTopic.values()];
		expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
	});

	it('caps at pool size', () => {
		const sampled = sampleBalancedQuestions(pool, 100, () => 0.3);
		expect(sampled).toHaveLength(pool.length);
	});

	it('returns empty for empty pool', () => {
		expect(sampleBalancedQuestions([], 5)).toEqual([]);
	});
});

describe('parseMcqCsv', () => {
	it('maps a valid textbook-style row', () => {
		const row = mapMcqRow({
			topic: 'Chapter 1 Managers and You in the Workplace',
			stem: "In today's workplace, ________.",
			option_a: 'women are more likely than men to be promoted into management',
			option_b: 'many employees perform work that in the past was considered managerial activities',
			option_c: 'women tend to be more effective supervisors than men',
			option_d: 'most organizations have eliminated the title of manager',
			correct_option: 'B',
			difficulty: '2',
			aacsb: 'Reflective thinking',
			learning_objective: 'LO 1.1: Describe who managers are and where they work.',
			classification: 'Concept',
		});
		expect(row._missing).toEqual([]);
		expect(row.correctOption).toBe('B');
		expect(row.difficulty).toBe(2);
		expect(row.classification).toBe('Concept');
		expect(row.subjectId).toBeNull();
	});

	it('reports missing required fields', () => {
		const { questions, errors } = parseMcqCsvRows([
			{
				topic: '',
				stem: 'Q?',
				option_a: 'A',
				option_b: 'B',
				option_c: 'C',
				option_d: 'D',
				correct_option: 'A',
			},
		]);
		expect(questions).toHaveLength(0);
		expect(errors[0]?.missing).toContain('topic');
	});

	it('rejects invalid correct_option', () => {
		const row = mapMcqRow({
			topic: 'T',
			stem: 'Q?',
			option_a: 'A',
			option_b: 'B',
			option_c: 'C',
			option_d: 'D',
			correct_option: 'E',
		});
		expect(row._missing).toContain('correct_option');
	});

	it('parses SAMPLE_MCQ_CSV including True/False row', () => {
		const { questions, errors } = parseMcqCsvText(SAMPLE_MCQ_CSV);
		expect(errors).toHaveLength(0);
		expect(questions.length).toBeGreaterThanOrEqual(3);
		expect(questions[0]?.correctOption).toBe('B');
		const tf = questions.find((q) => q.optionA === 'True' && q.optionB === 'False');
		expect(tf).toBeDefined();
		expect(tf?.optionC).toBe('');
		expect(tf?.optionD).toBe('');
		expect(tf?.correctOption).toBe('A');
	});

	it('accepts 2-option True/False rows', () => {
		const row = mapMcqRow({
			topic: 'Ch1',
			stem: 'Managers only work in for-profit orgs.',
			option_a: 'True',
			option_b: 'False',
			option_c: '',
			option_d: '',
			correct_option: 'B',
		});
		expect(row._missing).toEqual([]);
		expect(row.correctOption).toBe('B');
		expect(row.optionC).toBe('');
		expect(row.optionD).toBe('');
	});

	it('rejects True/False with correct_option=C when option_c is empty', () => {
		const row = mapMcqRow({
			topic: 'Ch1',
			stem: 'T/F?',
			option_a: 'True',
			option_b: 'False',
			option_c: '',
			option_d: '',
			correct_option: 'C',
		});
		expect(row._missing).toContain('option_c');
		expect(row._message).toMatch(/correct_option=C/i);
	});

	it('still accepts normal 4-option MCQ', () => {
		const row = mapMcqRow({
			topic: 'T',
			stem: 'Q?',
			option_a: 'A',
			option_b: 'B',
			option_c: 'C',
			option_d: 'D',
			correct_option: 'C',
		});
		expect(row._missing).toEqual([]);
		expect(row.correctOption).toBe('C');
	});

	it('defaults difficulty to 2 when blank', () => {
		const row = mapMcqRow({
			topic: 'T',
			stem: 'Q?',
			option_a: 'A',
			option_b: 'B',
			option_c: 'C',
			option_d: 'D',
			correct_option: 'A',
			difficulty: '',
		});
		expect(row.difficulty).toBe(2);
		expect(row._missing).toEqual([]);
	});
});
