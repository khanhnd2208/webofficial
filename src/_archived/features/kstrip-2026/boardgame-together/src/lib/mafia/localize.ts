import type { Faction } from '@/types/mafiaGame';

type T = (key: string, params?: Record<string, string | number>) => string;

export function roleName(roleId: string, t: T) {
	return t(`mafia.role.${roleId}.name`);
}

export function roleDescription(roleId: string, t: T) {
	return t(`mafia.role.${roleId}.desc`);
}

export function factionName(faction: Faction, t: T) {
	return t(`mafia.faction.${faction}`);
}

export function roleObjective(roleId: string, faction: Faction, t: T) {
	if (roleId === 'cupid') return t('mafia.objective.cupid');
	if (roleId === 'white_wolf' || roleId === 'serial_killer') return t('mafia.objective.lastSurvivor');
	return t(`mafia.objective.${faction}`);
}

export function privateInformation(info: string, t: T) {
	const [key, value] = info.split('|', 2);
	if (key === 'mafia.private.wolfTeam') {
		return t(key, { names: value ?? '' });
	}
	if (key?.startsWith('mafia.private.')) {
		return t(key);
	}
	return info;
}
