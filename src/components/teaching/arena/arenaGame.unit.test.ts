import { describe, expect, it } from 'vitest';

import { displayNames } from './arenaGame';

const student = (
	enrollmentId: string,
	familyName: string,
	givenName: string,
	studentCode = '',
) => ({
	enrollmentId,
	familyName,
	givenName,
	studentCode: studentCode || `SV${enrollmentId}`,
});

describe('displayNames', () => {
	it('uses the given name when it is unique', () => {
		const names = displayNames([
			student('a', 'Nguyễn Văn', 'An'),
			student('b', 'Trần Thị', 'Bình'),
		]);
		expect(names.get('a')).toBe('An');
		expect(names.get('b')).toBe('Bình');
	});

	it('adds the middle name only for students who share a given name', () => {
		const names = displayNames([
			student('a', 'Nguyễn Thùy', 'Linh'),
			student('b', 'Trần Khánh', 'Linh'),
			student('c', 'Lê Văn', 'Nam'),
		]);
		expect(names.get('a')).toBe('Thùy Linh');
		expect(names.get('b')).toBe('Khánh Linh');
		expect(names.get('c')).toBe('Nam');
	});

	it('falls back to the full name, then the end of the student code', () => {
		const names = displayNames([
			student('a', 'Nguyễn Thùy', 'Linh'),
			student('b', 'Trần Thùy', 'Linh'),
			student('c', 'Trần Thùy', 'Linh', '22100123'),
			student('d', 'Trần Thùy', 'Linh', '22100456'),
		]);
		expect(names.get('a')).toBe('Nguyễn Thùy Linh');
		expect(names.get('b')).toBe('Trần Thùy Linh · SVb');
		expect(names.get('c')).toBe('Trần Thùy Linh · 123');
		expect(names.get('d')).toBe('Trần Thùy Linh · 456');
	});
});
