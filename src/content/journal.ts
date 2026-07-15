/** Journal taxonomy — additive; legacy category/tags remain. */

export const JOURNAL_PILLARS = [
	{ slug: 'management-people', label: 'Quản trị & con người' },
	{ slug: 'business-marketing', label: 'Kinh doanh & marketing' },
	{ slug: 'ai-knowledge-work', label: 'AI & công việc tri thức' },
	{ slug: 'learning-teaching', label: 'Học & giảng dạy' },
	{ slug: 'personal-notes', label: 'Ghi chú cá nhân' },
] as const;

export type JournalPillarSlug = (typeof JOURNAL_PILLARS)[number]['slug'];

export const JOURNAL_CONTENT_TYPES = [
	{ slug: 'essay', label: 'Tiểu luận' },
	{ slug: 'guide', label: 'Hướng dẫn' },
	{ slug: 'framework', label: 'Khung thực hành' },
	{ slug: 'case-analysis', label: 'Phân tích tình huống' },
	{ slug: 'field-note', label: 'Ghi chép thực địa' },
	{ slug: 'review', label: 'Cảm nhận và đánh giá' },
	{ slug: 'reflection', label: 'Suy ngẫm' },
] as const;

export type JournalContentType = (typeof JOURNAL_CONTENT_TYPES)[number]['slug'];

/** Editorial collections — expand when owner defines more. */
export const JOURNAL_COLLECTIONS = [
	{
		slug: 'hieu-dung-ket-noi',
		title: 'Hiểu đúng → Kết nối',
		summary: 'Những bài viết về cách hiểu rõ vấn đề trước khi hành động.',
		status: 'published' as const,
	},
	{
		slug: 'hoc-co-dau-vet',
		title: 'Học có dấu vết',
		summary: 'Những ghi chép về cách việc học đi vào quyết định và hành động.',
		status: 'published' as const,
	},
] as const;

export function getPillarLabel(slug?: string | null): string | null {
	if (!slug) return null;
	return JOURNAL_PILLARS.find((p) => p.slug === slug)?.label ?? null;
}

export function getContentTypeLabel(slug?: string | null): string | null {
	if (!slug) return null;
	return JOURNAL_CONTENT_TYPES.find((t) => t.slug === slug)?.label ?? null;
}

export function getPublishedCollections() {
	return JOURNAL_COLLECTIONS.filter((c) => c.status === 'published');
}

export function getCollectionBySlug(slug: string) {
	return getPublishedCollections().find((c) => c.slug === slug);
}

/** Suggested mapping from legacy category → pillar (for dry-run migration). */
export const LEGACY_CATEGORY_TO_PILLAR: Record<string, JournalPillarSlug> = {
	'Tech & Programming': 'ai-knowledge-work',
	'English Learning': 'learning-teaching',
	Tutorial: 'learning-teaching',
	'Life & Thoughts': 'personal-notes',
	Review: 'personal-notes',
	'Tips & Tricks': 'learning-teaching',
	Uncategorized: 'personal-notes',
};
