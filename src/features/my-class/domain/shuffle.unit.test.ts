import { describe, expect, it } from 'vitest';

import { hashSeed, positionLabel, seededShuffle } from './shuffle';

describe('seededShuffle', () => {
	it('is stable for the same seed and differs across seeds', () => {
		const items = ['q1', 'q2', 'q3', 'q4', 'q5'];
		expect(seededShuffle(items, 'play-a')).toEqual(seededShuffle(items, 'play-a'));
		expect(seededShuffle(items, 'play-a')).not.toEqual(seededShuffle(items, 'play-b'));
	});

	it('keeps every item exactly once', () => {
		const items = [1, 2, 3, 4];
		expect([...seededShuffle(items, 'x')].sort()).toEqual(items);
	});

	it('hashes seeds deterministically', () => {
		expect(hashSeed('same')).toBe(hashSeed('same'));
		expect(hashSeed('same')).not.toBe(hashSeed('other'));
	});

	it('labels shuffled options by display position', () => {
		expect(positionLabel(0)).toBe('A');
		expect(positionLabel(2)).toBe('C');
	});
});
