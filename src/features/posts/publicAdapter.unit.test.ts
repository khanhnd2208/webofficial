import { describe, expect, it } from 'vitest';

import {
	getActivePublicCategories,
	displayCategoryLabel,
	readingTimeFromWordCount,
	selectHomeArticles,
	toPublicPostCard,
} from '@/features/posts/publicAdapter';
import type { PostListItemDTO } from '@/types/post';

function post(
	partial: Partial<PostListItemDTO> & Pick<PostListItemDTO, 'id' | 'title' | 'slug'>,
): PostListItemDTO {
	return {
		summary: '',
		category: '',
		tags: [],
		isPinned: false,
		wordCount: 400,
		views: 0,
		reactions: { like: 0, love: 0, fire: 0, clap: 0 },
		createdAt: new Date().toISOString(),
		...partial,
	};
}

describe('publicAdapter', () => {
	it('maps mongo fields to public card shape', () => {
		const card = toPublicPostCard(
			post({
				id: '1',
				title: 'Hello',
				slug: 'hello',
				thumbnailUrl: '/x.jpg',
				isFeatured: true,
				wordCount: 600,
			}),
		);
		expect(card.coverImage).toBe('/x.jpg');
		expect(card.featured).toBe(true);
		expect(card.draft).toBe(false);
		expect(card.readingTime).toBe(3);
	});

	it('computes reading time from word count', () => {
		expect(readingTimeFromWordCount(0)).toBe(1);
		expect(readingTimeFromWordCount(200)).toBe(1);
		expect(readingTimeFromWordCount(450)).toBe(2);
	});

	it('selects featured then latest companions', () => {
		const posts = [
			post({ id: '1', title: 'a', slug: 'a' }),
			post({ id: '2', title: 'b', slug: 'b', isFeatured: true }),
		];
		expect(selectHomeArticles(posts).featured?.id).toBe('2');
		expect(selectHomeArticles([]).featured).toBeNull();
	});

	it('only returns categories with enough posts', () => {
		expect(getActivePublicCategories([{ category: 'X' }], 2)).toEqual([]);
		expect(getActivePublicCategories([{ category: 'X' }, { category: 'X' }], 2)).toEqual(['X']);
	});

	it('shows legacy English categories with natural Vietnamese labels', () => {
		expect(displayCategoryLabel('Life & Thoughts')).toBe('Ghi chép về cuộc sống');
		expect(displayCategoryLabel('Uncategorized')).toBeNull();
		expect(displayCategoryLabel('Giáo dục')).toBe('Giáo dục');
	});
});
