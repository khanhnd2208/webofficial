import { describe, expect, it } from 'vitest';

import { maskStudentCode } from './privacy';

describe('maskStudentCode', () => {
	it('keeps the last two characters of a typical student code', () => {
		expect(maskStudentCode('2406090045')).toBe('********45');
	});

	it('handles short codes without exposing the full value', () => {
		expect(maskStudentCode('A')).toBe('*');
		expect(maskStudentCode('AB')).toBe('*B');
		expect(maskStudentCode('')).toBe('');
	});
});
