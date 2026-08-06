import { describe, expect, it } from 'vitest';

import { isValidPlayerName, normalizePlayerName } from './playerName';

describe('normalizePlayerName', () => {
	it('trims and collapses whitespace', () => {
		expect(normalizePlayerName('  Alice   Bob  ')).toBe('Alice Bob');
	});

	it('rejects empty after normalize', () => {
		expect(isValidPlayerName('   ')).toBe(false);
		expect(isValidPlayerName('Alice')).toBe(true);
	});
});
