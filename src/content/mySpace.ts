/** My Space hub — the two learning workspaces currently in operation. */

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
}

export const mySpacePage = {
	title: 'My Space',
	lead: 'Teaching và Active Recall.',
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
			src: '/brand/myspace/my-class.svg',
			alt: 'Minh họa khu Teaching',
		},
		status: 'published',
		href: routes.mySpaceTeaching,
	},
	{
		id: 'active-recall',
		label: 'Active Recall',
		visual: {
			kind: 'cards',
			alt: 'Biểu tượng thẻ câu hỏi Active Recall',
		},
		status: 'published',
		href: routes.activeRecall,
	},
];

export const mySpaceAdminTile: MySpaceTile = {
	id: 'admin',
	label: 'Admin',
	visual: {
		kind: 'monogram',
		text: 'H',
		alt: 'Biểu tượng khu quản trị Admin',
	},
	status: 'published',
	href: routes.admin.home,
};

export function getMySpaceTiles(role?: UserRole | null): MySpaceTile[] {
	if (role === 'admin') {
		return [...mySpaceTiles, mySpaceAdminTile];
	}
	return mySpaceTiles;
}
