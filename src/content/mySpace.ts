/**
 * My Space hub — personal experiments, kept separate from the teaching portfolio.
 * Tiles stay coming-soon until a real destination exists (no empty public routes).
 */

import { routes } from '@/config/routes';

export type MySpaceTileStatus = 'published' | 'coming-soon';

export interface MySpaceTile {
	id: string;
	label: string;
	/** Optional line break for long labels on narrow screens */
	labelLines?: readonly [string, string];
	image: {
		src: string;
		alt: string;
	};
	status: MySpaceTileStatus;
	href?: string;
}

export const mySpacePage = {
	title: 'My Space',
	lead: 'Một góc riêng cho những thứ tôi thích làm ngoài lớp học.',
	comingSoonLabel: 'Đang phát triển',
	comingSoonNote: 'Góc này đang được hoàn thiện.',
} as const;

export const mySpaceTiles: MySpaceTile[] = [
	{
		id: 'boardgames',
		label: 'Boardgames',
		image: {
			src: '/brand/myspace/boardgames.png',
			alt: 'Minh họa xúc xắc — Boardgames',
		},
		status: 'coming-soon',
	},
	{
		id: 'podcast',
		label: 'Podcast',
		image: {
			src: '/brand/myspace/podcast.png',
			alt: 'Minh họa micro — Podcast',
		},
		status: 'coming-soon',
	},
	{
		id: 'tests',
		label: 'Tests',
		image: {
			src: '/brand/myspace/tests.png',
			alt: 'Minh họa bảng kiểm tra — Tests',
		},
		status: 'published',
		href: routes.mySpaceTests,
	},
	{
		id: 'personality-tests',
		label: 'Personality Tests',
		labelLines: ['Personality', 'Tests'],
		image: {
			src: '/brand/myspace/personality-tests.png',
			alt: 'Minh họa hai khuôn mặt — Personality Tests',
		},
		status: 'coming-soon',
	},
];
