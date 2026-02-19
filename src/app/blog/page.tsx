import Link from 'next/link';
import { Suspense } from 'react';

import BlogSearch from '@/components/BlogSearch';
import BlogFilterBar from '@/components/BlogFilterBar';
import ThumbnailPreview from '@/components/ThumbnailPreview';
import { getAllPosts, getAllTags, getAllCategories } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: 'Tất cả Chapters | HANOICAM',
	description: 'Danh sách tất cả chapters — HANOICAM.',
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

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
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

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<Link href="/" className="text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground">
								← Trang chủ
							</Link>
							<h1 className="mt-3 font-serif text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								{tag ? `#${tag}` : category ? category : 'Tất cả Chapters'}
							</h1>
							<p className="mt-2 font-mono text-xs text-muted">
								{result.total} chapters {tag ? `với tag "${tag}"` : category ? `trong "${category}"` : ''}
							</p>
						</div>
						<BlogSearch />
					</div>
				</div>
			</section>

			{/* Smart Filter Bar */}
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

			{/* Posts — Grid layout */}
			<section>
				<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
					{result.items.length === 0 ? (
						<div className="py-24 text-center">
							<p className="font-serif text-xl font-bold text-foreground">Không tìm thấy bài viết</p>
							<p className="mt-3 text-sm text-muted">
								{tag ? `Không có bài viết nào với tag "${tag}".` : 'Chưa có bài viết nào.'}
							</p>
							{tag ? (
								<Link href="/blog" className="mt-5 inline-block text-sm font-bold text-accent underline underline-offset-4">
									Xem tất cả
								</Link>
							) : null}
						</div>
					) : (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{result.items.map((post) => (
								<article key={post.id} className="group">
									<Link href={`/blog/${post.slug}`} className="block">
										{/* Thumbnail */}
										{post.thumbnailUrl ? (
											<ThumbnailPreview src={post.thumbnailUrl} alt={post.title}>
												<div className="aspect-2/1 overflow-hidden rounded-xl bg-surface-hover">
													<img
														src={post.thumbnailUrl}
														alt={post.title}
														className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
														loading="lazy"
													/>
												</div>
											</ThumbnailPreview>
										) : (
											<div className="flex aspect-2/1 items-center justify-center rounded-xl bg-surface-secondary">
												{post.chapterNumber ? (
													<span className="font-serif text-3xl font-black text-border-strong">
														{post.chapterNumber}
													</span>
												) : (
													<span className="text-2xl text-border-strong">—</span>
												)}
											</div>
										)}

										{/* Text */}
										<div className="mt-3.5">
											<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
												{post.chapterNumber ? (
													<span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-accent">
														Ch. {post.chapterNumber}
													</span>
												) : null}
												{post.category && post.category !== 'Uncategorized' ? (
													<span className="text-[10px] font-bold uppercase tracking-widest text-foreground-secondary">
														{post.category}
													</span>
												) : null}
											</div>
											<h2 className="mt-1 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
												{post.title}
											</h2>
											{post.summary ? (
												<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
													{post.summary}
												</p>
											) : null}
											<div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
												<time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
												{post.views > 0 ? (
													<>
														<span>·</span>
														<span>{formatNumber(post.views)} views</span>
													</>
												) : null}
												{post.tags.length > 0 ? (
													<>
														<span>·</span>
														{post.tags.slice(0, 3).map((t) => (
															<span key={t} className="text-foreground-secondary">{t}</span>
														))}
													</>
												) : null}
											</div>
										</div>
									</Link>
								</article>
							))}
						</div>
					)}

					{/* Pagination */}
					{result.totalPages > 1 ? (
						<div className="mt-12 flex items-center justify-between border-t border-border pt-6">
							<Link
								className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
									result.page <= 1 ? 'pointer-events-none opacity-30' : 'text-muted hover:text-foreground'
								}`}
								href={`/blog${buildQuery({ tag, category, sort, page: Math.max(1, result.page - 1) })}`}
							>
								← Trước
							</Link>
							<span className="font-mono text-xs text-muted">
								{result.page} / {result.totalPages}
							</span>
							<Link
								className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
									result.page >= result.totalPages ? 'pointer-events-none opacity-30' : 'text-muted hover:text-foreground'
								}`}
								href={`/blog${buildQuery({ tag, category, sort, page: Math.min(result.totalPages, result.page + 1) })}`}
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
