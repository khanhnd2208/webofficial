import { describe, expect, it } from 'vitest';

import { parseDelimitedTable } from './parseDelimited';
import { parseStudentListFromRows } from './parseStudentList';
import { rosterCsvTemplateBody, rosterPasteSample } from './rosterCsvTemplate';
import {
	enforceRowLimit,
	markBatchDuplicates,
	normalizeRawStudentInput,
} from './normalizeStudentRow';

describe('delimited roster parsing', () => {
	it('parses the UTF-8 BOM CSV template including leading zeros and blank dates', () => {
		const rows = parseDelimitedTable(rosterCsvTemplateBody());
		const parsed = parseStudentListFromRows(rows);
		expect(parsed.students).toHaveLength(2);
		expect(parsed.students[0]).toMatchObject({
			studentCode: '2406090045',
			phone: '0901234567',
			dateOfBirth: '2006-05-29',
			tutorialCode: 'T01',
			ok: true,
		});
		expect(parsed.students[1]?.dateOfBirth).toBeNull();
		expect(parsed.students[1]?.phone).toBe('0987654321');
	});

	it('parses tab-separated paste data and Vietnamese header aliases', () => {
		const parsed = parseStudentListFromRows(parseDelimitedTable(rosterPasteSample()));
		expect(parsed.students[0]?.familyName).toBe('Chu Khải Linh');
		expect(parsed.students[1]?.ok).toBe(true);
	});

	it('parses semicolon CSV and quoted cells with newlines', () => {
		const text = `STT;Mã SV;Họ lót;Tên;Email\n1;SV01;"Nguyễn; An";"Tên\nHai";"a@example.com"`;
		const parsed = parseStudentListFromRows(parseDelimitedTable(text));
		expect(parsed.students[0]).toMatchObject({
			studentCode: 'SV01',
			familyName: 'Nguyễn; An',
			givenName: 'Tên Hai',
			email: 'a@example.com',
		});
	});

	it('keeps blank rows from inflating the 500-row limit and flags overflow', () => {
		const rows = Array.from({ length: 501 }, (_, index) =>
			normalizeRawStudentInput({
				sourceRow: index + 2,
				studentCode: `SV${String(index + 1).padStart(3, '0')}`,
				familyName: 'Họ',
				givenName: 'Tên',
			}),
		);
		expect(enforceRowLimit(rows).at(-1)?.fieldErrors.studentCode).toMatch(/500/);
	});

	it('detects duplicate codes after normalization', () => {
		const rows = markBatchDuplicates([
			normalizeRawStudentInput({
				sourceRow: 2,
				studentCode: 'sv01',
				familyName: 'A',
				givenName: 'B',
			}),
			normalizeRawStudentInput({
				sourceRow: 3,
				studentCode: ' SV01 ',
				familyName: 'C',
				givenName: 'D',
			}),
		]);
		expect(rows[1]?.fieldErrors.studentCode).toMatch(/trùng/i);
	});
});
