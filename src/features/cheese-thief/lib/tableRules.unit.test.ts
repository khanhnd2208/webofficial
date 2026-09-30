import { describe, expect, it } from 'vitest';

import { allTableSizes, tableRulesFor } from '@/features/cheese-thief/lib/tableRules';
import { en, vi } from '@/features/spy-fall/lib/i18n/messages';
import { translate, type MessageTree } from '@/features/spy-fall/lib/i18n/types';

function leafKeys(tree: MessageTree, prefix = ''): string[] {
	return Object.entries(tree).flatMap(([key, value]) =>
		typeof value === 'string' ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`),
	);
}

describe('how-to-play table rules', () => {
	it('matches the default follower table at each size', () => {
		expect(tableRulesFor(4, 'classic')).toMatchObject({
			dice: 'two-pick',
			peek: false,
			knowledge: 'none',
			choiceCount: 1,
			followerCustomized: false,
		});
		expect(tableRulesFor(5, 'classic')).toMatchObject({
			dice: 'one',
			peek: true,
			knowledge: 'pair',
			choiceCount: 1,
			followerCount: 1,
		});
		expect(tableRulesFor(6, 'classic')).toMatchObject({
			followerCount: 1,
			knowledge: 'pair',
			scapegoatAllowed: true,
		});
		expect(tableRulesFor(7, 'classic')).toMatchObject({
			followerCount: 2,
			knowledge: 'followers-only',
			choiceCount: 2,
		});
		expect(tableRulesFor(8, 'classic')).toMatchObject({
			followerCount: 2,
			knowledge: 'all',
			choiceCount: 2,
		});
		expect(tableRulesFor(9, 'classic')).toMatchObject({
			followerCount: 2,
			knowledge: 'all',
			maxFollowers: 3,
		});
	});

	it('reports sizes a mode cannot play as null', () => {
		expect(tableRulesFor(4, 'two-night')).toBeNull();
		expect(tableRulesFor(13, 'two-night')).toBeNull();
		expect(tableRulesFor(9, 'classic')).toMatchObject({ followerCount: 2 });
		expect(tableRulesFor(12, 'classic')).toMatchObject({
			dice: 'one',
			followerCount: 3,
			choiceCount: 3,
		});
		expect(tableRulesFor(12, 'two-night')).toMatchObject({
			dice: 'per-night',
			followerCount: 3,
			choiceCount: 3,
		});
		expect(tableRulesFor(6, 'two-night')).toMatchObject({ thiefPeeksAfterWaiting: true });
	});

	it('marks a host override, including one follower who does not learn the thief', () => {
		expect(tableRulesFor(6, 'classic', { count: 1, knowledge: 'team' })).toMatchObject({
			knowledge: 'blind',
			followerCustomized: true,
			defaultFollowerCount: 1,
			maxFollowers: 1,
			choiceCount: 1,
		});
		expect(tableRulesFor(8, 'classic', { count: 0 })).toMatchObject({
			knowledge: 'none',
			followerCustomized: true,
			defaultFollowerCount: 2,
			choiceCount: 1,
		});
	});

	it('lists every size from 4 to 12 once', () => {
		const rows = allTableSizes();
		expect(rows.map((row) => row.playerCount)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
		expect(rows.find((row) => row.playerCount === 4)?.modes).toEqual(['classic']);
		expect(rows.find((row) => row.playerCount === 5)?.modes).toEqual(['classic', 'two-night']);
		expect(rows.find((row) => row.playerCount === 12)?.modes).toEqual(['classic', 'two-night']);
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
