import type { LearningExperienceAccessMode, TeachingEnrollmentStatus } from '../types';

export const ROSTER_PROFILE_FIELDS = [
	'familyName',
	'givenName',
	'dateOfBirth',
	'homeClassCode',
	'majorName',
	'phone',
	'email',
] as const;

export type RosterProfileField = (typeof ROSTER_PROFILE_FIELDS)[number];

export type RosterRowStatus = 'new' | 'exact' | 'fill_blank' | 'conflict' | 'invalid';

export type RosterFieldDecision = 'keep' | 'use_new';

export type RawTeachingStudentInput = {
	sourceRow?: number;
	orderNo?: number | string | null;
	studentCode?: string | null;
	familyName?: string | null;
	givenName?: string | null;
	homeClassCode?: string | null;
	majorName?: string | null;
	dateOfBirth?: string | null;
	phone?: string | null;
	email?: string | null;
	tutorialCode?: string | null;
	tutorialClassId?: string | null;
	enrolledFromWeek?: number | string | null;
};

export interface NormalizedTeachingStudentInput {
	sourceRow: number;
	orderNo: number | null;
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	majorName: string;
	dateOfBirth: string | null;
	phone: string | null;
	email: string | null;
	tutorialCode: string | null;
	tutorialClassId: string | null;
	enrolledFromWeek: number | null;
	fieldErrors: Partial<Record<RosterPreviewField, string>>;
}

export type RosterPreviewField =
	| RosterProfileField
	| 'studentCode'
	| 'orderNo'
	| 'tutorialCode'
	| 'enrolledFromWeek';

export interface RosterFieldConflict {
	field: RosterProfileField;
	current: string | null;
	incoming: string | null;
}

export type RosterConflictResolution = Partial<Record<RosterProfileField, RosterFieldDecision>>;

export interface RosterExistingSnapshot {
	studentId: string;
	updatedAt: string;
	studentCode: string;
	familyName: string;
	givenName: string;
	dateOfBirth: string | null;
	homeClassCode: string;
	majorName: string;
	phone: string | null;
	email: string | null;
	enrollmentId: string | null;
	enrollmentStatus: TeachingEnrollmentStatus | null;
}

export interface RosterImportPreviewRow {
	key: string;
	status: RosterRowStatus;
	input: NormalizedTeachingStudentInput;
	existing: RosterExistingSnapshot | null;
	conflicts: RosterFieldConflict[];
	fillBlankFields: RosterProfileField[];
	accessMode: LearningExperienceAccessMode;
	resolution: RosterConflictResolution;
}

export interface RosterImportPreviewSummary {
	total: number;
	newCount: number;
	exactCount: number;
	fillBlankCount: number;
	conflictCount: number;
	invalidCount: number;
	openAccessCount: number;
}

export interface RosterImportPreview {
	metadata: {
		courseName: string;
		courseCode: string;
		lecturerName: string;
		lecturerCode: string;
		credits: number | null;
		groupNo: string;
		term: string;
	} | null;
	existingClassId: string | null;
	rows: RosterImportPreviewRow[];
	summary: RosterImportPreviewSummary;
}

export interface RosterImportCommitRow {
	key: string;
	input: RawTeachingStudentInput;
	resolution?: RosterConflictResolution;
	expectedUpdatedAt?: string | null;
}

export interface RosterImportCommitResult {
	classId: string;
	addedCount: number;
	reactivatedCount: number;
	filledCount: number;
	updatedCount: number;
	skippedCount: number;
	errorCount: number;
}

function profileValue(
	source: Pick<NormalizedTeachingStudentInput, RosterProfileField> | RosterExistingSnapshot,
	field: RosterProfileField,
): string | null {
	const value = source[field];
	if (value == null) return null;
	const text = String(value).trim();
	return text ? text : null;
}

export function compareRosterProfiles(
	incoming: NormalizedTeachingStudentInput,
	existing: RosterExistingSnapshot,
): { conflicts: RosterFieldConflict[]; fillBlankFields: RosterProfileField[] } {
	const conflicts: RosterFieldConflict[] = [];
	const fillBlankFields: RosterProfileField[] = [];
	for (const field of ROSTER_PROFILE_FIELDS) {
		const next = profileValue(incoming, field);
		const current = profileValue(existing, field);
		if (!next) continue;
		if (!current) {
			fillBlankFields.push(field);
			continue;
		}
		if (current !== next) {
			conflicts.push({ field, current, incoming: next });
		}
	}
	return { conflicts, fillBlankFields };
}

export function classifyRosterRow(
	input: NormalizedTeachingStudentInput,
	existing: RosterExistingSnapshot | null,
): Pick<RosterImportPreviewRow, 'status' | 'conflicts' | 'fillBlankFields' | 'accessMode'> {
	const accessMode = input.dateOfBirth ? 'DOB_PASSWORD' : 'OPEN';
	if (Object.keys(input.fieldErrors).length > 0) {
		return { status: 'invalid', conflicts: [], fillBlankFields: [], accessMode };
	}
	if (!existing) {
		return { status: 'new', conflicts: [], fillBlankFields: [], accessMode };
	}
	const { conflicts, fillBlankFields } = compareRosterProfiles(input, existing);
	if (conflicts.length > 0) {
		return { status: 'conflict', conflicts, fillBlankFields, accessMode };
	}
	if (
		existing.enrollmentId &&
		existing.enrollmentStatus === 'ACTIVE' &&
		fillBlankFields.length === 0
	) {
		return { status: 'exact', conflicts, fillBlankFields, accessMode };
	}
	if (fillBlankFields.length > 0) {
		return { status: 'fill_blank', conflicts, fillBlankFields, accessMode };
	}
	return { status: 'new', conflicts, fillBlankFields, accessMode };
}

export function summarizeRosterPreview(rows: RosterImportPreviewRow[]): RosterImportPreviewSummary {
	return {
		total: rows.length,
		newCount: rows.filter((row) => row.status === 'new').length,
		exactCount: rows.filter((row) => row.status === 'exact').length,
		fillBlankCount: rows.filter((row) => row.status === 'fill_blank').length,
		conflictCount: rows.filter((row) => row.status === 'conflict').length,
		invalidCount: rows.filter((row) => row.status === 'invalid').length,
		openAccessCount: rows.filter((row) => row.accessMode === 'OPEN').length,
	};
}

export function defaultConflictResolution(
	conflicts: RosterFieldConflict[],
): RosterConflictResolution {
	return Object.fromEntries(
		conflicts.map((conflict) => [conflict.field, 'keep']),
	) as RosterConflictResolution;
}

export function applyConflictResolution(
	incoming: Pick<NormalizedTeachingStudentInput, RosterProfileField>,
	existing: RosterExistingSnapshot,
	resolution: RosterConflictResolution,
	fillBlankFields: RosterProfileField[],
): Pick<NormalizedTeachingStudentInput, RosterProfileField> {
	const next = {
		familyName: existing.familyName,
		givenName: existing.givenName,
		dateOfBirth: existing.dateOfBirth,
		homeClassCode: existing.homeClassCode,
		majorName: existing.majorName,
		phone: existing.phone,
		email: existing.email,
	};
	for (const field of fillBlankFields) {
		const incomingValue = incoming[field];
		if (incomingValue) next[field] = incomingValue as never;
	}
	for (const field of ROSTER_PROFILE_FIELDS) {
		if (resolution[field] === 'use_new') {
			next[field] = incoming[field] as never;
		}
	}
	return next;
}

export function rosterPreviewCanCommit(rows: RosterImportPreviewRow[]): boolean {
	return (
		rows.length > 0 && rows.every((row) => row.status !== 'invalid' && row.status !== 'conflict')
	);
}
