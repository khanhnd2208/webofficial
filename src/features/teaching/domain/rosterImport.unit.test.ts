import { describe, expect, it } from 'vitest';

import {
	applyConflictResolution,
	classifyRosterRow,
	defaultConflictResolution,
	rosterPreviewCanCommit,
	summarizeRosterPreview,
	type NormalizedTeachingStudentInput,
	type RosterExistingSnapshot,
	type RosterImportPreviewRow,
} from './rosterImport';

function input(
	overrides: Partial<NormalizedTeachingStudentInput> = {},
): NormalizedTeachingStudentInput {
	return {
		sourceRow: 2,
		orderNo: 1,
		studentCode: 'SV01',
		familyName: 'Nguyễn',
		givenName: 'An',
		homeClassCode: 'K66A',
		majorName: 'Quản trị nhân lực',
		dateOfBirth: '2006-05-29',
		phone: '0901234567',
		email: 'sv01@example.edu',
		tutorialCode: null,
		tutorialClassId: null,
		enrolledFromWeek: 1,
		fieldErrors: {},
		...overrides,
	};
}

function existing(overrides: Partial<RosterExistingSnapshot> = {}): RosterExistingSnapshot {
	return {
		studentId: 'st1',
		updatedAt: '2026-09-01T00:00:00.000Z',
		studentCode: 'SV01',
		familyName: 'Nguyễn',
		givenName: 'An',
		dateOfBirth: '2006-05-29',
		homeClassCode: 'K66A',
		majorName: 'Quản trị nhân lực',
		phone: '0901234567',
		email: 'sv01@example.edu',
		enrollmentId: 'en1',
		enrollmentStatus: 'ACTIVE',
		...overrides,
	};
}

describe('roster import classification', () => {
	it('marks brand new students and open-access rows', () => {
		expect(classifyRosterRow(input({ dateOfBirth: null }), null)).toMatchObject({
			status: 'new',
			accessMode: 'OPEN',
		});
	});

	it('skips exact matches already on the roster', () => {
		expect(classifyRosterRow(input(), existing()).status).toBe('exact');
	});

	it('fills blank profile fields without treating them as conflicts', () => {
		expect(
			classifyRosterRow(input(), existing({ dateOfBirth: null, phone: null, email: null })),
		).toMatchObject({
			status: 'fill_blank',
			fillBlankFields: ['dateOfBirth', 'phone', 'email'],
		});
	});

	it('requires a per-field decision when stored values differ', () => {
		const classified = classifyRosterRow(
			input({ familyName: 'Trần', email: 'new@example.edu' }),
			existing(),
		);
		expect(classified.status).toBe('conflict');
		expect(classified.conflicts.map((item) => item.field)).toEqual(['familyName', 'email']);
		expect(defaultConflictResolution(classified.conflicts)).toEqual({
			familyName: 'keep',
			email: 'keep',
		});
	});

	it('applies keep/use_new without a bulk overwrite default', () => {
		const next = applyConflictResolution(
			input({ familyName: 'Trần', email: 'new@example.edu', phone: '0911111111' }),
			existing({ phone: null }),
			{ familyName: 'keep', email: 'use_new' },
			['phone'],
		);
		expect(next).toMatchObject({
			familyName: 'Nguyễn',
			email: 'new@example.edu',
			phone: '0911111111',
		});
	});

	it('blocks commit while invalid or unresolved conflict rows remain', () => {
		const rows = [{ status: 'new' }, { status: 'conflict' }] as RosterImportPreviewRow[];
		expect(rosterPreviewCanCommit(rows)).toBe(false);
		expect(
			summarizeRosterPreview([{ status: 'new', accessMode: 'OPEN' }] as RosterImportPreviewRow[])
				.openAccessCount,
		).toBe(1);
	});
});
