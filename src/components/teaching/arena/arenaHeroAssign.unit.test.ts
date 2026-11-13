import { describe, expect, it } from 'vitest';

import { balanceHeroes } from './arenaHeroAssign';

const ids = (count: number, prefix = 's') =>
	Array.from({ length: count }, (_, index) => `${prefix}${index}`);

function tally(assigned: Record<string, string>) {
	const counts = new Map<string, number>();
	for (const hero of Object.values(assigned)) counts.set(hero, (counts.get(hero) ?? 0) + 1);
	return counts;
}

describe('balanceHeroes', () => {
	it('gives each of 10 heroes exactly 3 of 30 students', () => {
		const heroes = ids(10, 'h');
		const counts = tally(balanceHeroes(ids(30), heroes));
		expect(counts.size).toBe(10);
		expect([...counts.values()].every((count) => count === 3)).toBe(true);
	});

	it('keeps an uneven split within one student', () => {
		for (const students of [1, 7, 23, 31, 47]) {
			const heroes = ids(10, 'h');
			const assigned = balanceHeroes(ids(students), heroes);
			const counts = tally(assigned);
			const values = heroes.map((hero) => counts.get(hero) ?? 0);
			expect(Object.keys(assigned)).toHaveLength(students);
			expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
		}
	});

	it('keeps earlier picks when a student joins, and rebalances a skewed start', () => {
		const heroes = ids(3, 'h');
		const first = balanceHeroes(ids(6), heroes);
		const next = balanceHeroes([...ids(6), 'late'], heroes, first);
		for (const id of ids(6)) expect(next[id]).toBe(first[id]);
		const skewed = Object.fromEntries(ids(6).map((id) => [id, 'h0']));
		expect([...tally(balanceHeroes(ids(6), heroes, skewed)).values()]).toEqual([2, 2, 2]);
	});

	it('drops heroes that are no longer in play', () => {
		const assigned = balanceHeroes(ids(4), ['h1', 'h2'], { s0: 'gone', s1: 'h1' });
		expect(new Set(Object.values(assigned))).toEqual(new Set(['h1', 'h2']));
		expect(assigned.s1).toBe('h1');
	});
});
