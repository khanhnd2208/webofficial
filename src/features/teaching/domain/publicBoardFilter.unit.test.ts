import { describe, expect, it } from 'vitest';

import {
	PUBLIC_TUTORIAL_ALL,
	PUBLIC_TUTORIAL_UNASSIGNED,
	resolvePublicTutorialId,
	sessionMatchesPublicTutorial,
	shouldShowPublicTutorialFilter,
	studentMatchesPublicTutorial,
} from './publicBoardFilter';

describe('public tutorial filter', () => {
	const tutorials = [{ id: 't1' }, { id: 't2' }];

	it('defaults to the whole class when unassigned students exist', () => {
		expect(
			resolvePublicTutorialId({
				tutorials,
				students: [{ tutorialClassId: null }, { tutorialClassId: 't1' }],
			}),
		).toBe(PUBLIC_TUTORIAL_ALL);
	});

	it('defaults to the first tutorial when every student is assigned', () => {
		expect(
			resolvePublicTutorialId({
				tutorials,
				students: [{ tutorialClassId: 't1' }],
			}),
		).toBe('t1');
	});

	it('keeps unassigned students visible in the all-class view', () => {
		expect(studentMatchesPublicTutorial({ tutorialClassId: null }, PUBLIC_TUTORIAL_ALL)).toBe(true);
		expect(studentMatchesPublicTutorial({ tutorialClassId: 't1' }, PUBLIC_TUTORIAL_ALL)).toBe(true);
		expect(studentMatchesPublicTutorial({ tutorialClassId: null }, 't1')).toBe(false);
		expect(studentMatchesPublicTutorial({ tutorialClassId: null }, PUBLIC_TUTORIAL_UNASSIGNED)).toBe(
			true,
		);
		expect(sessionMatchesPublicTutorial({ tutorialClassId: 't1' }, PUBLIC_TUTORIAL_UNASSIGNED)).toBe(
			false,
		);
	});

	it('shows the filter when the only extra group is unassigned students', () => {
		expect(shouldShowPublicTutorialFilter({ tutorialCount: 1, hasUnassigned: true })).toBe(true);
		expect(shouldShowPublicTutorialFilter({ tutorialCount: 1, hasUnassigned: false })).toBe(false);
	});
});
