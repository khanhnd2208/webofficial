import Link from 'next/link';

import BlogSearch from '@/components/BlogSearch';
import { getAllPosts, getAllTags } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: 'Blog | NDK',
	description: 'Bài viết chia sẻ kiến thức, tài liệu học tập và góc nhìn cá nhân.',
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
	const limit = 12;

	const [result, tags] = await Promise.all([getAllPosts(page, limit, tag), getAllTags()]);

	// First post as featured (only on page 1 with no tag filter)
	const featured = !tag && page === 1 && result.items.length > 0 ? result.items[0] : null;
	const gridItems = featured ? result.items.slice(1) : result.items;

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
					<div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Tất cả bài viết</p>
							<h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
								Blog
							</h1>
							<p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground-secondary">
								Tổng hợp bài viết chia sẻ kiến thức, tài liệu học tập và góc nhìn cá nhân.
							</p>
						</div>
						<BlogSearch />
					</div>
				</div>
			</section>

			{/* Tags */}
			{tags.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
						<div className="flex flex-wrap gap-2">
							<Link
								className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${!tag ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}
								href={`/blog${buildQuery({ page: 1 })}`}
							>
								Tất cả
							</Link>
							{tags.map((t) => (
								<Link
									key={t}
									className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${tag === t ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}
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
				<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
					{result.items.length === 0 ? (
						<div className="py-20 text-center">
							<p className="text-lg font-bold text-foreground">Không tìm thấy bài viết</p>
							<p className="mt-2 text-sm text-muted">
								{tag ? `Không có bài viết nào với tag "${tag}".` : 'Chưa có bài viết nào.'}
							</p>
							{tag ? (
								<Link href="/blog" className="mt-4 inline-block text-sm font-bold text-accent underline underline-offset-4">
									Xem tất cả bài viết
								</Link>
							) : null}
						</div>
					) : (
						<>
							{/* Featured post — large hero card */}
							{featured ? (
								<article className="group mb-12">
									<Link href={`/blog/${featured.slug}`} className="block">
										<div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
											{featured.thumbnailUrl ? (
												<div className="aspect-3/2 overflow-hidden rounded-2xl bg-surface-hover">
													<img
														src={featured.thumbnailUrl}
														alt={featured.title}
														className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
														loading="lazy"
													/>
												</div>
											) : (
												<div className="flex aspect-3/2 items-center justify-center rounded-2xl bg-surface-hover">
													<span className="font-serif text-5xl italic text-border-strong">NDK</span>
												</div>
											)}
										<div className="flex flex-col justify-center">
											{featured.category && featured.category !== 'Uncategorized' ? (
												<span className="text-[10px] font-bold uppercase tracking-widest text-accent">
													{featured.category}
												</span>
											) : featured.tags[0] ? (
												<span className="text-[10px] font-bold uppercase tracking-widest text-accent">
													{featured.tags[0]}
												</span>
											) : null}
												<h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl">
													{featured.title}
												</h2>
												<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground-secondary">
													{featured.summary}
												</p>
												<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
													<time>
														{new Date(featured.publishedAt ?? featured.createdAt).toLocaleDateString('vi-VN', {
															year: 'numeric',
															month: 'short',
															day: 'numeric',
														})}
													</time>
													<span>·</span>
													<span>{Math.max(1, Math.round(featured.wordCount / 200))} phút đọc</span>
													{featured.views > 0 ? (
														<>
															<span>·</span>
															<span>{formatNumber(featured.views)} views</span>
														</>
													) : null}
												</div>
											</div>
										</div>
									</Link>
								</article>
							) : null}

							{/* Grid cards */}
							<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
								{gridItems.map((p) => (
									<article key={p.id} className="group">
										<Link href={`/blog/${p.slug}`} className="block">
											{p.thumbnailUrl ? (
												<div className="aspect-4/3 overflow-hidden rounded-xl bg-surface-hover">
													<img
														src={p.thumbnailUrl}
														alt={p.title}
														className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
														loading="lazy"
													/>
												</div>
											) : (
												<div className="flex aspect-4/3 items-center justify-center rounded-xl bg-surface-hover">
													<span className="font-serif text-3xl italic text-border-strong">NDK</span>
												</div>
											)}
										<div className="mt-4">
											{p.category && p.category !== 'Uncategorized' ? (
												<span className="text-[10px] font-bold uppercase tracking-widest text-accent">
													{p.category}
												</span>
											) : p.tags[0] ? (
												<span className="text-[10px] font-bold uppercase tracking-widest text-accent">
													{p.tags[0]}
												</span>
											) : null}
												<h2 className="mt-1 text-sm font-bold uppercase leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-base">
													{p.title}
												</h2>
												<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
													{p.summary}
												</p>
												<div className="mt-3 flex items-center gap-2 text-xs text-muted">
													<time>
														{new Date(p.publishedAt ?? p.createdAt).toLocaleDateString('vi-VN', {
															year: 'numeric',
															month: 'short',
															day: 'numeric',
														})}
													</time>
													<span>·</span>
													<span>{Math.max(1, Math.round(p.wordCount / 200))} phút</span>
													{p.views > 0 ? (
														<>
															<span>·</span>
															<span>{formatNumber(p.views)} views</span>
														</>
													) : null}
												</div>
											</div>
										</Link>
									</article>
								))}
							</div>
						</>
					)}

					{/* Pagination */}
					{result.totalPages > 1 ? (
						<div className="mt-12 flex items-center justify-between border-t border-border pt-6">
							<Link
								className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
									result.page <= 1 ? 'pointer-events-none opacity-30' : 'text-muted hover:text-foreground'
								}`}
								href={`/blog${buildQuery({ tag, page: Math.max(1, result.page - 1) })}`}
							>
								← Trước
							</Link>
							<span className="text-xs font-bold text-muted">
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
