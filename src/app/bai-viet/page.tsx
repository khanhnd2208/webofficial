import Link from 'next/link';
import { Suspense } from 'react';

import BlogSearch from '@/components/BlogSearch';
import BlogFilterBar from '@/components/BlogFilterBar';
import EditorialMedia from '@/components/motion/EditorialMedia';
import {
	getAllPosts,
	getAllTags,
	getAllCategories,
	isJournalTaxonomyComplete,
} from '@/services/postService';
import { getPublishedCollections, JOURNAL_PILLARS } from '@/content/journal';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME } from '@/config/site';

export const revalidate = 60;

export const metadata = {
	title: `${EDITORIAL_NAME} Journal`,
	description: `${EDITORIAL_NAME} Journal — thư viện bài viết chọn lọc, quét theo chủ đề.`,
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

function displayTopic(category?: string | null): string | null {
	if (!category || category === 'Uncategorized') return null;
	return category;
}

export default async function BlogPage({
	searchParams,
}: {
	searchParams?: Promise<{ tag?: string; category?: string; sort?: string; page?: string; pillar?: string }>;
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

	const [result, tags, categories, featured] = await Promise.all([
		getAllPosts(page, limit, tag, category, sort, { pillarSlug: pillarFilter }),
		getAllTags(),
		getAllCategories(),
		getAllPosts(1, 3, undefined, undefined, 'newest', { featuredOnly: true }),
	]);

	const collections = getPublishedCollections();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-8 sm:py-10">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
								{EDITORIAL_NAME} Journal
							</p>
							<h1 className="mt-2 font-display type-page-title font-medium text-ink">Bài viết</h1>
							<p className="mt-2 font-mono text-xs text-ink-secondary" aria-live="polite">
								{result.total} bài
								{tag ? ` · #${tag}` : ''}
								{category ? ` · ${category}` : ''}
								{pillarFilter ? ` · ${pillarFilter}` : ''}
							</p>
						</div>
						<BlogSearch />
					</div>
				</div>
			</section>

			{featured.items.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-8">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-secondary">
							Editor’s choice
						</p>
						<ul className="mt-4 divide-y divide-hairline border-y border-hairline">
							{featured.items.map((post) => (
								<li key={post.slug}>
									<Link href={routes.post(post.slug)} className="block py-4 hover:text-vermilion">
										<span className="font-display text-lg font-medium text-ink">{post.title}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{collections.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-8">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-secondary">
							Collection nổi bật
						</p>
						<ul className="mt-4 grid gap-4 sm:grid-cols-2">
							{collections.map((c) => (
								<li key={c.slug} className="border-t border-hairline pt-4">
									<Link href={routes.postCollection(c.slug)} className="hover:text-vermilion">
										<span className="font-display text-lg font-medium text-ink">{c.title}</span>
										<span className="mt-1 block text-sm text-ink-secondary">{c.summary}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{taxonomyReady ? (
				<section className="border-b border-hairline">
					<div className="shell flex flex-wrap gap-3 py-6">
						<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">Pillar</span>
						{JOURNAL_PILLARS.map((p) => (
							<Link
								key={p.slug}
								href={`${routes.posts}?pillar=${p.slug}`}
								className={`text-xs font-semibold uppercase tracking-wider ${
									pillarFilter === p.slug ? 'text-vermilion' : 'text-ink-secondary hover:text-ink'
								}`}
							>
								{p.label}
							</Link>
						))}
					</div>
				</section>
			) : null}

			<Suspense fallback={null}>
				<BlogFilterBar
					allTags={tags}
					allCategories={categories}
					currentTag={tag}
					currentCategory={category}
					currentSort={sort}
					total={result.total}
				/>
			</Suspense>

			<section>
				<div className="shell py-8 sm:py-10">
					{result.items.length === 0 ? (
						<div className="py-16 text-center">
							<p className="font-display text-2xl font-medium text-ink sm:text-3xl">Không tìm thấy bài viết</p>
							<p className="mt-3 text-sm text-ink-secondary">
								{tag || category
									? 'Thử đổi chủ đề, tag hoặc xóa bộ lọc.'
									: 'Chưa có bài viết nào.'}
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
						<div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
							{result.items.map((post, i) => {
								const topic = displayTopic(post.category);
								const readTime = estimateRead(post.summary, post.wordCount);
								return (
									<article key={post.id} className="group">
										<Link
											href={routes.post(post.slug)}
											className="block rounded-[var(--radius-media)] outline-offset-4 transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion"
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
											<div className="mt-3.5">
												<p className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
													{topic ? <span className="text-vermilion">{topic}</span> : null}
													{topic ? <span aria-hidden>·</span> : null}
													<time dateTime={post.publishedAt ?? post.createdAt}>
														{formatDate(post.publishedAt ?? post.createdAt)}
													</time>
												</p>
												<h2 className="mt-1.5 line-clamp-2 font-display text-xl font-medium leading-snug text-ink transition-colors duration-200 group-hover:text-vermilion sm:text-[1.35rem]">
													{post.title}
												</h2>
												<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-secondary">
													{post.summary?.trim() || 'Mở bài để đọc toàn văn.'}
												</p>
												<p className="mt-3 font-mono text-[11px] text-ink-secondary">
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
									result.page <= 1 ? 'pointer-events-none opacity-30' : 'text-ink-secondary hover:text-ink'
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
