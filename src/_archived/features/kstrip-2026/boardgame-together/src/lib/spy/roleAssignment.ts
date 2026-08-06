import type { PlayerRole } from '@/types/spyGame';
import { getRoleDistribution } from '@/config/spyGame';

export interface AssignablePlayer {
	token: string;
	name: string;
}

export interface AssignedPlayer extends AssignablePlayer {
	role: PlayerRole;
	keyword?: string;
	teammateName?: string;
}

export interface WordPair {
	civilianWord: string;
	spyWord: string;
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
	hideRoles = false,
): AssignedPlayer[] {
	const dist = getRoleDistribution(players.length, hideRoles);
	const shuffled = shuffle(players, random);

	const roles: PlayerRole[] = [
		...Array(dist.spies).fill('spy' as const),
		...Array(dist.mrWhites).fill('mrwhite' as const),
		...Array(dist.civilians).fill('civilian' as const),
	];

	const shuffledRoles = shuffle(roles, random);

	let spyName: string | undefined;
	let mrWhiteName: string | undefined;

	const assigned = shuffled.map((player, i) => {
		const role = shuffledRoles[i]!;
		const result: AssignedPlayer = { ...player, role };

		if (role === 'civilian') {
			result.keyword = wordPair.civilianWord;
		} else if (role === 'spy') {
			result.keyword = wordPair.spyWord;
			spyName = player.name;
		} else {
			mrWhiteName = player.name;
		}

		return result;
	});

	// Wire teammate names
	for (const p of assigned) {
		if (p.role === 'spy' && mrWhiteName) {
			p.teammateName = mrWhiteName;
		}
		if (p.role === 'mrwhite' && spyName) {
			p.teammateName = spyName;
		}
	}

	return assigned;
}

export function pickFirstSpeaker(
	players: AssignablePlayer[],
	random: () => number = Math.random,
): string {
	const index = Math.floor(random() * players.length);
	return players[index]!.token;
}
