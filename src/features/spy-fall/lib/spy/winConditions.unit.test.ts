import { describe, expect, it } from 'vitest';

import { checkOutcome, resolveVoteOutcome } from '@/features/spy-fall/lib/spy/winConditions';
import type { OutcomePlayer } from '@/features/spy-fall/lib/spy/winConditions';

function table(
	civilians: number,
	spies: number,
	out: { civilians?: number; spies?: number } = {},
): OutcomePlayer[] {
	const players: OutcomePlayer[] = [];
	for (let i = 0; i < civilians; i++) {
		players.push({ role: 'civilian', isEliminated: i < (out.civilians ?? 0) });
	}
	for (let i = 0; i < spies; i++) {
		players.push({ role: 'spy', isEliminated: i < (out.spies ?? 0) });
	}
	return players;
}

describe('resolveVoteOutcome — one spy', () => {
	it('civilians win when the single vote catches the spy', () => {
		expect(resolveVoteOutcome('spy', table(3, 1, { spies: 1 }))).toEqual({
			winningSide: 'civilian',
			reason: 'all-spies-caught',
		});
		expect(resolveVoteOutcome('spy', table(11, 1, { spies: 1 }))?.winningSide).toBe('civilian');
	});

	it('the spy wins at once when the vote eliminates a civilian, however many are left', () => {
		expect(resolveVoteOutcome('civilian', table(3, 1, { civilians: 1 }))).toEqual({
			winningSide: 'antagonist',
			reason: 'wrong-vote',
		});
		expect(resolveVoteOutcome('civilian', table(11, 1, { civilians: 1 }))?.winningSide).toBe(
			'antagonist',
		);
	});

	it('the spy wins when nobody is eliminated (second tie or no ballots)', () => {
		expect(resolveVoteOutcome(null, table(5, 1))).toEqual({
			winningSide: 'antagonist',
			reason: 'no-elimination',
		});
	});
});

describe('resolveVoteOutcome — two spies', () => {
	it('catching the first spy earns one more round', () => {
		expect(resolveVoteOutcome('spy', table(4, 2, { spies: 1 }))).toBeNull();
		expect(resolveVoteOutcome('spy', table(10, 2, { spies: 1 }))).toBeNull();
	});

	it('civilians win once the second vote catches the other spy', () => {
		expect(resolveVoteOutcome('spy', table(4, 2, { spies: 2 }))).toEqual({
			winningSide: 'civilian',
			reason: 'all-spies-caught',
		});
	});

	it('a miss on the first vote ends the game for the spies', () => {
		expect(resolveVoteOutcome('civilian', table(4, 2, { civilians: 1 }))).toEqual({
			winningSide: 'antagonist',
			reason: 'wrong-vote',
		});
	});

	it('a miss on the final guess ends the game for the spies', () => {
		expect(resolveVoteOutcome('civilian', table(4, 2, { civilians: 1, spies: 1 }))).toEqual({
			winningSide: 'antagonist',
			reason: 'wrong-vote',
		});
		expect(resolveVoteOutcome(null, table(4, 2, { spies: 1 }))?.reason).toBe('no-elimination');
	});

	it('the spies win if a catch leaves too few civilians to outvote the last spy', () => {
		// Only reachable after players leave mid-game: 1 civilian vs 1 spy.
		expect(resolveVoteOutcome('spy', table(1, 2, { spies: 1 }))).toEqual({
			winningSide: 'antagonist',
			reason: 'outnumbered',
		});
	});
});

describe('resolveVoteOutcome — three spies', () => {
	it('each catch with spies still hidden earns one more round', () => {
		expect(resolveVoteOutcome('spy', table(4, 3, { spies: 1 }))).toBeNull();
		expect(resolveVoteOutcome('spy', table(4, 3, { spies: 2 }))).toBeNull();
	});

	it('civilians win once the third vote catches the last spy', () => {
		expect(resolveVoteOutcome('spy', table(4, 3, { spies: 3 }))).toEqual({
			winningSide: 'civilian',
			reason: 'all-spies-caught',
		});
	});

	it('a miss on any vote ends the game for the spies', () => {
		expect(resolveVoteOutcome('civilian', table(4, 3, { civilians: 1, spies: 2 }))).toEqual({
			winningSide: 'antagonist',
			reason: 'wrong-vote',
		});
	});
});

describe('checkOutcome (after someone leaves)', () => {
	it('civilians win when no spy is left at the table', () => {
		expect(checkOutcome(table(3, 1, { spies: 1 }))).toEqual({
			winningSide: 'civilian',
			reason: 'spies-gone',
		});
		expect(checkOutcome(table(5, 0))?.winningSide).toBe('civilian');
	});

	it('the spies win once civilians can no longer outvote them', () => {
		expect(checkOutcome(table(1, 1))).toEqual({ winningSide: 'antagonist', reason: 'outnumbered' });
		expect(checkOutcome(table(2, 2))?.winningSide).toBe('antagonist');
	});

	it('the game goes on otherwise', () => {
		expect(checkOutcome(table(3, 1))).toBeNull();
		expect(checkOutcome(table(3, 2))).toBeNull();
		expect(checkOutcome(table(4, 2, { spies: 1 }))).toBeNull();
	});
});
