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
	it('matches the rulebook at each classic size', () => {
		expect(tableRulesFor(4, 'classic')).toMatchObject({ dice: 'two-pick', peek: false, knowledge: 'none', choiceCount: 1 });
		expect(tableRulesFor(5, 'classic')).toMatchObject({ dice: 'one', peek: true, knowledge: 'witness', choiceCount: 1 });
		expect(tableRulesFor(6, 'classic')).toMatchObject({ followerCount: 1, knowledge: 'pair', scapegoatAllowed: true });
		expect(tableRulesFor(7, 'classic')).toMatchObject({ followerCount: 2, knowledge: 'followers-only', choiceCount: 2 });
		expect(tableRulesFor(8, 'classic')).toMatchObject({ followerCount: 2, knowledge: 'all', choiceCount: 2 });
	});

	it('reports sizes a mode cannot play as null', () => {
		expect(tableRulesFor(9, 'classic')).toBeNull();
		expect(tableRulesFor(4, 'two-night')).toBeNull();
		expect(tableRulesFor(13, 'two-night')).toBeNull();
		expect(tableRulesFor(12, 'two-night')).toMatchObject({ dice: 'per-night', followerCount: 3, choiceCount: 3 });
		expect(tableRulesFor(6, 'two-night')).toMatchObject({ thiefPeeksAfterWaiting: true });
	});

	it('lists every size from 4 to 12 once', () => {
		const rows = allTableSizes();
		expect(rows.map((row) => row.playerCount)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
		expect(rows.find((row) => row.playerCount === 4)?.modes).toEqual(['classic']);
		expect(rows.find((row) => row.playerCount === 6)?.modes).toEqual(['classic', 'two-night']);
		expect(rows.find((row) => row.playerCount === 10)?.modes).toEqual(['two-night']);
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
