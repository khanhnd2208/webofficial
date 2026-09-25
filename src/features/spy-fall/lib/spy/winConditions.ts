import type { GameEndReason, PlayerRole, WinningSide } from '@/features/spy-fall/types/spyGame';

export interface OutcomePlayer {
	role: PlayerRole;
	isEliminated: boolean;
}

export interface GameOutcome {
	winningSide: WinningSide;
	reason: GameEndReason;
}

function livingCounts(players: OutcomePlayer[]) {
	const alive = players.filter((p) => !p.isEliminated);
	return {
		spies: alive.filter((p) => p.role === 'spy').length,
		civilians: alive.filter((p) => p.role === 'civilian').length,
	};
}

/**
 * Settles the table after someone leaves mid-game, when no vote decided it.
 * Civilians win once no Spy is left; the Spies win once Civilians can no longer outvote them.
 */
export function checkOutcome(players: OutcomePlayer[]): GameOutcome | null {
	const { spies, civilians } = livingCounts(players);
	if (spies === 0) return { winningSide: 'civilian', reason: 'spies-gone' };
	if (civilians <= spies) return { winningSide: 'antagonist', reason: 'outnumbered' };
	return null;
}

/**
 * Every vote must catch a Spy. `players` already reflects this vote's elimination.
 * - Nobody out (a second tie, or no ballots) or a Civilian out: the Spies win.
 * - A Spy out and none left: the Civilians win.
 * - A Spy out with another still hidden: one more round to find them.
 */
export function resolveVoteOutcome(
	eliminatedRole: PlayerRole | null,
	players: OutcomePlayer[],
): GameOutcome | null {
	if (eliminatedRole == null) return { winningSide: 'antagonist', reason: 'no-elimination' };
	if (eliminatedRole === 'civilian') return { winningSide: 'antagonist', reason: 'wrong-vote' };

	const { spies, civilians } = livingCounts(players);
	if (spies === 0) return { winningSide: 'civilian', reason: 'all-spies-caught' };
	if (civilians <= spies) return { winningSide: 'antagonist', reason: 'outnumbered' };
	return null;
}
