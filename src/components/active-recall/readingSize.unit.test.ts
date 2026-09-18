import { describe, expect, it } from 'vitest';

import { DEFAULT_READING_SIZE, parseReadingSize } from './readingSize';

describe('parseReadingSize', () => {
	it('accepts known sizes, maps leftover medium, and otherwise returns large', () => {
		expect(parseReadingSize('small')).toBe('small');
		expect(parseReadingSize('large')).toBe('large');
		expect(parseReadingSize('medium')).toBe('large');
		expect(parseReadingSize('huge')).toBe(DEFAULT_READING_SIZE);
		expect(parseReadingSize(null)).toBe(DEFAULT_READING_SIZE);
		expect(parseReadingSize(undefined)).toBe(DEFAULT_READING_SIZE);
	});
});
