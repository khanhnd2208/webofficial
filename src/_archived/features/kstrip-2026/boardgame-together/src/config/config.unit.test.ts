import { describe, expect, it } from 'vitest';

import { getRoleDistribution } from '@/config/spyGame';

describe('getRoleDistribution', () => {
	const table: Array<[number, number, number, number, number]> = [
		[4, 3, 1, 0, 1],
		[5, 4, 1, 0, 1],
		[6, 5, 1, 0, 1],
		[7, 5, 1, 1, 2],
		[8, 6, 1, 1, 2],
		[9, 7, 1, 1, 2],
		[10, 8, 1, 1, 2],
		[11, 9, 1, 1, 2],
		[12, 10, 1, 1, 2],
	];

	it.each(table)(
		'%i players => %i civilians, %i spy, %i mrwhite, K=%i',
		(count, civilians, spies, mrWhites, eliminationCount) => {
			const dist = getRoleDistribution(count);
			expect(dist).toEqual({ civilians, spies, mrWhites, eliminationCount });
		},
	);

	it('throws outside 4–12 range', () => {
		expect(() => getRoleDistribution(3)).toThrow();
		expect(() => getRoleDistribution(13)).toThrow();
	});

	it.each([4, 7, 12] as const)(
		'hideRoles %i players => 1 spy, 0 mrwhite, K=1',
		(count) => {
			expect(getRoleDistribution(count, true)).toEqual({
				civilians: count - 1,
				spies: 1,
				mrWhites: 0,
				eliminationCount: 1,
			});
		},
	);
});
