import type { GamePhase } from '@/types/spyGame';

export interface PhasePlayer {
	token: string;
	hasMemorizedRole: boolean;
	hasSpoken: boolean;
	voteConfirmed: boolean;
	connected: boolean;
}

export interface PhaseContext {
	phase: GamePhase;
	playerCount: number;
	players: PhasePlayer[];
	allSpoken: boolean;
	hasRunoff: boolean;
	needsMrWhiteGuess: boolean;
	voteLocked: boolean;
	now: Date;
}

export interface PhaseAdvanceResult {
	nextPhase: GamePhase;
	reason: string;
}

export function allPlayersMemorized(players: PhasePlayer[]): boolean {
	return players.length > 0 && players.every((p) => p.hasMemorizedRole);
}

export function allPlayersSpoken(players: PhasePlayer[]): boolean {
	return players.length > 0 && players.every((p) => p.hasSpoken);
}

export function allVotesConfirmed(players: PhasePlayer[]): boolean {
	return players.length > 0 && players.every((p) => p.voteConfirmed);
}

/**
 * Auto-advance only when players finish role-reveal / opening.
 * Discussion, vote, and runoff always wait for host next.
 */
export function computePhaseAdvance(ctx: PhaseContext): PhaseAdvanceResult | null {
	const { phase } = ctx;

	switch (phase) {
		case 'role-reveal': {
			if (allPlayersMemorized(ctx.players)) {
				return {
					nextPhase: 'opening',
					reason: 'all-memorized',
				};
			}
			break;
		}

		case 'opening': {
			if (allPlayersSpoken(ctx.players)) {
				return {
					nextPhase: 'discussion',
					reason: 'all-spoken',
				};
			}
			break;
		}

		default:
			break;
	}

	return null;
}

export function startRunoffPhase(): PhaseAdvanceResult {
	return {
		nextPhase: 'runoff',
		reason: 'runoff-started',
	};
}

export function startMrWhiteGuessPhase(): PhaseAdvanceResult {
	return {
		nextPhase: 'mrwhite-guess',
		reason: 'mrwhite-guess-started',
	};
}

export function startResultPhase(): PhaseAdvanceResult {
	return {
		nextPhase: 'result',
		reason: 'game-ended',
	};
}

export function startVotePhase(): PhaseAdvanceResult {
	return {
		nextPhase: 'vote',
		reason: 'discussion-ended',
	};
}
