import Link from 'next/link';
import { Suspense } from 'react';

import BlogSearch from '@/components/BlogSearch';
import BlogFilterBar from '@/components/BlogFilterBar';
import EditorialMedia from '@/components/motion/EditorialMedia';
import { getAllPosts, getAllTags, getAllCategories } from '@/services/postService';
import { routes } from '@/config/routes';

export const revalidate = 60;

export const metadata = {
	title: 'Bài viết',
	description: 'Journal — bài viết chọn lọc của HANOICAM.',
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

function estimateRead(summary: string | null, wordCount?: number): string | null {
	if (wordCount && wordCount > 0) return `${Math.max(1, Math.round(wordCount / 200))} phút đọc`;
	if (!summary) return null;
	return `${Math.max(1, Math.round(summary.split(/\s+/).length / 40))} phút đọc`;
}

export default async function BlogPage({
	searchParams,
}: {
	searchParams?: Promise<{ tag?: string; category?: string; sort?: string; page?: string }>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const tag = sp?.tag?.trim() || undefined;
	const category = sp?.category?.trim() || undefined;
	const sort = sp?.sort?.trim() || undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const limit = 20;

	const [result, tags, categories] = await Promise.all([
		getAllPosts(page, limit, tag, category, sort),
		getAllTags(),
		getAllCategories(),
	]);

	const [lead, ...rest] = result.items;
	const filtered = !!(tag || category || sort);

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-8 sm:py-12 lg:py-14">
					<div className="flex flex-wrap items-end justify-between gap-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Bài viết</p>
							<h1 className="mt-2 font-display type-page-title font-medium text-ink">
								{tag ? `#${tag}` : category ? category : 'Bài viết'}
							</h1>
							<p className="mt-2 font-mono text-xs text-ink-secondary" aria-live="polite">
								{result.total} bài {tag ? `· tag “${tag}”` : category ? `· ${category}` : ''}
							</p>
						</div>
						<BlogSearch />
					</div>
				</div>
			</section>

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
				<div className="shell py-8 sm:py-12">
					{result.items.length === 0 ? (
						<div className="py-20 text-center">
							<p className="font-display text-3xl font-medium text-ink">Không tìm thấy bài viết</p>
							<p className="mt-3 text-sm text-ink-secondary">
								{tag ? `Không có bài viết nào với tag “${tag}”.` : 'Chưa có bài viết nào.'}
							</p>
							{(tag || category) && (
								<Link
									href={routes.posts}
									className="mt-6 inline-block text-sm font-semibold text-vermilion underline underline-offset-4"
								>
									Xem tất cả
								</Link>
							)}
						</div>
					) : (
						<div className="space-y-0 transition-opacity duration-[350ms]">
							{page === 1 && lead && !filtered ? (
								<article className="border-b border-hairline pb-12">
									<Link href={routes.post(lead.slug)} className="group grid gap-8 lg:grid-cols-12 lg:gap-12">
										<div className="lg:col-span-7">
											<EditorialMedia
												src={lead.thumbnailUrl}
												alt=""
												title={lead.title}
												kicker={lead.category}
												index={lead.chapterNumber ?? '01'}
												aspectRatio="16 / 10"
												priority
											/>
										</div>
										<div className="flex flex-col justify-center lg:col-span-5">
											{lead.category && lead.category !== 'Uncategorized' ? (
												<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vermilion">
													{lead.category}
												</p>
											) : null}
											<h2 className="mt-3 font-display text-3xl font-medium leading-tight text-ink transition-colors group-hover:text-vermilion sm:text-4xl lg:text-5xl">
												{lead.title}
											</h2>
											{lead.summary ? (
												<p className="mt-4 line-clamp-3 text-base leading-relaxed text-ink-secondary">
													{lead.summary}
												</p>
											) : null}
											<p className="mt-6 font-mono text-[11px] text-ink-secondary">
												<time>{formatDate(lead.publishedAt ?? lead.createdAt)}</time>
												{estimateRead(lead.summary, lead.wordCount)
													? ` · ${estimateRead(lead.summary, lead.wordCount)}`
													: ''}
											</p>
										</div>
									</Link>
								</article>
							) : null}

							<div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
								{(page === 1 && !filtered ? rest : result.items).map((post, i) => {
									const wide = i % 5 === 0;
									return (
										<article
											key={post.id}
											className={`group ${wide ? 'sm:col-span-2 lg:col-span-7' : 'lg:col-span-5'}`}
										>
											<Link href={routes.post(post.slug)} className="block">
												<EditorialMedia
													src={post.thumbnailUrl}
													alt=""
													title={post.title}
													kicker={post.category}
													index={post.chapterNumber ?? i + 2}
													aspectRatio={wide ? '16 / 10' : '4 / 5'}
												/>
												<div className="mt-4">
													{(post.category && post.category !== 'Uncategorized') || post.chapterNumber ? (
														<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
															{post.chapterNumber ? `Chương ${post.chapterNumber}` : null}
															{post.chapterNumber &&
															post.category &&
															post.category !== 'Uncategorized'
																? ' · '
																: null}
															{post.category && post.category !== 'Uncategorized' ? post.category : null}
														</p>
													) : null}
													<h2 className="mt-1.5 font-display text-xl font-medium leading-snug text-ink transition-colors group-hover:text-vermilion sm:text-2xl">
														{post.title}
													</h2>
													{post.summary ? (
														<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
															{post.summary}
														</p>
													) : null}
													<p className="mt-3 font-mono text-[11px] text-ink-secondary">
														<time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
														{estimateRead(post.summary, post.wordCount)
															? ` · ${estimateRead(post.summary, post.wordCount)}`
															: ''}
													</p>
												</div>
											</Link>
										</article>
									);
								})}
							</div>
						</div>
					)}

					{result.totalPages > 1 ? (
						<div className="mt-14 flex items-center justify-between border-t border-hairline pt-6">
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
