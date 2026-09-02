import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';

import { mySpaceTiles } from './mySpace';

describe('My Space operating hub', () => {
	it('contains only Teaching and Active Recall', () => {
		expect(mySpaceTiles.map((tile) => tile.id)).toEqual(['teaching', 'active-recall']);
		expect(mySpaceTiles.map((tile) => tile.href)).toEqual([
			routes.mySpaceTeaching,
			routes.activeRecall,
		]);
		expect(mySpaceTiles.every((tile) => tile.status === 'published')).toBe(true);
	});
});
