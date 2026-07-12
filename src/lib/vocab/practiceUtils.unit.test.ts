import { describe, it, expect } from 'vitest';

import { shuffleArray, formatAccuracy } from '@/lib/vocab/practiceUtils';

describe('shuffleArray', () => {
	it('returns a new array without mutating the original', () => {
		const original = [1, 2, 3, 4, 5];
		const shuffled = shuffleArray(original);
		expect(shuffled).toHaveLength(original.length);
		expect(original).toEqual([1, 2, 3, 4, 5]);
	});

	it('contains the same elements', () => {
		const original = ['a', 'b', 'c'];
		const shuffled = shuffleArray(original);
		expect(shuffled.sort()).toEqual(original.sort());
	});
});

describe('formatAccuracy', () => {
	it('returns 0% when total is 0', () => {
		expect(formatAccuracy(0, 0)).toBe('0%');
	});

	it('rounds to nearest integer percentage', () => {
		expect(formatAccuracy(3, 4)).toBe('75%');
		expect(formatAccuracy(1, 3)).toBe('33%');
	});
});
