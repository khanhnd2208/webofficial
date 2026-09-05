import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';

import { getMySpaceTiles, mySpaceAdminTile, mySpaceTiles } from './mySpace';

describe('My Space operating hub', () => {
	it('contains only Teaching and Active Recall for guests and students', () => {
		expect(mySpaceTiles.map((tile) => tile.id)).toEqual(['teaching', 'active-recall']);
		expect(mySpaceTiles.map((tile) => tile.href)).toEqual([
			routes.mySpaceTeaching,
			routes.activeRecall,
		]);
		expect(mySpaceTiles.every((tile) => tile.status === 'published')).toBe(true);
		expect(getMySpaceTiles(null).map((tile) => tile.id)).toEqual(['teaching', 'active-recall']);
		expect(getMySpaceTiles('student').map((tile) => tile.id)).toEqual([
			'teaching',
			'active-recall',
		]);
	});

	it('appends Admin tile for admin users', () => {
		const adminTiles = getMySpaceTiles('admin');
		expect(adminTiles.map((tile) => tile.id)).toEqual(['teaching', 'active-recall', 'admin']);
		expect(adminTiles[2]).toEqual(mySpaceAdminTile);
		expect(mySpaceAdminTile.href).toBe(routes.admin.home);
		expect(mySpaceAdminTile.visual).toEqual({
			kind: 'monogram',
			text: 'H',
			alt: 'Biểu tượng khu quản trị Admin',
		});
	});
});
