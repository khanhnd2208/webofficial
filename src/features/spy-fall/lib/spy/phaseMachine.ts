import type { GamePhase } from '@/features/spy-fall/types/spyGame';

export interface PhasePlayer {
	token: string;
	hasMemorizedRole: boolean;
}

export interface PhaseContext {
	phase: GamePhase;
	players: PhasePlayer[];
}

export interface PhaseAdvanceResult {
	nextPhase: GamePhase;
	reason: string;
}

export function allPlayersMemorized(players: PhasePlayer[]): boolean {
	return players.length > 0 && players.every((p) => p.hasMemorizedRole);
}

/** Only role-reveal advances on its own, once everyone has seen their word. */
export function computePhaseAdvance(ctx: PhaseContext): PhaseAdvanceResult | null {
	if (ctx.phase === 'role-reveal' && allPlayersMemorized(ctx.players)) {
		return { nextPhase: 'discussion', reason: 'all-memorized' };
	}
	return null;
}
