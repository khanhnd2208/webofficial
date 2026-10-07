import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';

import { getMySpaceTiles, mySpaceAdminTile, mySpaceTiles } from './mySpace';

describe('My Space operating hub', () => {
	it('shows Courses and Board Game to guests and students, Teaching only to admins', () => {
		expect(mySpaceTiles.map((tile) => tile.id)).toEqual(['teaching', 'courses', 'board-game']);
		expect(mySpaceTiles.map((tile) => tile.href)).toEqual([
			routes.mySpaceTeaching,
			routes.discoverCourses,
			routes.funGames,
		]);
		expect(mySpaceTiles.every((tile) => tile.status === 'published')).toBe(true);
		expect(mySpaceTiles.find((tile) => tile.id === 'board-game')?.note).toBe(
			'Đã chuyển vĩnh viễn sang fun.toiladuykhanh.com',
		);
		expect(getMySpaceTiles(null).map((tile) => tile.id)).toEqual(['courses', 'board-game']);
		expect(getMySpaceTiles('student').map((tile) => tile.id)).toEqual(['courses', 'board-game']);
	});

	it('appends Admin tile for admin users', () => {
		const adminTiles = getMySpaceTiles('admin');
		expect(adminTiles.map((tile) => tile.id)).toEqual(['teaching', 'courses', 'board-game', 'admin']);
		expect(adminTiles[3]).toEqual(mySpaceAdminTile);
		expect(mySpaceAdminTile.href).toBe(routes.admin.home);
		expect(mySpaceAdminTile.visual).toEqual({
			kind: 'image',
			src: '/brand/myspace/admin-v3.webp',
			alt: 'Biểu tượng khu quản trị Admin',
		});
	});
});
