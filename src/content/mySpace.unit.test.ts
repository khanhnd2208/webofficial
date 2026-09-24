import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';

import { getMySpaceTiles, mySpaceAdminTile, mySpaceTiles } from './mySpace';

describe('My Space operating hub', () => {
	it('contains Teaching and Courses for guests and students', () => {
		expect(mySpaceTiles.map((tile) => tile.id)).toEqual(['teaching', 'courses']);
		expect(mySpaceTiles.map((tile) => tile.href)).toEqual([routes.mySpaceTeaching, routes.learnCourses]);
		expect(mySpaceTiles.every((tile) => tile.status === 'published')).toBe(true);
		expect(getMySpaceTiles(null).map((tile) => tile.id)).toEqual(['teaching', 'courses']);
		expect(getMySpaceTiles('student').map((tile) => tile.id)).toEqual(['teaching', 'courses']);
	});

	it('appends Admin tile for admin users', () => {
		const adminTiles = getMySpaceTiles('admin');
		expect(adminTiles.map((tile) => tile.id)).toEqual(['teaching', 'courses', 'admin']);
		expect(adminTiles[2]).toEqual(mySpaceAdminTile);
		expect(mySpaceAdminTile.href).toBe(routes.admin.home);
		expect(mySpaceAdminTile.visual).toEqual({
			kind: 'monogram',
			text: 'H',
			alt: 'Biểu tượng khu quản trị Admin',
		});
	});
});
