export interface VoteBallot {
	voterToken: string;
	vote1Token?: string;
	vote2Token?: string;
}

export interface VoteTally {
	token: string;
	totalVotes: number;
	topSuspectVotes: number;
}

export interface VoteResolution {
	/** Definitively selected tokens (may be partial if runoff needed) */
	selected: string[];
	/** If tie at cutoff, candidates for runoff + slots left */
	needsRunoff: boolean;
	runoffCandidates?: string[];
	slotsRemaining?: number;
	/** Full ranking for debug */
	tallies: VoteTally[];
	/** Trace of tie-break steps */
	trace: Array<{ step: string; detail: string; randomPick?: string[] }>;
}

function buildTallies(ballots: VoteBallot[], candidateTokens: string[]): VoteTally[] {
	const map = new Map<string, VoteTally>();
	for (const token of candidateTokens) {
		map.set(token, { token, totalVotes: 0, topSuspectVotes: 0 });
	}

	for (const ballot of ballots) {
		if (ballot.vote1Token && map.has(ballot.vote1Token)) {
			const t = map.get(ballot.vote1Token)!;
			t.totalVotes += 1;
			t.topSuspectVotes += 1;
		}
		if (ballot.vote2Token && map.has(ballot.vote2Token)) {
			const t = map.get(ballot.vote2Token)!;
			t.totalVotes += 1;
			t.topSuspectVotes += 1;
		}
	}

	return [...map.values()].sort((a, b) => {
		if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
		return b.topSuspectVotes - a.topSuspectVotes;
	});
}

/**
 * Resolve primary vote (spec §16–22).
 * Returns selected players or runoff info when tie straddles cutoff.
 */
export function resolvePrimaryVote(
	ballots: VoteBallot[],
	candidateTokens: string[],
	k: number,
): VoteResolution {
	const trace: VoteResolution['trace'] = [];
	const tallies = buildTallies(ballots, candidateTokens);

	if (k <= 0 || tallies.length === 0) {
		return { selected: [], needsRunoff: false, tallies, trace };
	}

	if (k >= tallies.length) {
		trace.push({ step: 'all-selected', detail: `K=${k} >= candidates, select all` });
		return {
			selected: tallies.map((t) => t.token),
			needsRunoff: false,
			tallies,
			trace,
		};
	}

	const selected: string[] = [];
	let i = 0;

	while (i < tallies.length && selected.length < k) {
		const current = tallies[i]!;
		const sameGroup: VoteTally[] = [current];

		let j = i + 1;
		while (
			j < tallies.length &&
			tallies[j]!.totalVotes === current.totalVotes &&
			tallies[j]!.topSuspectVotes === current.topSuspectVotes
		) {
			sameGroup.push(tallies[j]!);
			j++;
		}

		const slotsLeft = k - selected.length;

		if (sameGroup.length <= slotsLeft) {
			selected.push(...sameGroup.map((t) => t.token));
			trace.push({
				step: 'auto-select',
				detail: `${sameGroup.length} player(s) at rank ${i + 1} auto-selected`,
			});
			i = j;
		} else {
			// Tie straddles cutoff — need runoff among this group
			trace.push({
				step: 'runoff-needed',
				detail: `${sameGroup.length} tied at cutoff, need ${slotsLeft} slot(s)`,
			});
			return {
				selected,
				needsRunoff: true,
				runoffCandidates: sameGroup.map((t) => t.token),
				slotsRemaining: slotsLeft,
				tallies,
				trace,
			};
		}
	}

	return { selected, needsRunoff: false, tallies, trace };
}

export interface RunoffBallot {
	voterToken: string;
	choices: string[];
}

/**
 * Resolve runoff vote (spec §21 step 4–5).
 */
export function resolveRunoffVote(
	ballots: RunoffBallot[],
	candidateTokens: string[],
	slotsRemaining: number,
	random: () => number = Math.random,
): VoteResolution {
	const trace: VoteResolution['trace'] = [];
	const tallyMap = new Map<string, number>();
	for (const token of candidateTokens) {
		tallyMap.set(token, 0);
	}

	for (const ballot of ballots) {
		for (const choice of ballot.choices) {
			if (tallyMap.has(choice)) {
				tallyMap.set(choice, (tallyMap.get(choice) ?? 0) + 1);
			}
		}
	}

	const ranked = [...tallyMap.entries()]
		.map(([token, totalVotes]) => ({
			token,
			totalVotes,
			topSuspectVotes: 0,
		}))
		.sort((a, b) => b.totalVotes - a.totalVotes);

	const tallies: VoteTally[] = ranked;
	const selected: string[] = [];
	let i = 0;

	while (i < ranked.length && selected.length < slotsRemaining) {
		const current = ranked[i]!;
		const sameGroup = ranked.filter((r) => r.totalVotes === current.totalVotes);
		const slotsLeft = slotsRemaining - selected.length;

		if (sameGroup.length <= slotsLeft) {
			selected.push(...sameGroup.map((r) => r.token));
			i += sameGroup.length;
		} else {
			// Random tie-break (spec §21 step 5)
			const shuffled = [...sameGroup].sort(() => random() - 0.5);
			const picks = shuffled.slice(0, slotsLeft).map((r) => r.token);
			trace.push({
				step: 'random-tiebreak',
				detail: `Random pick among ${sameGroup.length} tied candidates`,
				randomPick: picks,
			});
			selected.push(...picks);
			break;
		}
	}

	return { selected, needsRunoff: false, tallies, trace };
}

/**
 * Full elimination resolution: primary vote then optional runoff.
 */
export function resolveElimination(
	primaryBallots: VoteBallot[],
	runoffBallots: RunoffBallot[] | null,
	candidateTokens: string[],
	k: number,
	random: () => number = Math.random,
): VoteResolution {
	const primary = resolvePrimaryVote(primaryBallots, candidateTokens, k);

	if (!primary.needsRunoff) {
		return primary;
	}

	if (!runoffBallots || primary.runoffCandidates == null || primary.slotsRemaining == null) {
		return primary;
	}

	const runoff = resolveRunoffVote(
		runoffBallots,
		primary.runoffCandidates,
		primary.slotsRemaining,
		random,
	);

	return {
		selected: [...primary.selected, ...runoff.selected],
		needsRunoff: false,
		tallies: primary.tallies,
		trace: [...primary.trace, ...runoff.trace],
	};
}
