import type { RoleCount } from '@/features/werewolf/types';

export function canonicalRoleCounts(counts: RoleCount[]): string {
	return JSON.stringify(
		[...counts]
			.filter((entry) => entry.count > 0)
			.map((entry) => ({ roleId: entry.roleId, count: entry.count }))
			.sort((a, b) => a.roleId.localeCompare(b.roleId)),
	);
}

export type RoleDraftAction = 'ignore' | 'adopt' | 'caught-up';

/**
 * The host's +/- draft stays in charge until the save lands.
 * Polling must not replace it, including a late response that still has the old deck.
 */
export function reconcileRoleDraft(input: {
	dirty: boolean;
	holdKey: string | null;
	seenServer: string;
	serverKey: string;
}): RoleDraftAction {
	if (input.dirty) return 'ignore';
	if (input.holdKey) return input.serverKey === input.holdKey ? 'caught-up' : 'ignore';
	if (input.serverKey !== input.seenServer) return 'adopt';
	return 'ignore';
}
