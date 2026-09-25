import type { PlayerRole } from '@/features/spy-fall/types/spyGame';
import {
	SPY_DEFAULT_COUNT,
	getRoleDistribution,
	type SpyCount,
} from '@/features/spy-fall/config/spyGame';

export interface AssignablePlayer {
	token: string;
	name: string;
}

export interface AssignedPlayer extends AssignablePlayer {
	role: PlayerRole;
	keyword: string;
}

export interface WordPair {
	civilianWord: string;
	spyWord: string;
}

export interface SpeakerCandidate {
	token: string;
	role?: PlayerRole;
	isEliminated?: boolean;
}

function shuffle<T>(arr: T[], random: () => number): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[copy[i], copy[j]] = [copy[j]!, copy[i]!];
	}
	return copy;
}

export function assignRoles(
	players: AssignablePlayer[],
	wordPair: WordPair,
	random: () => number = Math.random,
	spyCount: SpyCount = SPY_DEFAULT_COUNT,
): AssignedPlayer[] {
	const dist = getRoleDistribution(players.length, spyCount);
	const shuffled = shuffle(players, random);

	const roles: PlayerRole[] = [
		...Array(dist.spies).fill('spy' as const),
		...Array(dist.civilians).fill('civilian' as const),
	];

	const shuffledRoles = shuffle(roles, random);

	return shuffled.map((player, i) => {
		const role = shuffledRoles[i]!;
		return {
			...player,
			role,
			keyword: role === 'spy' ? wordPair.spyWord : wordPair.civilianWord,
		};
	});
}

/** First speaker is a random living player. */
export function pickFirstSpeaker(
	players: SpeakerCandidate[],
	random: () => number = Math.random,
): string {
	const pool = players.filter((p) => !p.isEliminated);
	if (pool.length === 0) {
		throw new Error('No eligible speaker');
	}
	const index = Math.floor(random() * pool.length);
	return pool[index]!.token;
}
