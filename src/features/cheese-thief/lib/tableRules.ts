import {
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	SCAPEGOAT_MIN_PLAYERS,
	followersAreCustom,
	isPlayerCountAllowed,
	presetFor,
	resolveFollowers,
	type FollowerKnows,
	type FollowerMode,
	type FollowerSettings,
} from '@/features/cheese-thief/config/cheeseThief';
import { sharedChoiceCount } from '@/features/cheese-thief/lib/rules';

/** Who learns whom once followers are set. `blind` is one follower who does not learn the Thief. */
export type FollowerKnowledge = 'none' | 'blind' | 'pair' | 'followers-only' | 'all';

export interface TableRules {
	playerCount: number;
	peek: boolean;
	followerMode: FollowerMode;
	followerCount: number;
	knowledge: FollowerKnowledge;
	choiceCount: number;
	scapegoatAllowed: boolean;
	followerCustomized: boolean;
	defaultFollowerCount: number;
	maxFollowers: number;
}

function knowledgeOf(count: number, knows: FollowerKnows): FollowerKnowledge {
	if (count <= 0) return 'none';
	if (knows === 'team') return count === 1 ? 'blind' : 'followers-only';
	return count === 1 ? 'pair' : 'all';
}

/** The how-to-play text reads from here, so it always matches the table the game deals. */
export function tableRulesFor(
	playerCount: number,
	followers?: FollowerSettings,
): TableRules | null {
	if (!isPlayerCountAllowed(playerCount)) return null;
	const resolved = resolveFollowers(playerCount, followers);
	const preset = presetFor(playerCount, followers);
	return {
		playerCount,
		peek: preset.peek,
		followerMode: preset.followerMode,
		followerCount: resolved.count,
		knowledge: knowledgeOf(resolved.count, resolved.knowledge),
		choiceCount: sharedChoiceCount(preset),
		scapegoatAllowed: playerCount >= SCAPEGOAT_MIN_PLAYERS,
		followerCustomized: followersAreCustom(resolved),
		defaultFollowerCount: resolved.defaultCount,
		maxFollowers: resolved.max,
	};
}

/** One row per table size, from 4 to 12. */
export function allTableSizes(): { playerCount: number; rules: TableRules }[] {
	const rows: { playerCount: number; rules: TableRules }[] = [];
	for (let count = CHEESE_MIN_PLAYERS; count <= CHEESE_MAX_PLAYERS; count++) {
		const rules = tableRulesFor(count);
		if (rules) rows.push({ playerCount: count, rules });
	}
	return rows;
}
