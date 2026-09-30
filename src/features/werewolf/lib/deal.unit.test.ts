import { describe, expect, it } from 'vitest';

import { GameError } from '@/features/board-game-shared/lib/gameError';
import { buildRolePool, dealRoles, validateRoleCounts } from '@/features/werewolf/lib/deal';
import type { RoleCount } from '@/features/werewolf/types';

const counts: RoleCount[] = [
	{ roleId: 'werewolf', count: 2 },
	{ roleId: 'seer', count: 1 },
	{ roleId: 'villager', count: 3 },
];

describe('dealRoles', () => {
	it('deals one card per token and matches each role count', () => {
		const tokens = ['a', 'b', 'c', 'd', 'e', 'f'];
		const dealt = dealRoles(tokens, counts, () => 0.5);
		expect(dealt.size).toBe(tokens.length);
		const tally = new Map<string, number>();
		for (const roleId of dealt.values()) {
			tally.set(roleId, (tally.get(roleId) ?? 0) + 1);
		}
		expect(tally.get('werewolf')).toBe(2);
		expect(tally.get('seer')).toBe(1);
		expect(tally.get('villager')).toBe(3);
	});

	it('is deterministic for a fixed random source', () => {
		const tokens = ['a', 'b', 'c', 'd', 'e', 'f'];
		let n = 0;
		const sequence = [0.1, 0.8, 0.3, 0.6, 0.2];
		const random = () => sequence[n++] ?? 0;
		const first = [...dealRoles(tokens, counts, random).entries()];
		n = 0;
		const second = [...dealRoles(tokens, counts, random).entries()];
		expect(second).toEqual(first);
		expect(buildRolePool(counts)).toHaveLength(6);
	});
});

describe('validateRoleCounts', () => {
	it('rejects a mismatched total, an unknown role, and a negative count', () => {
		expect(() => validateRoleCounts(counts, 5)).toThrow(GameError);
		expect(() => validateRoleCounts([{ roleId: 'not-a-role', count: 1 }], 1)).toThrow(GameError);
		expect(() => validateRoleCounts([{ roleId: 'villager', count: -1 }], -1)).toThrow(GameError);
		expect(() => validateRoleCounts(counts, 6)).not.toThrow();
	});
});
