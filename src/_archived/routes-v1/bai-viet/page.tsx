import Link from 'next/link';
import { Suspense } from 'react';

import BlogSearch from '@/components/BlogSearch';
import BlogFilterBar from '@/components/BlogFilterBar';
import EditorialMedia from '@/components/motion/EditorialMedia';
import { SectionHeading } from '@/components/marketing';
import {
	getAllPosts,
	getAllTags,
	getAllCategories,
	isJournalTaxonomyComplete,
} from '@/services/postService';
import { getPublishedCollections, JOURNAL_PILLARS } from '@/content/journal';
import { displayCategoryLabel, getActivePublicCategories } from '@/features/posts/publicAdapter';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME } from '@/config/site';

export const revalidate = 60;

export const metadata = {
	title: 'Bài viết',
	description:
		'HANOICAM là góc viết của Duy Khánh về con người, công việc và những điều đang học từ đời sống.',
};

function buildQuery(params: { tag?: string; category?: string; sort?: string; page?: number }) {
	const sp = new URLSearchParams();
	if (params.tag) sp.set('tag', params.tag);
	if (params.category) sp.set('category', params.category);
	if (params.sort) sp.set('sort', params.sort);
	if (params.page && params.page > 1) sp.set('page', String(params.page));
	const q = sp.toString();
	return q ? `?${q}` : '';
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function estimateRead(summary: string | null, wordCount?: number): string {
	if (wordCount && wordCount > 0) return `${Math.max(1, Math.round(wordCount / 200))} phút đọc`;
	if (!summary) return '1 phút đọc';
	return `${Math.max(1, Math.round(summary.split(/\s+/).length / 40))} phút đọc`;
}

export default async function BlogPage({
	searchParams,
}: {
	searchParams?: Promise<{
		tag?: string;
		category?: string;
		sort?: string;
		page?: string;
		pillar?: string;
	}>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const tag = sp?.tag?.trim() || undefined;
	const category = sp?.category?.trim() || undefined;
	const sort = sp?.sort?.trim() || undefined;
	const pillar = sp?.pillar?.trim() || undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const limit = 12;

	const taxonomyReady = await isJournalTaxonomyComplete();
	const pillarFilter = taxonomyReady ? pillar : undefined;

	const [result, tags, categories, featured, postsForCategoryGate] = await Promise.all([
		getAllPosts(page, limit, tag, category, sort, { pillarSlug: pillarFilter }),
		getAllTags(),
		getAllCategories(),
		getAllPosts(1, 3, undefined, undefined, 'newest', { featuredOnly: true }),
		getAllPosts(1, 200),
	]);

	const collections = getPublishedCollections().filter((collection) =>
		postsForCategoryGate.items.some((post) => post.collectionSlugs?.includes(collection.slug)),
	);
	const activeCategorySet = new Set(getActivePublicCategories(postsForCategoryGate.items, 2));
	const activeCategories = categories.filter((c) => activeCategorySet.has(c));
	const hasDiscoveryChoices =
		postsForCategoryGate.total >= 6 || tags.length > 0 || activeCategories.length > 1;
	const isSingleResult = result.items.length === 1;

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline bg-canvas px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
				<div className="shell">
					<div className="flex flex-wrap items-end justify-between gap-10">
						<div>
							<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">
								{EDITORIAL_NAME}
							</p>
							<h1 className="mt-6 max-w-3xl text-balance font-display text-[clamp(3.25rem,7vw,6.5rem)] font-normal leading-[0.95] tracking-[-0.04em] text-ink">
								Những ghi chép đang mở.
							</h1>
							<p className="mt-8 max-w-2xl text-base font-light leading-[1.85] text-ink-secondary sm:text-lg">
								HANOICAM là góc viết của tôi về con người, công việc và những điều tôi đang học từ
								đời sống.
							</p>
							<p className="mt-5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-secondary" aria-live="polite">
								{result.total} bài
								{tag ? ` · #${tag}` : ''}
								{category ? ` · ${category}` : ''}
								{pillarFilter ? ` · ${pillarFilter}` : ''}
							</p>
						</div>
						{postsForCategoryGate.total >= 6 ? <BlogSearch /> : null}
					</div>
				</div>
			</section>

			{postsForCategoryGate.total >= 4 && featured.items.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-8">
						<SectionHeading title="Bài tôi chọn" variant="compact" />
						<ul className="mt-4 divide-y divide-hairline border-y border-hairline">
							{featured.items.map((post) => (
								<li key={post.slug}>
									<Link href={routes.post(post.slug)} className="block py-4 hover:text-accent">
										<span className="text-[1.0625rem] font-semibold text-ink">{post.title}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{collections.length > 0 ? (
				<section className="border-b border-hairline bg-paper">
					<div className="shell py-8">
						<SectionHeading title="Loạt bài" variant="compact" />
						<ul className="mt-4 grid gap-4 sm:grid-cols-2">
							{collections.map((c) => (
								<li key={c.slug} className="border-t border-hairline pt-4">
									<Link href={routes.postCollection(c.slug)} className="hover:text-accent">
										<span className="text-[1.0625rem] font-semibold text-ink">{c.title}</span>
										<span className="mt-1 block text-sm text-ink-secondary">{c.summary}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{taxonomyReady && hasDiscoveryChoices ? (
				<section className="border-b border-hairline">
					<div className="shell py-8">
						<SectionHeading title="Chủ đề" variant="compact" />
						<div className="mt-4 flex flex-wrap gap-3">
							{JOURNAL_PILLARS.map((p) => (
								<Link
									key={p.slug}
									href={`${routes.posts}?pillar=${p.slug}`}
									className={`text-xs font-semibold uppercase tracking-wider ${
										pillarFilter === p.slug
											? 'text-vermilion'
											: 'text-ink-secondary hover:text-ink'
									}`}
								>
									{p.label}
								</Link>
							))}
						</div>
					</div>
				</section>
			) : null}

			{hasDiscoveryChoices || tag || category || sort ? (
				<Suspense fallback={null}>
					<BlogFilterBar
						allTags={tags}
						allCategories={activeCategories}
						currentTag={tag}
						currentCategory={category}
						currentSort={sort}
						total={result.total}
					/>
				</Suspense>
			) : null}

			<section>
				<div className="shell py-16 sm:py-20 lg:py-28">
					{result.items.length === 0 ? (
						<div className="py-16 text-center">
							<p className="font-display type-section font-medium text-ink">
								Không tìm thấy bài viết
							</p>
							<p className="mt-3 text-sm text-ink-secondary">
								{tag || category ? 'Thử đổi chủ đề, thẻ hoặc xóa bộ lọc.' : 'Chưa có bài viết nào.'}
							</p>
							{(tag || category || sort) && (
								<Link
									href={routes.posts}
									className="mt-6 inline-block text-sm font-semibold text-vermilion underline underline-offset-4"
								>
									Xem tất cả
								</Link>
							)}
						</div>
					) : (
						<div
							className={`grid grid-cols-1 gap-x-12 gap-y-16 ${isSingleResult ? '' : 'md:grid-cols-2 lg:gap-x-16 lg:gap-y-24'}`}
						>
							{result.items.map((post, i) => {
								const topic = displayCategoryLabel(post.category);
								const readTime = estimateRead(post.summary, post.wordCount);
								return (
									<article key={post.id} className="group">
										<Link
											href={routes.post(post.slug)}
											className={`block rounded-[var(--radius-media)] outline-offset-4 transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion ${
												isSingleResult
													? 'md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:items-center md:gap-10'
													: ''
											}`}
										>
											<EditorialMedia
												src={post.thumbnailUrl}
												alt=""
												title={post.title}
												kicker={post.category}
												index={post.chapterNumber ?? i + 1}
												aspectRatio="16 / 10"
												priority={i < 2}
											/>
											<div className={isSingleResult ? 'mt-6 md:mt-0' : 'mt-6 border-t border-hairline pt-5'}>
												<p className="flex flex-wrap items-center gap-x-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
													{topic ? <span className="text-accent">{topic}</span> : null}
													{topic ? <span aria-hidden>·</span> : null}
													<time dateTime={post.publishedAt ?? post.createdAt}>
														{formatDate(post.publishedAt ?? post.createdAt)}
													</time>
												</p>
												<h2 className="mt-3 line-clamp-2 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.05] tracking-[-0.025em] text-ink transition-colors duration-200 group-hover:text-accent">
													{post.title}
												</h2>
												{post.summary?.trim() ? (
													<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-secondary">
														{post.summary.trim()}
													</p>
												) : null}
												<p className="mt-3 text-xs text-ink-secondary">
													{readTime}
													{post.chapterNumber != null ? ` · Chương ${post.chapterNumber}` : ''}
												</p>
											</div>
										</Link>
									</article>
								);
							})}
						</div>
					)}

					{result.totalPages > 1 ? (
						<div className="mt-12 flex items-center justify-between border-t border-hairline pt-6">
							<Link
								className={`inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider ${
									result.page <= 1
										? 'pointer-events-none opacity-30'
										: 'text-ink-secondary hover:text-ink'
								}`}
								href={`/bai-viet${buildQuery({ tag, category, sort, page: Math.max(1, result.page - 1) })}`}
							>
								← Trước
							</Link>
							<span className="font-mono text-xs text-ink-secondary">
								{result.page} / {result.totalPages}
							</span>
							<Link
								className={`inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider ${
									result.page >= result.totalPages
										? 'pointer-events-none opacity-30'
										: 'text-ink-secondary hover:text-ink'
								}`}
								href={`/bai-viet${buildQuery({
									tag,
									category,
									sort,
									page: Math.min(result.totalPages, result.page + 1),
								})}`}
							>
								Sau →
							</Link>
						</div>
					) : null}
				</div>
			</section>
		</main>
	);
}
