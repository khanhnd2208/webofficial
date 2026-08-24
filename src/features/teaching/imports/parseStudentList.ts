import { readSheet } from 'read-excel-file/node';

export interface ParsedStudentRow {
	orderNo: number;
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	majorName: string;
	dateOfBirth: string | null;
	phone: string | null;
	email: string | null;
	ok: boolean;
	errors: string[];
}

export interface ParsedClassMetadata {
	courseName: string;
	courseCode: string;
	lecturerName: string;
	lecturerCode: string;
	credits: number | null;
	groupNo: string;
	term: string;
}

export interface ParsedStudentList {
	metadata: ParsedClassMetadata;
	students: ParsedStudentRow[];
	headerRowIndex: number;
}

const HEADER_ALIASES: Record<
	string,
	keyof Pick<
		ParsedStudentRow,
		| 'orderNo'
		| 'studentCode'
		| 'familyName'
		| 'givenName'
		| 'homeClassCode'
		| 'majorName'
		| 'dateOfBirth'
		| 'phone'
		| 'email'
	>
> = {
	stt: 'orderNo',
	'ma sv': 'studentCode',
	'mã sv': 'studentCode',
	'ho lot': 'familyName',
	'họ lót': 'familyName',
	ten: 'givenName',
	tên: 'givenName',
	'ma lop': 'homeClassCode',
	'mã lớp': 'homeClassCode',
	'ten lop': 'majorName',
	'tên lớp': 'majorName',
	'ngay sinh': 'dateOfBirth',
	'ngày sinh': 'dateOfBirth',
	'dien thoai': 'phone',
	'điện thoại': 'phone',
	email: 'email',
};

function cellText(value: unknown): string {
	if (value == null) return '';
	if (value instanceof Date) {
		const dd = String(value.getDate()).padStart(2, '0');
		const mm = String(value.getMonth() + 1).padStart(2, '0');
		return `${dd}/${mm}/${value.getFullYear()}`;
	}
	return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeLabel(value: string): string {
	return value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseOrderNo(value: string, fallback: number): number {
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseCredits(value: string): number | null {
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDateOfBirth(value: string): { iso: string | null; error?: string } {
	if (!value) return { iso: null };
	const match = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
	if (!match) return { iso: null, error: 'Date of birth must be dd/MM/yyyy' };
	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return { iso: null, error: 'Date of birth is not a valid calendar date' };
	}
	return { iso: date.toISOString().slice(0, 10) };
}

function findHeaderRow(rows: unknown[][]): number {
	return rows.findIndex((row) => normalizeLabel(cellText(row[0])) === 'stt');
}

function labelValue(rows: unknown[][], label: string): string {
	const wanted = normalizeLabel(label);
	for (const row of rows) {
		for (let i = 0; i < row.length; i += 1) {
			if (normalizeLabel(cellText(row[i])) === wanted) {
				return cellText(row[i + 1]);
			}
		}
	}
	return '';
}

function termFromRows(rows: unknown[][]): string {
	for (const row of rows) {
		for (const cell of row) {
			const text = cellText(cell);
			if (/học kỳ/i.test(text) || /hoc ky/i.test(text)) return text.replace(/\s+/g, ' ').trim();
		}
	}
	return '';
}

function mapHeader(row: unknown[]): Array<keyof ParsedStudentRow | null> {
	return row.map((cell) => HEADER_ALIASES[normalizeLabel(cellText(cell))] ?? null);
}

export function parseStudentListFromRows(rows: unknown[][]): ParsedStudentList {
	const headerRowIndex = findHeaderRow(rows);
	if (headerRowIndex < 0) {
		throw new Error('Could not find the student list header row (STT).');
	}

	const columns = mapHeader(rows[headerRowIndex] ?? []);
	const studentCodeIndex = columns.indexOf('studentCode');
	if (studentCodeIndex < 0) {
		throw new Error('The student list is missing the student code column.');
	}

	const metadata: ParsedClassMetadata = {
		courseName:
			labelValue(rows.slice(0, headerRowIndex), 'Học phần') ||
			labelValue(rows.slice(0, headerRowIndex), 'Hoc phan'),
		courseCode:
			labelValue(rows.slice(0, headerRowIndex), 'Mã học phần') ||
			labelValue(rows.slice(0, headerRowIndex), 'Ma hoc phan'),
		lecturerName:
			labelValue(rows.slice(0, headerRowIndex), 'Tên giảng viên') ||
			labelValue(rows.slice(0, headerRowIndex), 'Ten giang vien'),
		lecturerCode:
			labelValue(rows.slice(0, headerRowIndex), 'Mã giảng viên') ||
			labelValue(rows.slice(0, headerRowIndex), 'Ma giang vien'),
		credits: parseCredits(
			labelValue(rows.slice(0, headerRowIndex), 'Số tín chỉ') ||
				labelValue(rows.slice(0, headerRowIndex), 'So tin chi'),
		),
		groupNo:
			labelValue(rows.slice(0, headerRowIndex), 'Nhóm tổ') ||
			labelValue(rows.slice(0, headerRowIndex), 'Nhom to'),
		term: termFromRows(rows.slice(0, headerRowIndex)),
	};

	const seen = new Map<string, number>();
	const students: ParsedStudentRow[] = [];

	for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
		const row = rows[i] ?? [];
		const studentCode = cellText(row[studentCodeIndex]);
		if (!studentCode && row.every((cell) => !cellText(cell))) continue;

		const values: ParsedStudentRow = {
			orderNo: students.length + 1,
			studentCode,
			familyName: '',
			givenName: '',
			homeClassCode: '',
			majorName: '',
			dateOfBirth: null,
			phone: null,
			email: null,
			ok: true,
			errors: [],
		};

		columns.forEach((key, index) => {
			if (!key) return;
			const text = cellText(row[index]);
			if (key === 'orderNo') values.orderNo = parseOrderNo(text, students.length + 1);
			else if (key === 'dateOfBirth') {
				const parsed = parseDateOfBirth(text);
				values.dateOfBirth = parsed.iso;
				if (parsed.error) values.errors.push(parsed.error);
			} else if (key === 'studentCode') values.studentCode = text;
			else if (key === 'phone') values.phone = text || null;
			else if (key === 'email') values.email = text || null;
			else if (key === 'familyName') values.familyName = text;
			else if (key === 'givenName') values.givenName = text;
			else if (key === 'homeClassCode') values.homeClassCode = text;
			else if (key === 'majorName') values.majorName = text;
		});

		if (!values.studentCode) values.errors.push('Student code is required');
		if (!values.familyName) values.errors.push('Family name is required');
		if (!values.givenName) values.errors.push('Given name is required');

		const previous = seen.get(values.studentCode);
		if (values.studentCode && previous != null) {
			values.errors.push(`Duplicate student code (first seen at row ${previous})`);
		} else if (values.studentCode) {
			seen.set(values.studentCode, i + 1);
		}

		values.ok = values.errors.length === 0;
		if (
			!values.studentCode &&
			values.errors.length === 1 &&
			values.errors[0] === 'Student code is required' &&
			!values.familyName &&
			!values.givenName
		) {
			continue;
		}
		students.push(values);
	}

	return { metadata, students, headerRowIndex };
}

export function parseStudentListWorkbook(rows: unknown[][]): ParsedStudentList {
	if (rows.length === 0) throw new Error('The workbook has no sheets.');
	return parseStudentListFromRows(rows);
}

export async function parseStudentListBuffer(
	buffer: Buffer | ArrayBuffer | Uint8Array,
): Promise<ParsedStudentList> {
	const input = Buffer.isBuffer(buffer)
		? buffer
		: Buffer.from(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);
	const rows = await readSheet(input);
	return parseStudentListWorkbook(rows);
}
