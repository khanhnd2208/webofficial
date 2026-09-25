import type { PlayerRole, WinningSide } from '@/features/spy-fall/types/spyGame';

export interface OutcomePlayer {
	role: PlayerRole;
	isEliminated: boolean;
}

/**
 * Civilians win once the Spy is out.
 * The Spy wins when living civilians are not more than living spies (two players left).
 * Otherwise the game goes on to another round.
 */
export function checkOutcome(players: OutcomePlayer[]): WinningSide | null {
	const alive = players.filter((p) => !p.isEliminated);
	const antagonists = alive.filter((p) => p.role === 'spy').length;
	const civilians = alive.filter((p) => p.role === 'civilian').length;

	if (antagonists === 0) return 'civilian';
	if (civilians <= antagonists) return 'antagonist';
	return null;
}
