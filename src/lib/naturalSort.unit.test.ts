import { describe, expect, it } from 'vitest';

import { compareNaturalText } from './naturalSort';

describe('compareNaturalText', () => {
	it('sorts embedded numbers by their numeric value', () => {
		const labels = ['Lecture 10', 'Lecture 2', 'Lecture 9', 'Lecture 1'];

		expect(labels.sort(compareNaturalText)).toEqual([
			'Lecture 1',
			'Lecture 2',
			'Lecture 9',
			'Lecture 10',
		]);
	});

	it('treats padded and unpadded numbers as equivalent', () => {
		expect(compareNaturalText('Lecture 1', 'Lecture 01')).toBe(0);
	});
});
