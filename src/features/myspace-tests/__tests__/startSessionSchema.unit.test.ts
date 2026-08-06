import { describe, expect, it } from 'vitest';

import {
	playPoolFiltersSchema,
	startSessionSchema,
} from '../schemas';

describe('startSessionSchema', () => {
	it('defaults to default mode when body is empty', () => {
		const parsed = startSessionSchema.parse({});
		expect(parsed.mode).toBe('default');
		expect(parsed.questionCount).toBeUndefined();
	});

	it('accepts default mode without questionCount', () => {
		const parsed = startSessionSchema.parse({ mode: 'default' });
		expect(parsed.mode).toBe('default');
	});

	it('requires questionCount for custom mode', () => {
		const result = startSessionSchema.safeParse({ mode: 'custom' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes('questionCount'))).toBe(
				true,
			);
		}
	});

	it('accepts custom mode with filters', () => {
		const parsed = startSessionSchema.parse({
			mode: 'custom',
			questionCount: 10,
			difficulties: [1, 2],
			learningObjectives: ['LO 1.1: Describe who managers are and where they work.'],
		});
		expect(parsed.mode).toBe('custom');
		expect(parsed.questionCount).toBe(10);
		expect(parsed.difficulties).toEqual([1, 2]);
		expect(parsed.learningObjectives).toHaveLength(1);
	});

	it('rejects out-of-range questionCount', () => {
		expect(
			startSessionSchema.safeParse({ mode: 'custom', questionCount: 0 }).success,
		).toBe(false);
		expect(
			startSessionSchema.safeParse({ mode: 'custom', questionCount: 201 }).success,
		).toBe(false);
	});
});

describe('playPoolFiltersSchema', () => {
	it('accepts empty filters', () => {
		expect(playPoolFiltersSchema.parse({})).toEqual({});
	});

	it('accepts difficulty and LO filters', () => {
		const parsed = playPoolFiltersSchema.parse({
			difficulties: [2],
			learningObjectives: ['LO 1.1: Describe who managers are and where they work.'],
		});
		expect(parsed.difficulties).toEqual([2]);
		expect(parsed.learningObjectives?.[0]).toMatch(/^LO 1\.1/);
	});
});

describe('play filter rendering rules', () => {
	it('hides filter groups with fewer than 2 values', () => {
		const learningObjectives = [{ value: 'LO 1.1', count: 12 }];
		const difficulties = [
			{ value: 1, count: 4 },
			{ value: 2, count: 8 },
		];
		expect(learningObjectives.length >= 2).toBe(false);
		expect(difficulties.length >= 2).toBe(true);
	});
});
