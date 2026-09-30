import { describe, expect, it, vi } from 'vitest';

import {
	assertTeachingGroupBoardEnabled,
	isTeachingGroupBoardEnabled,
} from './groupBoardAvailability';

describe('teaching group board availability', () => {
	it('is disabled unless the flag is exactly true', () => {
		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', '');
		expect(isTeachingGroupBoardEnabled()).toBe(false);

		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'TRUE');
		expect(isTeachingGroupBoardEnabled()).toBe(false);

		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'true');
		expect(isTeachingGroupBoardEnabled()).toBe(true);
	});

	it('throws a not-found error while disabled', () => {
		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'false');
		try {
			assertTeachingGroupBoardEnabled();
			throw new Error('expected the feature gate to throw');
		} catch (error) {
			expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND' });
		}
	});
});
