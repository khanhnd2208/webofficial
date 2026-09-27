import {
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	SCAPEGOAT_MIN_PLAYERS,
	isPlayerCountAllowed,
	presetFor,
	type CheeseMode,
	type FollowerMode,
} from '@/features/cheese-thief/config/cheeseThief';
import { sharedChoiceCount } from '@/features/cheese-thief/lib/rules';

/** Who learns whom once followers are set. `pair` is one follower who knows the Thief. */
export type FollowerKnowledge = 'none' | 'witness' | 'pair' | 'followers-only' | 'all';

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
}

/** The how-to-play text reads from here, so it always matches the presets the game deals with. */
export function tableRulesFor(playerCount: number, mode: CheeseMode): TableRules | null {
	if (!isPlayerCountAllowed(playerCount, mode)) return null;
	const preset = presetFor(playerCount, mode);
	const knowledge: FollowerKnowledge =
		preset.followerMode === 'none'
			? 'none'
			: preset.followerMode === 'witness'
				? 'witness'
				: !preset.followersKnowThief
					? 'followers-only'
					: preset.followerPickCount > 1
						? 'all'
						: 'pair';
	return {
		playerCount,
		mode,
		dice: preset.dicePerPlayer === 2 ? 'two-pick' : mode === 'two-night' ? 'per-night' : 'one',
		peek: preset.peek,
		thiefPeeksAfterWaiting: preset.thiefPeeksAfterWaiting,
		followerMode: preset.followerMode,
		followerCount: preset.followerMode === 'pick' ? preset.followerPickCount : preset.followerMode === 'witness' ? 1 : 0,
		knowledge,
		choiceCount: sharedChoiceCount(preset, mode),
		scapegoatAllowed: playerCount >= SCAPEGOAT_MIN_PLAYERS,
	};
}

/** One row per table size, with whichever mode that size can play. Classic wins where both can. */
export function allTableSizes(): { playerCount: number; modes: CheeseMode[]; rules: TableRules }[] {
	const rows: { playerCount: number; modes: CheeseMode[]; rules: TableRules }[] = [];
	for (let count = CHEESE_MIN_PLAYERS; count <= CHEESE_MAX_PLAYERS; count++) {
		const modes = (['classic', 'two-night'] as const).filter((mode) => isPlayerCountAllowed(count, mode));
		const rules = tableRulesFor(count, modes[0]!);
		if (rules) rows.push({ playerCount: count, modes, rules });
	}
	return rows;
}
