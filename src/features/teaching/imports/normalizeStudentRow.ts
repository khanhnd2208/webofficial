import {
	ROSTER_IMPORT_MAX_ROWS,
	normalizeEmail,
	normalizePersonName,
	normalizePhone,
	normalizeStudentCode,
	normalizeUnicode,
	parseDateOfBirth,
	validateEmail,
} from '../domain/studentIdentity';
import type {
	NormalizedTeachingStudentInput,
	RawTeachingStudentInput,
	RosterPreviewField,
} from '../domain/rosterImport';
import type { ParsedStudentRow } from './parseStudentList';

export type { RawTeachingStudentInput };

const TUTORIAL_CODE_MAX = 20;

export function emptyNormalizedStudent(
	overrides: Partial<NormalizedTeachingStudentInput> = {},
): NormalizedTeachingStudentInput {
	return {
		sourceRow: 1,
		orderNo: null,
		studentCode: '',
		familyName: '',
		givenName: '',
		homeClassCode: '',
		majorName: '',
		dateOfBirth: null,
		phone: null,
		email: null,
		tutorialCode: null,
		tutorialClassId: null,
		enrolledFromWeek: null,
		fieldErrors: {},
		...overrides,
	};
}

export function normalizeRawStudentInput(
	raw: RawTeachingStudentInput,
	options: {
		knownTutorialCodes?: Set<string>;
		knownTutorialIds?: Set<string>;
		maxWeek?: number;
		now?: Date;
	} = {},
): NormalizedTeachingStudentInput {
	const fieldErrors: Partial<Record<RosterPreviewField, string>> = {};
	const studentCode = normalizeStudentCode(raw.studentCode ?? '');
	const familyName = normalizePersonName(raw.familyName ?? '');
	const givenName = normalizePersonName(raw.givenName ?? '');
	const homeClassCode = normalizeUnicode(raw.homeClassCode ?? '');
	const majorName = normalizeUnicode(raw.majorName ?? '');
	const phoneValue = normalizePhone(raw.phone ?? '');
	const emailValue = normalizeEmail(raw.email ?? '');
	const tutorialCode = normalizeStudentCode(raw.tutorialCode ?? '');
	const tutorialClassId = normalizeUnicode(raw.tutorialClassId ?? '');
	const dobText = normalizeUnicode(raw.dateOfBirth ?? '');
	const parsedDob = dobText
		? parseDateOfBirth(dobText, options.now)
		: { iso: null as string | null };

	if (!studentCode) fieldErrors.studentCode = 'Mã sinh viên là bắt buộc';
	else if (studentCode.length > 40) fieldErrors.studentCode = 'Mã sinh viên tối đa 40 ký tự';
	if (!familyName) fieldErrors.familyName = 'Họ lót là bắt buộc';
	else if (familyName.length > 120) fieldErrors.familyName = 'Họ lót tối đa 120 ký tự';
	if (!givenName) fieldErrors.givenName = 'Tên là bắt buộc';
	else if (givenName.length > 80) fieldErrors.givenName = 'Tên tối đa 80 ký tự';
	if (homeClassCode.length > 40) fieldErrors.homeClassCode = 'Mã lớp tối đa 40 ký tự';
	if (majorName.length > 160) fieldErrors.majorName = 'Tên ngành tối đa 160 ký tự';
	if (phoneValue.length > 40) fieldErrors.phone = 'Số điện thoại tối đa 40 ký tự';
	if (parsedDob.error) fieldErrors.dateOfBirth = parsedDob.error;
	const emailError = validateEmail(emailValue);
	if (emailError) fieldErrors.email = emailError;

	let orderNo: number | null = null;
	if (raw.orderNo != null && String(raw.orderNo).trim() !== '') {
		const parsed = Number.parseInt(String(raw.orderNo), 10);
		if (!Number.isInteger(parsed) || parsed < 1)
			fieldErrors.orderNo = 'STT phải là số nguyên dương';
		else orderNo = parsed;
	}

	let enrolledFromWeek: number | null = null;
	if (raw.enrolledFromWeek != null && String(raw.enrolledFromWeek).trim() !== '') {
		const parsed = Number.parseInt(String(raw.enrolledFromWeek), 10);
		const maxWeek = options.maxWeek ?? 40;
		if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxWeek) {
			fieldErrors.enrolledFromWeek = `Học từ tuần phải từ 1 đến ${maxWeek}`;
		} else enrolledFromWeek = parsed;
	}

	if (tutorialCode && tutorialCode.length > TUTORIAL_CODE_MAX) {
		fieldErrors.tutorialCode = 'Mã tutorial tối đa 20 ký tự';
	} else if (
		tutorialCode &&
		options.knownTutorialCodes &&
		!options.knownTutorialCodes.has(tutorialCode)
	) {
		fieldErrors.tutorialCode = 'Tutorial không tồn tại trong lớp';
	}
	if (
		tutorialClassId &&
		options.knownTutorialIds &&
		!options.knownTutorialIds.has(tutorialClassId)
	) {
		fieldErrors.tutorialCode = 'Tutorial không tồn tại trong lớp';
	}

	return {
		sourceRow: raw.sourceRow ?? 1,
		orderNo,
		studentCode,
		familyName,
		givenName,
		homeClassCode,
		majorName,
		dateOfBirth: parsedDob.iso,
		phone: phoneValue || null,
		email: emailValue || null,
		tutorialCode: tutorialCode || null,
		tutorialClassId: tutorialClassId || null,
		enrolledFromWeek,
		fieldErrors,
	};
}

export function markBatchDuplicates(
	rows: NormalizedTeachingStudentInput[],
): NormalizedTeachingStudentInput[] {
	const seen = new Map<string, number>();
	const orderSeen = new Map<number, number>();
	return rows.map((row) => {
		const fieldErrors = { ...row.fieldErrors };
		if (row.studentCode) {
			const previous = seen.get(row.studentCode);
			if (previous != null) {
				fieldErrors.studentCode = `Mã SV trùng trong file (dòng ${previous})`;
			} else {
				seen.set(row.studentCode, row.sourceRow);
			}
		}
		if (row.orderNo != null) {
			const previous = orderSeen.get(row.orderNo);
			if (previous != null) fieldErrors.orderNo = `STT trùng với dòng ${previous}`;
			else orderSeen.set(row.orderNo, row.sourceRow);
		}
		return { ...row, fieldErrors };
	});
}

export function enforceRowLimit(
	rows: NormalizedTeachingStudentInput[],
): NormalizedTeachingStudentInput[] {
	if (rows.length <= ROSTER_IMPORT_MAX_ROWS) return rows;
	return rows.slice(0, ROSTER_IMPORT_MAX_ROWS).concat(
		rows.slice(ROSTER_IMPORT_MAX_ROWS).map((row) => ({
			...row,
			fieldErrors: {
				...row.fieldErrors,
				studentCode: `Vượt quá giới hạn ${ROSTER_IMPORT_MAX_ROWS} dòng`,
			},
		})),
	);
}

export function parsedRowToNormalized(
	row: ParsedStudentRow,
	sourceRow: number,
	options?: Parameters<typeof normalizeRawStudentInput>[1],
): NormalizedTeachingStudentInput {
	return normalizeRawStudentInput(
		{
			sourceRow,
			orderNo: row.orderNo,
			studentCode: row.studentCode,
			familyName: row.familyName,
			givenName: row.givenName,
			homeClassCode: row.homeClassCode,
			majorName: row.majorName,
			dateOfBirth: row.dateOfBirth,
			phone: row.phone,
			email: row.email,
			tutorialCode: row.tutorialCode,
			enrolledFromWeek: row.enrolledFromWeek,
		},
		options,
	);
}
