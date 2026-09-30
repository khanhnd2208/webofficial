import {
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	SCAPEGOAT_MIN_PLAYERS,
	followersAreCustom,
	isPlayerCountAllowed,
	presetFor,
	resolveFollowers,
	type CheeseMode,
	type FollowerKnows,
	type FollowerMode,
	type FollowerSettings,
} from '@/features/cheese-thief/config/cheeseThief';
import { sharedChoiceCount } from '@/features/cheese-thief/lib/rules';

/** Who learns whom once followers are set. `blind` is one follower who does not learn the Thief. */
export type FollowerKnowledge = 'none' | 'blind' | 'pair' | 'followers-only' | 'all';

export interface TableRules {
	playerCount: number;
	mode: CheeseMode;
	/** `two-pick`: 4 players, two dice each. `per-night`: one hour for each night. */
	dice: 'two-pick' | 'one' | 'per-night';
	peek: boolean;
	thiefPeeksAfterWaiting: boolean;
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
	mode: CheeseMode,
	followers?: FollowerSettings,
): TableRules | null {
	if (!isPlayerCountAllowed(playerCount, mode)) return null;
	const resolved = resolveFollowers(playerCount, followers);
	const preset = presetFor(playerCount, mode, followers);
	return {
		playerCount,
		mode,
		dice: preset.dicePerPlayer === 2 ? 'two-pick' : mode === 'two-night' ? 'per-night' : 'one',
		peek: preset.peek,
		thiefPeeksAfterWaiting: preset.thiefPeeksAfterWaiting,
		followerMode: preset.followerMode,
		followerCount: resolved.count,
		knowledge: knowledgeOf(resolved.count, resolved.knowledge),
		choiceCount: sharedChoiceCount(preset, mode),
		scapegoatAllowed: playerCount >= SCAPEGOAT_MIN_PLAYERS,
		followerCustomized: followersAreCustom(resolved),
		defaultFollowerCount: resolved.defaultCount,
		maxFollowers: resolved.max,
	};
}

/** One row per table size. One night is always available; two nights joins from 5 players. */
export function allTableSizes(): { playerCount: number; modes: CheeseMode[]; rules: TableRules }[] {
	const rows: { playerCount: number; modes: CheeseMode[]; rules: TableRules }[] = [];
	for (let count = CHEESE_MIN_PLAYERS; count <= CHEESE_MAX_PLAYERS; count++) {
		const modes = (['classic', 'two-night'] as const).filter((mode) =>
			isPlayerCountAllowed(count, mode),
		);
		const rules = tableRulesFor(count, modes[0]!);
		if (rules) rows.push({ playerCount: count, modes, rules });
	}
	return rows;
}
