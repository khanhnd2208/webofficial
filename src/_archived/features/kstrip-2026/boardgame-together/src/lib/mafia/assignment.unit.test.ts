import { describe, expect, it } from 'vitest';

import { assignRoles, findDuplicateNames, getNextPendingPlayer } from './assignment';
import type { Player } from '@/types/mafiaGame';

function makePlayers(names: string[]): Player[] {
	return names.map((name, i) => ({
		id: `p${i}`,
		name,
		seatOrder: i,
		roleId: null,
		viewStatus: 'PENDING' as const,
		privateInformation: null,
	}));
}

describe('assignRoles', () => {
	it('assigns exactly one role per player', () => {
		const players = makePlayers(['A', 'B', 'C', 'D', 'E']);
		const selections = [
			{ roleId: 'werewolf', count: 1 },
			{ roleId: 'seer', count: 1 },
			{ roleId: 'villager', count: 3 },
		];
		const result = assignRoles({ players, roleSelections: selections, random: () => 0.5 });
		expect(result).toHaveLength(5);
		expect(result.every((p) => p.roleId !== null)).toBe(true);
	});

	it('assigns roles independent of seat order', () => {
		const players = makePlayers(['Minh', 'Lan', 'Huy']);
		const selections = [
			{ roleId: 'werewolf', count: 1 },
			{ roleId: 'seer', count: 1 },
			{ roleId: 'villager', count: 1 },
		];
		const result = assignRoles({ players, roleSelections: selections, random: () => 0.1 });
		const minh = result.find((p) => p.name === 'Minh')!;
		expect(minh.roleId).toBeTruthy();
	});

	it('computes werewolf teammate info for all wolf-faction roles', () => {
		const players = makePlayers(['A', 'B', 'C', 'D', 'E']);
		const selections = [
			{ roleId: 'werewolf', count: 1 },
			{ roleId: 'wolf_cub', count: 1 },
			{ roleId: 'villager', count: 3 },
		];
		let seed = 0.3;
		const random = () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
		const result = assignRoles({ players, roleSelections: selections, random });
		const wolves = result.filter((p) => p.roleId === 'werewolf' || p.roleId === 'wolf_cub');
		expect(wolves).toHaveLength(2);
		for (const wolf of wolves) {
			expect(wolf.privateInformation).toMatch(/^mafia\.private\.wolfTeam\|/);
		}
	});

	it('solo role gets independent private info', () => {
		const players = makePlayers(['A', 'B', 'C', 'D', 'E']);
		const selections = [
			{ roleId: 'serial_killer', count: 1 },
			{ roleId: 'werewolf', count: 1 },
			{ roleId: 'villager', count: 3 },
		];
		const result = assignRoles({ players, roleSelections: selections, random: () => 0.5 });
		const killer = result.find((p) => p.roleId === 'serial_killer')!;
		expect(killer.privateInformation).toBe('mafia.private.solo');
	});

	it('throws when role count mismatches', () => {
		const players = makePlayers(['A', 'B']);
		const selections = [{ roleId: 'villager', count: 1 }];
		expect(() => assignRoles({ players, roleSelections: selections })).toThrow();
	});
});

describe('getNextPendingPlayer', () => {
	it('returns first pending by seat order', () => {
		const players: Player[] = [
			{ id: '1', name: 'A', seatOrder: 0, roleId: 'villager', viewStatus: 'VIEWED', privateInformation: null },
			{ id: '2', name: 'B', seatOrder: 1, roleId: 'werewolf', viewStatus: 'PENDING', privateInformation: null },
			{ id: '3', name: 'C', seatOrder: 2, roleId: 'seer', viewStatus: 'PENDING', privateInformation: null },
		];
		expect(getNextPendingPlayer(players)?.name).toBe('B');
	});
});

describe('findDuplicateNames', () => {
	it('finds duplicate names', () => {
		const players = makePlayers(['Minh', 'Lan', 'Minh']);
		expect(findDuplicateNames(players)).toEqual(['Minh']);
	});

	it('returns empty for unique names', () => {
		const players = makePlayers(['Minh', 'Lan', 'Huy']);
		expect(findDuplicateNames(players)).toEqual([]);
	});
});
