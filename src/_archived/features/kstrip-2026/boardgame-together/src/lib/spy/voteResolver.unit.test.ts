import { describe, expect, it } from 'vitest';

import {
	resolveElimination,
	resolvePrimaryVote,
	resolveRunoffVote,
} from '@/lib/spy/voteResolver';

describe('resolvePrimaryVote', () => {
	const candidates = ['an', 'binh', 'chi', 'dung'];

	it('selects top K by total votes', () => {
		const ballots = [
			{ voterToken: 'v1', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v2', vote1Token: 'an', vote2Token: 'chi' },
			{ voterToken: 'v3', vote1Token: 'an', vote2Token: 'dung' },
		];
		const result = resolvePrimaryVote(ballots, candidates, 1);
		expect(result.selected).toEqual(['an']);
		expect(result.needsRunoff).toBe(false);
	});

	it('spec §22 example 1: An wins, Bình wins tiebreak on top-suspect', () => {
		const ballots = [
			{ voterToken: 'v1', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v2', vote1Token: 'an', vote2Token: 'chi' },
			{ voterToken: 'v3', vote1Token: 'an', vote2Token: 'dung' },
			{ voterToken: 'v4', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v5', vote1Token: 'binh', vote2Token: 'chi' },
			{ voterToken: 'v6', vote1Token: 'chi', vote2Token: 'dung' },
			{ voterToken: 'v7', vote1Token: 'dung', vote2Token: 'binh' },
		];
		const result = resolvePrimaryVote(ballots, ['an', 'binh', 'chi', 'dung'], 2);
		expect(result.selected).toEqual(['an', 'binh']);
		expect(result.needsRunoff).toBe(false);
	});

	it('spec §22 example 2: An wins, Bình+Chi need runoff', () => {
		const ballots = [
			{ voterToken: 'v1', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v2', vote1Token: 'an', vote2Token: 'chi' },
			{ voterToken: 'v3', vote1Token: 'binh', vote2Token: 'an' },
			{ voterToken: 'v4', vote1Token: 'chi', vote2Token: 'an' },
			{ voterToken: 'v5', vote1Token: 'dung', vote2Token: 'an' },
		];
		const result = resolvePrimaryVote(ballots, ['an', 'binh', 'chi'], 2);
		expect(result.selected).toEqual(['an']);
		expect(result.needsRunoff).toBe(true);
		expect(result.runoffCandidates?.sort()).toEqual(['binh', 'chi']);
		expect(result.slotsRemaining).toBe(1);
	});

	it('single-pick ballot counts as 1 vote', () => {
		const ballots = [
			{ voterToken: 'v1', vote1Token: 'an' },
			{ voterToken: 'v2', vote1Token: 'an' },
			{ voterToken: 'v3', vote1Token: 'binh' },
		];
		const result = resolvePrimaryVote(ballots, candidates, 1);
		expect(result.selected).toEqual(['an']);
		expect(result.tallies.find((t) => t.token === 'an')?.totalVotes).toBe(2);
	});

	it('empty ballot contributes 0 votes', () => {
		const ballots = [{ voterToken: 'v1' }, { voterToken: 'v2', vote1Token: 'an' }];
		const result = resolvePrimaryVote(ballots, candidates, 1);
		expect(result.selected).toEqual(['an']);
	});

	it('selects all when K >= candidates', () => {
		const result = resolvePrimaryVote([], candidates, 10);
		expect(result.selected).toHaveLength(4);
		expect(result.needsRunoff).toBe(false);
	});

	it('spec §22 example 3: four-way tie triggers runoff for 2 slots', () => {
		const ballots = [
			{ voterToken: 'v1', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v2', vote1Token: 'binh', vote2Token: 'chi' },
			{ voterToken: 'v3', vote1Token: 'chi', vote2Token: 'dung' },
			{ voterToken: 'v4', vote1Token: 'dung', vote2Token: 'an' },
		];
		const result = resolvePrimaryVote(ballots, candidates, 2);
		expect(result.needsRunoff).toBe(true);
		expect(result.runoffCandidates).toHaveLength(4);
		expect(result.slotsRemaining).toBe(2);
	});
});

describe('resolveRunoffVote', () => {
	it('picks highest in runoff', () => {
		const ballots = [
			{ voterToken: 'v1', choices: ['binh'] },
			{ voterToken: 'v2', choices: ['binh'] },
			{ voterToken: 'v3', choices: ['chi'] },
		];
		const result = resolveRunoffVote(ballots, ['binh', 'chi'], 1);
		expect(result.selected).toEqual(['binh']);
	});

	it('runoff selects two when slotsRemaining = 2', () => {
		const ballots = [
			{ voterToken: 'v1', choices: ['an'] },
			{ voterToken: 'v2', choices: ['an'] },
			{ voterToken: 'v3', choices: ['binh'] },
		];
		const result = resolveRunoffVote(ballots, ['an', 'binh', 'chi'], 2);
		expect(result.selected).toEqual(['an', 'binh']);
	});

	it('resolveElimination combines primary + runoff', () => {
		const primaryBallots = [
			{ voterToken: 'v1', vote1Token: 'an', vote2Token: 'binh' },
			{ voterToken: 'v2', vote1Token: 'an', vote2Token: 'chi' },
			{ voterToken: 'v3', vote1Token: 'binh', vote2Token: 'an' },
			{ voterToken: 'v4', vote1Token: 'chi', vote2Token: 'an' },
			{ voterToken: 'v5', vote1Token: 'dung', vote2Token: 'an' },
		];
		const runoffBallots = [
			{ voterToken: 'v1', choices: ['binh'] },
			{ voterToken: 'v2', choices: ['binh'] },
			{ voterToken: 'v3', choices: ['chi'] },
			{ voterToken: 'v4', choices: ['binh'] },
			{ voterToken: 'v5', choices: ['chi'] },
		];
		const result = resolveElimination(
			primaryBallots,
			runoffBallots,
			['an', 'binh', 'chi'],
			2,
		);
		expect(result.selected).toEqual(['an', 'binh']);
		expect(result.needsRunoff).toBe(false);
	});

	it('random tiebreak when still tied', () => {
		const ballots = [
			{ voterToken: 'v1', choices: ['binh'] },
			{ voterToken: 'v2', choices: ['chi'] },
		];
		const result = resolveRunoffVote(ballots, ['binh', 'chi'], 1, () => 0);
		expect(result.selected).toHaveLength(1);
		expect(['binh', 'chi']).toContain(result.selected[0]);
		expect(result.trace.some((t) => t.step === 'random-tiebreak')).toBe(true);
	});
});
