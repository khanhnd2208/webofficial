/** My Space hub — Teaching (admins), Courses and Board Game. */

import { routes } from '@/config/routes';
import type { UserRole } from '@/types/user';

export type MySpaceTileStatus = 'published' | 'coming-soon';

export type MySpaceTileVisual =
	| {
			kind: 'image';
			src: string;
			alt: string;
	  }
	| {
			kind: 'cards';
			alt: string;
	  }
	| {
			kind: 'monogram';
			text: string;
			alt: string;
	  };

export interface MySpaceTile {
	id: string;
	label: string;
	/** Elevated rounded-square card instead of a flat icon tile (one per hub) */
	featured?: boolean;
	visual: MySpaceTileVisual;
	status: MySpaceTileStatus;
	href?: string;
	/** Only admins can open it, so nobody else sees it (they would only hit a wall). */
	adminOnly?: boolean;
}

export const mySpacePage = {
	title: 'My Space',
	lead: 'Teaching, khóa học và những trải nghiệm chơi cùng nhau.',
	comingSoonLabel: 'Đang phát triển',
	comingSoonNote: 'Góc này đang được hoàn thiện.',
} as const;

export const mySpaceTiles: MySpaceTile[] = [
	{
		id: 'teaching',
		label: 'Teaching',
		featured: true,
		visual: {
			kind: 'image',
			src: '/brand/myspace/teaching-v2.png',
			alt: 'Minh họa khu Teaching',
		},
		status: 'published',
		href: routes.mySpaceTeaching,
		adminOnly: true,
	},
	{
		id: 'courses',
		label: 'Khóa học',
		visual: {
			kind: 'image',
			src: '/brand/myspace/courses-v2.png',
			alt: 'Minh họa chồng tài liệu khóa học',
		},
		status: 'published',
		href: routes.learnCourses,
	},
	{
		id: 'board-game',
		label: 'Board Game',
		visual: {
			kind: 'image',
			src: '/brand/myspace/board-game-v2.png',
			alt: 'Minh họa bộ bài Board Game',
		},
		status: 'published',
		href: routes.boardGame,
	},
];

export const mySpaceAdminTile: MySpaceTile = {
	id: 'admin',
	label: 'Admin',
	visual: {
		kind: 'image',
		src: '/brand/myspace/admin-v2.png',
		alt: 'Biểu tượng khu quản trị Admin',
	},
	status: 'published',
	href: routes.admin.home,
};

export function getMySpaceTiles(role?: UserRole | null): MySpaceTile[] {
	if (role === 'admin') {
		return [...mySpaceTiles, mySpaceAdminTile];
	}
	return mySpaceTiles.filter((tile) => !tile.adminOnly);
}
