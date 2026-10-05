import { describe, expect, it } from 'vitest';

import { allTableSizes, tableRulesFor } from '@/features/cheese-thief/lib/tableRules';
import { en, vi } from '@/features/board-game-shared/lib/i18n/messages';
import { translate, type MessageTree } from '@/features/board-game-shared/lib/i18n/types';

function leafKeys(tree: MessageTree, prefix = ''): string[] {
	return Object.entries(tree).flatMap(([key, value]) =>
		typeof value === 'string' ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`),
	);
}

describe('how-to-play table rules', () => {
	it('matches the default follower table at each size', () => {
		expect(tableRulesFor(4)).toMatchObject({
			peek: false,
			knowledge: 'none',
			choiceCount: 1,
			followerCustomized: false,
			followerCount: 0,
		});
		expect(tableRulesFor(5)).toMatchObject({
			peek: true,
			knowledge: 'pair',
			choiceCount: 1,
			followerCount: 1,
		});
		expect(tableRulesFor(6)).toMatchObject({
			followerCount: 1,
			knowledge: 'pair',
			scapegoatAllowed: true,
		});
		expect(tableRulesFor(7)).toMatchObject({
			followerCount: 2,
			knowledge: 'followers-only',
			choiceCount: 2,
		});
		expect(tableRulesFor(8)).toMatchObject({
			followerCount: 2,
			knowledge: 'all',
			choiceCount: 2,
		});
		expect(tableRulesFor(9)).toMatchObject({
			followerCount: 2,
			knowledge: 'all',
			maxFollowers: 3,
		});
	});

	it('rejects a size the table cannot play', () => {
		expect(tableRulesFor(3)).toBeNull();
		expect(tableRulesFor(13)).toBeNull();
		expect(tableRulesFor(12)).toMatchObject({
			followerCount: 3,
			choiceCount: 3,
		});
	});

	it('marks a host override, including one follower who does not learn the thief', () => {
		expect(tableRulesFor(6, { count: 1, knowledge: 'team' })).toMatchObject({
			knowledge: 'blind',
			followerCustomized: true,
			defaultFollowerCount: 1,
			maxFollowers: 1,
			choiceCount: 1,
		});
		expect(tableRulesFor(8, { count: 0 })).toMatchObject({
			knowledge: 'none',
			followerCustomized: true,
			defaultFollowerCount: 2,
			choiceCount: 1,
		});
	});

	it('lists every size from 4 to 12 once', () => {
		const rows = allTableSizes();
		expect(rows.map((row) => row.playerCount)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
		expect(rows.find((row) => row.playerCount === 4)?.rules.peek).toBe(false);
		expect(rows.find((row) => row.playerCount === 4)?.rules.followerCount).toBe(0);
	});

	it('has every guide line in both languages', () => {
		const viGuide = (vi.cheese as MessageTree).guide as MessageTree;
		const enGuide = (en.cheese as MessageTree).guide as MessageTree;
		expect(leafKeys(enGuide).sort()).toEqual(leafKeys(viGuide).sort());
		for (const key of leafKeys(viGuide)) {
			expect(translate(vi, `cheese.guide.${key}`)).not.toBe(`cheese.guide.${key}`);
		}
	});
});
