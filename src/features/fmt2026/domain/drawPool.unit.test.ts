import { describe, expect, it } from 'vitest';

import { pickFromPool, summarizePool, type PoolInput } from './drawPool';

const pool = (overrides: Partial<PoolInput> = {}): PoolInput => ({
	totalSpins: 10,
	spinsUsed: 0,
	prizes: [
		{ id: 'a', remaining: 2, isActive: true },
		{ id: 'b', remaining: 3, isActive: true },
	],
	...overrides,
});

describe('summarizePool', () => {
	it('fills the planned spins with good-luck slots', () => {
		expect(summarizePool(pool())).toEqual({ prizesLeft: 5, luckLeft: 5, spinsLeft: 10 });
	});

	it('subtracts spins already used', () => {
		expect(summarizePool(pool({ spinsUsed: 4 }))).toEqual({
			prizesLeft: 5,
			luckLeft: 1,
			spinsLeft: 6,
		});
	});

	it('has no good-luck slots when stock exceeds the planned spins', () => {
		expect(summarizePool(pool({ totalSpins: 3 }))).toEqual({
			prizesLeft: 5,
			luckLeft: 0,
			spinsLeft: 5,
		});
	});

	it('ignores inactive prizes and negative stock', () => {
		const prizes = [
			{ id: 'a', remaining: 4, isActive: false },
			{ id: 'b', remaining: -2, isActive: true },
			{ id: 'c', remaining: 1, isActive: true },
		];
		expect(summarizePool(pool({ prizes, totalSpins: 1 }))).toEqual({
			prizesLeft: 1,
			luckLeft: 0,
			spinsLeft: 1,
		});
	});
});

describe('pickFromPool', () => {
	it('maps each ticket to a prize by remaining stock, then to good luck', () => {
		const picks = Array.from(
			{ length: 10 },
			(_, ticket) => pickFromPool(pool(), () => ticket)?.prizeId,
		);
		expect(picks).toEqual(['a', 'a', 'b', 'b', 'b', null, null, null, null, null]);
	});

	it('skips sold-out and inactive prizes', () => {
		const prizes = [
			{ id: 'gone', remaining: 0, isActive: true },
			{ id: 'off', remaining: 5, isActive: false },
			{ id: 'left', remaining: 1, isActive: true },
		];
		expect(pickFromPool(pool({ prizes, totalSpins: 1 }), () => 0)).toEqual({ prizeId: 'left' });
	});

	it('returns null when the bag is empty', () => {
		const prizes = [{ id: 'a', remaining: 0, isActive: true }];
		expect(pickFromPool(pool({ prizes, totalSpins: 5, spinsUsed: 5 }), () => 0)).toBeNull();
	});

	it('asks the random source for a ticket below the spins left', () => {
		let asked = 0;
		pickFromPool(pool({ spinsUsed: 2 }), (max) => {
			asked = max;
			return 0;
		});
		expect(asked).toBe(8);
	});
});
