/** My Space hub — the two learning workspaces currently in operation. */

import { routes } from '@/config/routes';

export type MySpaceTileStatus = 'published' | 'coming-soon';

export interface MySpaceTile {
	id: string;
	label: string;
	/** Elevated rounded-square card instead of a flat icon tile (one per hub) */
	featured?: boolean;
	image: {
		src: string;
		alt: string;
	};
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
		image: {
			src: '/brand/myspace/my-class.svg',
			alt: 'Minh họa khu Teaching',
		},
		status: 'published',
		href: routes.mySpaceTeaching,
	},
	{
		id: 'active-recall',
		label: 'Active Recall',
		image: {
			src: '/brand/myspace/tests.png',
			alt: 'Biểu tượng thẻ câu hỏi Active Recall',
		},
		status: 'published',
		href: routes.activeRecall,
	},
];
