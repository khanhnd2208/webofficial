import { describe, expect, it } from 'vitest';

import { assignRoles, pickFirstSpeaker } from '@/features/spy-fall/lib/spy/roleAssignment';

const players = (n: number) =>
	Array.from({ length: n }, (_, i) => ({ token: `p${i}`, name: `P${i}` }));

describe('assignRoles', () => {
	it('gives exactly one spy the spy word and everyone else the civilian word', () => {
		for (const n of [4, 7, 12]) {
			const assigned = assignRoles(players(n), { civilianWord: 'A', spyWord: 'B' }, Math.random);
			const spies = assigned.filter((p) => p.role === 'spy');
			expect(spies).toHaveLength(1);
			expect(spies[0]!.keyword).toBe('B');
			expect(assigned.filter((p) => p.keyword === 'A')).toHaveLength(n - 1);
		}
	});

	it('deals two spies who share the spy word when asked', () => {
		for (const n of [5, 8, 12]) {
			const assigned = assignRoles(players(n), { civilianWord: 'A', spyWord: 'B' }, Math.random, 2);
			const spies = assigned.filter((p) => p.role === 'spy');
			expect(spies).toHaveLength(2);
			expect(spies.every((p) => p.keyword === 'B')).toBe(true);
			expect(assigned.filter((p) => p.role === 'civilian' && p.keyword === 'A')).toHaveLength(n - 2);
			expect(new Set(assigned.map((p) => p.token)).size).toBe(n);
		}
	});

	it('deals three spies who share the spy word when asked', () => {
		for (const n of [7, 9, 12]) {
			const assigned = assignRoles(players(n), { civilianWord: 'A', spyWord: 'B' }, Math.random, 3);
			const spies = assigned.filter((p) => p.role === 'spy');
			expect(spies).toHaveLength(3);
			expect(spies.every((p) => p.keyword === 'B')).toBe(true);
			expect(assigned.filter((p) => p.role === 'civilian' && p.keyword === 'A')).toHaveLength(n - 3);
		}
	});

	it('refuses more spies than the table size allows', () => {
		expect(() =>
			assignRoles(players(4), { civilianWord: 'A', spyWord: 'B' }, Math.random, 2),
		).toThrow();
		expect(() =>
			assignRoles(players(6), { civilianWord: 'A', spyWord: 'B' }, Math.random, 3),
		).toThrow();
	});
});

describe('pickFirstSpeaker', () => {
	it('never picks an eliminated player', () => {
		const roster = [
			{ token: 'out', role: 'civilian' as const, isEliminated: true },
			{ token: 'spy', role: 'spy' as const, isEliminated: false },
			{ token: 'civ', role: 'civilian' as const, isEliminated: false },
		];
		for (let i = 0; i < 20; i++) {
			const token = pickFirstSpeaker(roster, () => i / 20);
			expect(token === 'spy' || token === 'civ').toBe(true);
		}
	});
});
