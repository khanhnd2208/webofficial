import { describe, expect, it } from 'vitest';

import { bossName, displayNames, passStreak, type ArenaHistoryEntry } from './arenaGame';

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

describe('passStreak', () => {
	const entry = (result: ArenaHistoryEntry['result']): ArenaHistoryEntry => ({
		id: result,
		at: 0,
		enrollmentId: 'a',
		name: 'An',
		cardId: null,
		result,
	});

	it('counts correct answers since the last miss and ignores skipped students', () => {
		expect(passStreak([])).toBe(0);
		expect(passStreak(['pass', 'fail', 'pass', 'skip', 'pass'].map((r) => entry(r as never)))).toBe(
			2,
		);
		expect(passStreak(['pass', 'pass', 'fail'].map((r) => entry(r as never)))).toBe(0);
	});
});

describe('bossName', () => {
	it('gives each round a name and cycles when the list runs out', () => {
		expect(bossName(1)).toBe('Chúa Tể Quên Bài');
		expect(bossName(2)).not.toBe(bossName(1));
		expect(bossName(7)).toBe(bossName(1));
	});
});
