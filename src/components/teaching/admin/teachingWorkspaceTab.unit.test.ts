import { describe, expect, it } from 'vitest';

import {
	resolveTeachingWorkspaceTab,
	teachingTabNeedsGroupBoard,
	teachingTabNeedsPublicPage,
	teachingTabNeedsRoster,
} from './teachingWorkspaceTab';

describe('teachingWorkspaceTab', () => {
	it('defaults unknown tabs to attendance', () => {
		expect(resolveTeachingWorkspaceTab()).toBe('attendance');
		expect(resolveTeachingWorkspaceTab('unknown')).toBe('attendance');
		expect(resolveTeachingWorkspaceTab('cp')).toBe('cp');
		expect(resolveTeachingWorkspaceTab('groups')).toBe('attendance');
		expect(resolveTeachingWorkspaceTab('groups', true)).toBe('groups');
	});

	it('scopes extra loaders to the visible tab', () => {
		expect(teachingTabNeedsGroupBoard('attendance', false)).toBe(false);
		expect(teachingTabNeedsGroupBoard('attendance', true)).toBe(true);
		expect(teachingTabNeedsGroupBoard('groups', true)).toBe(true);
		expect(teachingTabNeedsGroupBoard('students', true)).toBe(false);
		expect(teachingTabNeedsRoster('students')).toBe(true);
		expect(teachingTabNeedsRoster('setup')).toBe(false);
		expect(teachingTabNeedsPublicPage('setup')).toBe(true);
		expect(teachingTabNeedsPublicPage('share')).toBe(false);
	});
});
