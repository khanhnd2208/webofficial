export interface RoundBallot {
	voterToken: string;
	targetToken?: string | null;
}

export interface RoundTally {
	token: string;
	votes: number;
}

export interface RoundVoteResolution {
	tally: RoundTally[];
	topTokens: string[];
	eliminated: string | null;
}

/**
 * One vote each. A single leader with at least 1 vote is eliminated.
 * A tie at the top leaves topTokens set and eliminated null.
 * Zero votes eliminates nobody and does not ask for a revote.
 */
export function resolveRoundVote(
	ballots: RoundBallot[],
	candidates: string[],
): RoundVoteResolution {
	const counts = new Map<string, number>();
	for (const token of candidates) counts.set(token, 0);

	for (const ballot of ballots) {
		const target = ballot.targetToken;
		if (target && counts.has(target)) {
			counts.set(target, (counts.get(target) ?? 0) + 1);
		}
	}

	const tally: RoundTally[] = [...counts.entries()].map(([token, votes]) => ({
		token,
		votes,
	}));

	const maxVotes = tally.reduce((max, row) => Math.max(max, row.votes), 0);
	if (maxVotes < 1) {
		return { tally, topTokens: [], eliminated: null };
	}

	const topTokens = tally.filter((row) => row.votes === maxVotes).map((row) => row.token);
	return {
		tally,
		topTokens,
		eliminated: topTokens.length === 1 ? topTokens[0]! : null,
	};
}
