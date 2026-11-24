import { describe, expect, it } from 'vitest';

import {
	getPublicNavSections,
	resolvePublicBoardRoute,
	toPublicTabParam,
} from './publicBoardNav';

const allEnabled = { groupBoardEnabled: true, notesEnabled: true, recallEnabled: true };
const allDisabled = { groupBoardEnabled: false, notesEnabled: false, recallEnabled: false };

describe('resolvePublicBoardRoute', () => {
	it('defaults to Của tôi when tab is omitted, empty, me, or unknown', () => {
		for (const tab of [undefined, null, '', 'me', 'unknown']) {
			expect(resolvePublicBoardRoute(tab, allEnabled)).toEqual({
				section: 'me',
				view: 'attendance',
				openLearning: false,
			});
		}
	});

	it('maps legacy attendance, cp, and summary tabs into the gradebook view', () => {
		expect(resolvePublicBoardRoute('attendance', allDisabled)).toEqual({
			section: 'gradebook',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('cp', allDisabled)).toEqual({
			section: 'gradebook',
			view: 'cp',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('summary', allDisabled)).toEqual({
			section: 'gradebook',
			view: 'summary',
			openLearning: false,
		});
	});

	it('maps learning to Của tôi with the learning sheet opened', () => {
		expect(resolvePublicBoardRoute('learning', allDisabled)).toEqual({
			section: 'me',
			view: 'attendance',
			openLearning: true,
		});
	});

	it('opens optional sections only when enabled and falls back to Của tôi when disabled', () => {
		expect(resolvePublicBoardRoute('groups', allEnabled)).toEqual({
			section: 'groups',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('groups', allDisabled)).toEqual({
			section: 'me',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('recall', allEnabled)).toEqual({
			section: 'recall',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('recall', allDisabled)).toEqual({
			section: 'me',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('notes', allEnabled)).toEqual({
			section: 'notes',
			view: 'attendance',
			openLearning: false,
		});
		expect(resolvePublicBoardRoute('notes', allDisabled)).toEqual({
			section: 'me',
			view: 'attendance',
			openLearning: false,
		});
	});
});

describe('toPublicTabParam', () => {
	it('produces clean URLs for Của tôi and preserves gradebook views and learning', () => {
		expect(toPublicTabParam('me', 'attendance', false)).toBeNull();
		expect(toPublicTabParam('me', 'attendance', true)).toBe('learning');
		expect(toPublicTabParam('gradebook', 'attendance')).toBe('attendance');
		expect(toPublicTabParam('gradebook', 'cp')).toBe('cp');
		expect(toPublicTabParam('gradebook', 'summary')).toBe('summary');
		expect(toPublicTabParam('groups', 'attendance')).toBe('groups');
		expect(toPublicTabParam('recall', 'attendance')).toBe('recall');
		expect(toPublicTabParam('notes', 'attendance')).toBe('notes');
	});
});

describe('getPublicNavSections', () => {
	it('shows at most the 4 primary sections by default and hides disabled sections', () => {
		expect(getPublicNavSections(allDisabled)).toEqual(['me', 'gradebook']);
		expect(
			getPublicNavSections({ groupBoardEnabled: true, notesEnabled: false, recallEnabled: true }),
		).toEqual(['me', 'gradebook', 'groups', 'recall']);
		expect(getPublicNavSections(allEnabled)).toEqual([
			'me',
			'gradebook',
			'groups',
			'recall',
			'notes',
		]);
	});
});
