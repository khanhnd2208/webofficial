import { describe, expect, it } from 'vitest';

import { formatStudentCode, maskStudentCode } from './privacy';

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

describe('formatStudentCode', () => {
	it('shortens a masked code for display', () => {
		expect(formatStudentCode('********45')).toBe('•••45');
	});

	it('leaves unmasked and barely masked codes as they are', () => {
		expect(formatStudentCode('2406090045')).toBe('2406090045');
		expect(formatStudentCode('*B')).toBe('*B');
	});
});
