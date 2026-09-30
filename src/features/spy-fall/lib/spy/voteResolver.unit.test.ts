import { describe, expect, it } from 'vitest';

import { resolveRoundVote } from '@/features/spy-fall/lib/spy/voteResolver';

const candidates = ['a', 'b', 'c', 'd'];

describe('resolveRoundVote', () => {
	it('eliminates the single leader', () => {
		const result = resolveRoundVote(
			[
				{ voterToken: 'b', targetToken: 'a' },
				{ voterToken: 'c', targetToken: 'a' },
				{ voterToken: 'd', targetToken: 'b' },
			],
			candidates,
		);
		expect(result.eliminated).toBe('a');
		expect(result.topTokens).toEqual(['a']);
	});

	it('reports a tie of two or three without eliminating anyone', () => {
		const two = resolveRoundVote(
			[
				{ voterToken: 'c', targetToken: 'a' },
				{ voterToken: 'd', targetToken: 'b' },
			],
			candidates,
		);
		expect(two.eliminated).toBeNull();
		expect(two.topTokens.sort()).toEqual(['a', 'b']);

		const three = resolveRoundVote(
			[
				{ voterToken: 'd', targetToken: 'a' },
				{ voterToken: 'a', targetToken: 'b' },
				{ voterToken: 'b', targetToken: 'c' },
			],
			['a', 'b', 'c', 'd'],
		);
		expect(three.eliminated).toBeNull();
		expect(three.topTokens.sort()).toEqual(['a', 'b', 'c']);
	});

	it('eliminates nobody when there are no votes', () => {
		const result = resolveRoundVote(
			[{ voterToken: 'a', targetToken: null }, { voterToken: 'b' }],
			candidates,
		);
		expect(result.eliminated).toBeNull();
		expect(result.topTokens).toEqual([]);
	});

	it('only counts votes inside the candidate list', () => {
		const result = resolveRoundVote(
			[
				{ voterToken: 'a', targetToken: 'z' },
				{ voterToken: 'b', targetToken: 'c' },
			],
			['a', 'b', 'c'],
		);
		expect(result.eliminated).toBe('c');
		expect(result.tally.find((row) => row.token === 'z')).toBeUndefined();
	});
});
