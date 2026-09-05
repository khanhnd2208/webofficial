import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LegacyTeachingPageRedirect from './page';
import LegacyTeachingClassRedirect from './[classId]/page';
import TeachingAttendanceBoardAdminPage from './[classId]/attendance-board/page';
import TeachingGradebookPage from './[classId]/gradebook/page';
import TeachingPublicPageAdmin from './[classId]/public/page';
import TeachingRosterPage from './[classId]/roster/page';
import TeachingSessionsPage from './[classId]/sessions/page';
import TeachingSettingsPage from './[classId]/settings/page';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const redirectMock = vi.mocked(redirect);
const params = Promise.resolve({ classId: 'class-1' });

describe('legacy Admin Teaching redirects', () => {
	beforeEach(() => {
		redirectMock.mockClear();
	});

	it('preserves list and class query parameters', async () => {
		await LegacyTeachingPageRedirect({
			searchParams: Promise.resolve({ filter: 'archived' }),
		});
		expect(redirectMock).toHaveBeenLastCalledWith('/my-space/teaching?filter=archived');

		await LegacyTeachingClassRedirect({
			params,
			searchParams: Promise.resolve({ tab: 'cp', week: '4' }),
		});
		expect(redirectMock).toHaveBeenLastCalledWith('/my-space/teaching/class-1?tab=cp&week=4');
	});

	it.each([
		['attendance-board', TeachingAttendanceBoardAdminPage, 'share'],
		['gradebook', TeachingGradebookPage, 'attendance'],
		['public', TeachingPublicPageAdmin, 'setup'],
		['roster', TeachingRosterPage, 'students'],
		['sessions', TeachingSessionsPage, 'setup'],
		['settings', TeachingSettingsPage, 'setup'],
	] as const)('maps %s to its canonical tab and keeps the week query', async (_, page, tab) => {
		await page({
			params,
			searchParams: Promise.resolve({ week: '3' }),
		});
		expect(redirectMock).toHaveBeenLastCalledWith(`/my-space/teaching/class-1?tab=${tab}&week=3`);
	});
});
