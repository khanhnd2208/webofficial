import { describe, expect, it } from 'vitest';

import { assignRoles } from '@/lib/spy/roleAssignment';

describe('assignRoles', () => {
	const wordPair = { civilianWord: 'Ô', spyWord: 'Áo mưa' };

	it('assigns 1 spy for 5 players', () => {
		const players = Array.from({ length: 5 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, () => 0.5);
		const spies = assigned.filter((p) => p.role === 'spy');
		const civilians = assigned.filter((p) => p.role === 'civilian');
		expect(spies).toHaveLength(1);
		expect(civilians).toHaveLength(4);
		expect(civilians.every((c) => c.keyword === 'Ô')).toBe(true);
		expect(spies[0]!.keyword).toBe('Áo mưa');
	});

	it('assigns spy + mrwhite for 8 players with teammate names', () => {
		const players = Array.from({ length: 8 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		// deterministic shuffle via seeded random
		let seed = 0;
		const random = () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
		const assigned = assignRoles(players, wordPair, random);
		const spy = assigned.find((p) => p.role === 'spy');
		const mrWhite = assigned.find((p) => p.role === 'mrwhite');
		expect(spy).toBeDefined();
		expect(mrWhite).toBeDefined();
		expect(spy!.teammateName).toBe(mrWhite!.name);
		expect(mrWhite!.teammateName).toBe(spy!.name);
		expect(mrWhite!.keyword).toBeUndefined();
	});

	it('4 players: 1 spy, 3 civilians, no mrwhite teammate', () => {
		const players = Array.from({ length: 4 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, () => 0.5);
		expect(assigned.filter((p) => p.role === 'spy')).toHaveLength(1);
		expect(assigned.filter((p) => p.role === 'civilian')).toHaveLength(3);
		expect(assigned.filter((p) => p.role === 'mrwhite')).toHaveLength(0);
		const spy = assigned.find((p) => p.role === 'spy')!;
		expect(spy.teammateName).toBeUndefined();
	});

	it('6 players: 1 spy, 5 civilians (K=1 boundary)', () => {
		const players = Array.from({ length: 6 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, () => 0.5);
		expect(assigned.filter((p) => p.role === 'spy')).toHaveLength(1);
		expect(assigned.filter((p) => p.role === 'civilian')).toHaveLength(5);
		expect(assigned.filter((p) => p.role === 'mrwhite')).toHaveLength(0);
	});

	it('7 players: spy and mrwhite know each other', () => {
		let seed = 42;
		const random = () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
		const players = Array.from({ length: 7 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, random);
		const spy = assigned.find((p) => p.role === 'spy')!;
		const mrWhite = assigned.find((p) => p.role === 'mrwhite')!;
		expect(spy.teammateName).toBe(mrWhite.name);
		expect(mrWhite.teammateName).toBe(spy.name);
		expect(assigned.filter((p) => p.role === 'civilian')).toHaveLength(5);
	});

	it('12 players: 1 spy, 1 mrwhite, 10 civilians', () => {
		const players = Array.from({ length: 12 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, () => 0.5);
		expect(assigned.filter((p) => p.role === 'spy')).toHaveLength(1);
		expect(assigned.filter((p) => p.role === 'mrwhite')).toHaveLength(1);
		expect(assigned.filter((p) => p.role === 'civilian')).toHaveLength(10);
	});

	it.each([4, 7, 12] as const)(
		'hideRoles %i players: 1 spy, no mrwhite, no teammate names',
		(count) => {
			const players = Array.from({ length: count }, (_, i) => ({
				token: `p${i}`,
				name: `Player ${i}`,
			}));
			const assigned = assignRoles(players, wordPair, () => 0.5, true);
			expect(assigned.filter((p) => p.role === 'spy')).toHaveLength(1);
			expect(assigned.filter((p) => p.role === 'civilian')).toHaveLength(count - 1);
			expect(assigned.filter((p) => p.role === 'mrwhite')).toHaveLength(0);
			expect(assigned.every((p) => !p.teammateName)).toBe(true);
			const spy = assigned.find((p) => p.role === 'spy')!;
			expect(spy.keyword).toBe('Áo mưa');
			expect(assigned.filter((p) => p.role === 'civilian').every((c) => c.keyword === 'Ô')).toBe(
				true,
			);
		},
	);

	it('assigns correct keywords per role', () => {
		const players = Array.from({ length: 8 }, (_, i) => ({
			token: `p${i}`,
			name: `Player ${i}`,
		}));
		const assigned = assignRoles(players, wordPair, () => 0.5);
		for (const p of assigned) {
			if (p.role === 'civilian') expect(p.keyword).toBe('Ô');
			if (p.role === 'spy') expect(p.keyword).toBe('Áo mưa');
			if (p.role === 'mrwhite') expect(p.keyword).toBeUndefined();
		}
	});
});
