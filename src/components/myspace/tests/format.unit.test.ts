import { describe, expect, it } from 'vitest';

import { formatDifficulty } from './format';

describe('formatDifficulty', () => {
	it('maps stored difficulty levels to learner-facing labels', () => {
		expect(formatDifficulty(1)).toBe('Dễ');
		expect(formatDifficulty(2)).toBe('Trung bình');
		expect(formatDifficulty(3)).toBe('Khó');
	});
});
