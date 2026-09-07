import { describe, expect, it } from 'vitest';

import { memberSlotIndexes } from './groupSlots';

describe('memberSlotIndexes', () => {
	it('assigns consecutive unique slots from an empty group', () => {
		expect(memberSlotIndexes([], 5)).toEqual([0, 1, 2, 3, 4]);
	});

	it('skips occupied slots including gaps leftover from the old board', () => {
		expect(memberSlotIndexes([0, 4], 3)).toEqual([1, 2, 3]);
	});

	it('returns an empty list when nothing is being added', () => {
		expect(memberSlotIndexes([0, 1], 0)).toEqual([]);
	});
});
