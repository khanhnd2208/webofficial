import { describe, expect, it } from 'vitest';

import {
	MAX_PLAYERS,
	MIN_PLAYERS,
	ROLES,
	getSuggestedRoleSet,
	getTotalRoleCount,
} from '@/features/werewolf/config/roles';

const known = new Set(ROLES.map((role) => role.roleId));

describe('getSuggestedRoleSet', () => {
	it('sums to n and only uses known roles for every table size', () => {
		for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
			const set = getSuggestedRoleSet(n);
			expect(getTotalRoleCount(set)).toBe(n);
			for (const entry of set) {
				expect(known.has(entry.roleId)).toBe(true);
				expect(entry.count).toBeGreaterThan(0);
			}
		}
	});
});
