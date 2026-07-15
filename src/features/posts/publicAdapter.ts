import type { PostListItemDTO } from '@/types/post';

const PUBLIC_CATEGORY_LABELS: Record<string, string> = {
	'Life & Thoughts': 'Ghi chép về cuộc sống',
	'Tech & Programming': 'Công nghệ và lập trình',
	'English Learning': 'Học tiếng Anh',
	'Tips & Tricks': 'Gợi ý thực hành',
	Tutorial: 'Hướng dẫn',
	Review: 'Cảm nhận và đánh giá',
	Uncategorized: 'Ghi chép khác',
};

export function displayCategoryLabel(category?: string | null): string | null {
	const value = category?.trim();
	if (!value || value === 'Uncategorized') return null;
	return PUBLIC_CATEGORY_LABELS[value] ?? value;
}

/** Public writing card shape — adapter over Mongo post DTOs. */
export type PublicPostCard = {
	id: string;
	title: string;
	slug: string;
	summary?: string;
	coverImage?: string;
	featured: boolean;
	draft: boolean;
	readingTime: number;
	category?: string;
	publishedAt?: string | null;
};

export function readingTimeFromWordCount(wordCount?: number | null): number {
	const words = Math.max(0, wordCount ?? 0);
	return Math.max(1, Math.round(words / 200));
}

export function toPublicPostCard(post: PostListItemDTO): PublicPostCard {
	return {
		id: post.id,
		title: post.title,
		slug: post.slug,
		summary: post.summary,
		coverImage: post.thumbnailUrl || undefined,
		featured: Boolean(post.isFeatured),
		draft: false,
		readingTime: readingTimeFromWordCount(post.wordCount),
		category: post.category || undefined,
		publishedAt: post.publishedAt ?? null,
	};
}

/** Categories with at least `minCount` posts — used for public filter visibility. */
export function getActivePublicCategories(
	posts: Array<{ category?: string | null }>,
	minCount = 2,
): string[] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		const cat = post.category?.trim();
		if (!cat) continue;
		counts.set(cat, (counts.get(cat) ?? 0) + 1);
	}
	return [...counts.entries()]
		.filter(([, n]) => n >= minCount)
		.map(([cat]) => cat)
		.sort((a, b) => a.localeCompare(b, 'vi'));
}

export function selectHomeArticles(posts: PostListItemDTO[]): {
	featured: PostListItemDTO | null;
	latest: PostListItemDTO[];
} {
	if (posts.length === 0) return { featured: null, latest: [] };
	const featured = posts.find((p) => p.isFeatured) ?? posts[0] ?? null;
	const latest = posts.filter((p) => p.id !== featured?.id).slice(0, 2);
	return { featured, latest };
}
