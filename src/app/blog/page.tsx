import Link from 'next/link';

import BlogSearch from '@/components/BlogSearch';
import { getAllPosts, getAllTags } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: 'Tất cả Chapters | NDK',
	description: 'Danh sách tất cả chapters — tự truyện NDK.',
};

function buildQuery(params: { tag?: string; page?: number }) {
	const sp = new URLSearchParams();
	if (params.tag) sp.set('tag', params.tag);
	if (params.page && params.page > 1) sp.set('page', String(params.page));
	const q = sp.toString();
	return q ? `?${q}` : '';
}

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

export default async function BlogPage({
	searchParams,
}: {
	searchParams?: Promise<{ tag?: string; page?: string }>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const tag = sp?.tag?.trim() || undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const limit = 20;

	const [result, tags] = await Promise.all([getAllPosts(page, limit, tag), getAllTags()]);

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<Link href="/" className="text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground">
								← Trang chủ
							</Link>
							<h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								{tag ? `#${tag}` : 'Tất cả Chapters'}
							</h1>
							<p className="mt-2 font-mono text-xs text-muted">
								{result.total} bài viết {tag ? `với tag "${tag}"` : ''}
							</p>
						</div>
						<BlogSearch />
					</div>
				</div>
			</section>

			{/* Tags */}
			{tags.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
						<div className="flex gap-2">
							<Link
								className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors ${!tag ? 'bg-foreground text-background' : 'border border-border text-muted hover:border-foreground hover:text-foreground'}`}
								href="/blog"
							>
								Tất cả
							</Link>
							{tags.map((t) => (
								<Link
									key={t}
									className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors ${tag === t ? 'bg-foreground text-background' : 'border border-border text-muted hover:border-foreground hover:text-foreground'}`}
									href={`/blog${buildQuery({ tag: t, page: 1 })}`}
								>
									{t}
								</Link>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* Posts */}
			<section>
				<div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
					{result.items.length === 0 ? (
						<div className="py-20 text-center">
							<p className="text-lg font-bold text-foreground">Không tìm thấy bài viết</p>
							<p className="mt-2 text-sm text-muted">
								{tag ? `Không có bài viết nào với tag "${tag}".` : 'Chưa có bài viết nào.'}
							</p>
							{tag ? (
								<Link href="/blog" className="mt-4 inline-block text-sm font-bold text-accent underline underline-offset-4">
									Xem tất cả
								</Link>
							) : null}
						</div>
					) : (
						<div className="divide-y divide-border">
							{result.items.map((post) => (
								<article key={post.id}>
									<Link href={`/blog/${post.slug}`} className="group flex gap-4 py-5 sm:py-6">
										{/* Chapter number */}
										<div className="shrink-0 pt-0.5">
											{post.chapterNumber ? (
												<div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs font-bold text-muted transition-colors group-hover:border-accent group-hover:text-accent sm:h-10 sm:w-10">
													{post.chapterNumber}
												</div>
											) : (
												<div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs text-muted sm:h-10 sm:w-10">
													—
												</div>
											)}
										</div>

										{/* Content */}
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
												{post.chapterNumber ? (
													<span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted group-hover:text-accent">
														Chapter {post.chapterNumber}
													</span>
												) : null}
												{post.category && post.category !== 'Uncategorized' ? (
													<span className="text-[11px] font-bold uppercase tracking-widest text-foreground-secondary">
														{post.category}
													</span>
												) : null}
											</div>
											<h2 className="mt-1 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-lg">
												{post.title}
											</h2>
											<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
												{post.summary}
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
												<time>
													{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('vi-VN', {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													})}
												</time>
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
						<div className="mt-8 flex items-center justify-between border-t border-border pt-6">
							<Link
								className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
									result.page <= 1 ? 'pointer-events-none opacity-30' : 'text-muted hover:text-foreground'
								}`}
								href={`/blog${buildQuery({ tag, page: Math.max(1, result.page - 1) })}`}
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
								href={`/blog${buildQuery({ tag, page: Math.min(result.totalPages, result.page + 1) })}`}
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
