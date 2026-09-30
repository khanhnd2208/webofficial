import { describe, expect, it } from 'vitest';

import {
	canDeleteDeck,
	classIdentityMatches,
	collectTermSuggestions,
	isCustomizedSession,
	isEmptyClassScaffold,
	normalizeClassCode,
	normalizeTerm,
	summarizeClassDeleteBlockers,
	summarizeCourseArchiveBlockers,
	summarizeCourseDeleteBlockers,
} from './adminLifecycle';

describe('class identity normalization', () => {
	it('trims, collapses spaces and uppercases class codes', () => {
		expect(normalizeClassCode('  39-01  ')).toBe('39-01');
		expect(normalizeClassCode('hrm a1')).toBe('HRM A1');
		expect(normalizeClassCode('  38  02 ')).toBe('38 02');
	});

	it('trims and collapses term whitespace without rewriting historical labels', () => {
		expect(normalizeTerm('  HỌC KỲ 1  -  NĂM HỌC 2026 - 2027 ')).toBe(
			'HỌC KỲ 1 - NĂM HỌC 2026 - 2027',
		);
	});

	it('matches class identity after normalization', () => {
		expect(
			classIdentityMatches(
				{ classCode: 'lower', groupNo: 'lower', term: 'Audit  term' },
				{ classCode: 'LOWER', term: 'Audit term' },
			),
		).toBe(true);
		expect(
			classIdentityMatches(
				{ classCode: '39-01', groupNo: '39-01', term: 'HK1' },
				{ classCode: '39-02', term: 'HK1' },
			),
		).toBe(false);
	});

	it('collects unique term suggestions from existing values', () => {
		expect(
			collectTermSuggestions(['HK1', ' hk1 ', 'HỌC KỲ 2 - NĂM HỌC 2025 - 2026', '', '  ']),
		).toEqual(['HK1', 'HỌC KỲ 2 - NĂM HỌC 2025 - 2026']);
	});
});

describe('course lifecycle blockers', () => {
	it('blocks archive while active children remain', () => {
		expect(summarizeCourseArchiveBlockers({ activeClassCount: 2, activeDeckCount: 1 })).toEqual({
			activeClasses: 2,
			activeDecks: 1,
		});
		expect(summarizeCourseArchiveBlockers({ activeClassCount: 0, activeDeckCount: 0 })).toEqual({});
	});

	it('blocks permanent delete when any class or deck still exists', () => {
		expect(summarizeCourseDeleteBlockers({ classCount: 1, deckCount: 0 })).toEqual({ classes: 1 });
		expect(summarizeCourseDeleteBlockers({ classCount: 0, deckCount: 3 })).toEqual({ decks: 3 });
	});
});

describe('class scaffold detection', () => {
	const empty = {
		enrollmentCount: 0,
		attendanceCount: 0,
		participationCount: 0,
		configuredGroupCount: 0,
		noteCount: 0,
		publicLinkCount: 0,
		customizedSessionCount: 0,
		studentPageCount: 0,
		sharingCount: 0,
	};

	it('treats generated tutorials/sessions as empty when no user data exists', () => {
		expect(isEmptyClassScaffold(empty)).toBe(true);
		expect(
			isCustomizedSession({
				heldOn: null,
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: null,
				participationTakenAt: null,
			}),
		).toBe(false);
	});

	it('counts customized sessions, students and public resources as blockers', () => {
		expect(
			summarizeClassDeleteBlockers({
				...empty,
				enrollmentCount: 2,
				customizedSessionCount: 1,
				publicLinkCount: 1,
			}),
		).toEqual({
			students: 2,
			publicLinks: 1,
			customizedSessions: 1,
		});
		expect(
			isCustomizedSession({
				heldOn: '2026-09-01',
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: null,
				participationTakenAt: null,
			}),
		).toBe(true);
	});

	it('treats authored student-page content and sharing as delete blockers', () => {
		expect(
			summarizeClassDeleteBlockers({
				...empty,
				studentPageCount: 1,
				sharingCount: 1,
			}),
		).toEqual({
			studentPage: 1,
			sharing: 1,
		});
		expect(isEmptyClassScaffold({ ...empty, studentPageCount: 1 })).toBe(false);
	});
});

describe('deck delete rules', () => {
	it('allows permanent delete only for empty unlinked decks', () => {
		expect(canDeleteDeck({ cardCount: 0, classLinkCount: 0 })).toBe(true);
		expect(canDeleteDeck({ cardCount: 1, classLinkCount: 0 })).toBe(false);
		expect(canDeleteDeck({ cardCount: 0, classLinkCount: 2 })).toBe(false);
	});
});
