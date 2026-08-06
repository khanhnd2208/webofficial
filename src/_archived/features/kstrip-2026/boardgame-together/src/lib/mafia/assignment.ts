import { getRoleById } from '@/config/mafiaGame';
import type { Faction, Player, RoleSelection } from '@/types/mafiaGame';

function shuffle<T>(arr: T[], random: () => number): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[copy[i], copy[j]] = [copy[j]!, copy[i]!];
	}
	return copy;
}

function buildRolePool(selections: RoleSelection[]): string[] {
	const pool: string[] = [];
	for (const sel of selections) {
		for (let i = 0; i < sel.count; i++) {
			pool.push(sel.roleId);
		}
	}
	return pool;
}

function getPlayerFaction(player: Player): Faction | null {
	if (!player.roleId) return null;
	return getRoleById(player.roleId)?.faction ?? null;
}

function computeWerewolfPrivateInfo(player: Player, allPlayers: Player[]): string {
	const teammates = allPlayers.filter((p) => {
		if (p.id === player.id || !p.roleId) return false;
		return getRoleById(p.roleId)?.faction === 'werewolf';
	});

	if (teammates.length === 0) {
		return 'mafia.private.wolfSolo';
	}
	const names = teammates.map((t) => t.name).join(', ');
	return `mafia.private.wolfTeam|${names}`;
}

function computePrivateInfo(player: Player, allPlayers: Player[]): string | null {
	const faction = getPlayerFaction(player);
	if (!faction) return null;

	if (faction === 'werewolf') {
		return computeWerewolfPrivateInfo(player, allPlayers);
	}
	if (faction === 'solo') {
		return 'mafia.private.solo';
	}
	if (player.roleId === 'villager') {
		return 'mafia.private.villager';
	}
	return null;
}

export interface AssignRolesInput {
	players: Player[];
	roleSelections: RoleSelection[];
	random?: () => number;
}

export function assignRoles({
	players,
	roleSelections,
	random = Math.random,
}: AssignRolesInput): Player[] {
	const rolePool = shuffle(buildRolePool(roleSelections), random);

	if (rolePool.length !== players.length) {
		throw new Error('Role count must match player count');
	}

	const assigned = players.map((player, i) => ({
		...player,
		roleId: rolePool[i]!,
		privateInformation: null as string | null,
	}));

	for (const player of assigned) {
		player.privateInformation = computePrivateInfo(player, assigned);
	}

	return assigned;
}

export function getViewedCount(players: Player[]): number {
	return players.filter((p) => p.viewStatus === 'VIEWED').length;
}

export function getNextPendingPlayer(players: Player[]): Player | undefined {
	return [...players]
		.sort((a, b) => a.seatOrder - b.seatOrder)
		.find((p) => p.viewStatus === 'PENDING');
}

export function getPlayerById(players: Player[], id: string): Player | undefined {
	return players.find((p) => p.id === id);
}

export function sortPlayersBySeat(players: Player[]): Player[] {
	return [...players].sort((a, b) => a.seatOrder - b.seatOrder);
}

export function findDuplicateNames(players: Player[]): string[] {
	const counts = new Map<string, number>();
	for (const p of players) {
		const trimmed = p.name.trim();
		if (!trimmed) continue;
		counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
	}
	return [...counts.entries()].filter(([, c]) => c > 1).map(([name]) => name);
}
