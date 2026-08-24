/**
 * My Space hub — personal experiments, including the knowledge workspace and
 * the private Teaching workspace.
 */

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
		id: 'active-recall',
		label: 'Active Recall',
		image: {
			src: '/brand/myspace/tests.png',
			alt: 'Biểu tượng thẻ câu hỏi Active Recall',
		},
		status: 'published',
		href: routes.activeRecall,
	},
	{
		id: 'my-class',
		label: 'Kho kiến thức',
		featured: true,
		image: {
			src: '/brand/myspace/my-class.svg',
			alt: 'Minh họa cuốn giáo trình — My Class',
		},
		status: 'published',
		href: routes.myClass,
	},
	{
		id: 'personality-tests',
		label: 'Personality Tests',
		image: {
			src: '/brand/myspace/personality-tests.png',
			alt: 'Minh họa hai khuôn mặt — Personality Tests',
		},
		status: 'coming-soon',
	},
];
