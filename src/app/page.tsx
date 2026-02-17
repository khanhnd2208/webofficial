import Link from 'next/link';

import BlogSearch from '@/components/BlogSearch';
import { getAllPosts, getAllTags } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: 'HANOICAM',
	description: 'HANOICAM — by NDK.',
};

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

export default async function Home() {
	const [result, tags] = await Promise.all([getAllPosts(1, 100), getAllTags()]);
	const posts = result.items;

	// Pinned posts highlighted at top; rest in normal list
	const pinnedPosts = posts.filter((p) => p.isPinned);
	const otherPosts = posts.filter((p) => !p.isPinned);

	return (
		<main className="min-h-screen">
			{/* ═══ HERO — HANOICAM header ═══ */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
					<h1 className="text-3xl font-black leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
						HANOICAM
					</h1>
					<div className="mt-6 flex items-center gap-4">
						<span className="font-mono text-xs text-muted">{posts.length} chapters</span>
						<span className="text-muted">·</span>
						<BlogSearch />
					</div>
				</div>
			</section>

			{/* ═══ TAGS — Filter bar ═══ */}
			{tags.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
						<div className="flex gap-2">
							{tags.map((t) => (
								<Link
									key={t}
									className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-foreground hover:text-foreground"
									href={`/blog?tag=${encodeURIComponent(t)}`}
								>
									{t}
								</Link>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ PINNED — Highlighted posts ═══ */}
			{pinnedPosts.length > 0 ? (
				<section className="border-b border-border bg-surface-hover/30">
					<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
						{pinnedPosts.length === 1 ? (
							/* Single pinned post — full-width highlight */
							<Link href={`/blog/${pinnedPosts[0].slug}`} className="group block">
								<div className="flex items-start gap-4">
									<div className="shrink-0 pt-0.5">
										<div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent text-xs font-black text-accent sm:h-12 sm:w-12 sm:text-sm">
											{pinnedPosts[0].chapterNumber ?? '📌'}
										</div>
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											{pinnedPosts[0].chapterNumber ? (
												<span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
													Chapter {pinnedPosts[0].chapterNumber}
												</span>
											) : null}
											<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
												📌 Ghim
											</span>
										</div>
										<h2 className="mt-1.5 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-2xl">
											{pinnedPosts[0].title}
										</h2>
										<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
											{pinnedPosts[0].summary}
										</p>
										<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
											<time>
												{new Date(pinnedPosts[0].publishedAt ?? pinnedPosts[0].createdAt).toLocaleDateString('vi-VN', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</time>
											{pinnedPosts[0].views > 0 ? (
												<>
													<span>·</span>
													<span>{formatNumber(pinnedPosts[0].views)} views</span>
												</>
											) : null}
											{pinnedPosts[0].tags.length > 0 ? (
												<>
													<span>·</span>
													{pinnedPosts[0].tags.slice(0, 3).map((t) => (
														<span key={t} className="text-foreground-secondary">{t}</span>
													))}
												</>
											) : null}
										</div>
									</div>
								</div>
							</Link>
						) : (
							/* Multiple pinned posts — grid */
							<div className="space-y-1">
								<p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-accent">📌 Ghim</p>
								<div className="grid gap-4 sm:grid-cols-2">
									{pinnedPosts.map((post) => (
										<Link
											key={post.id}
											href={`/blog/${post.slug}`}
											className="group rounded-xl border-2 border-accent/20 bg-background p-5 transition-colors hover:border-accent"
										>
											<div className="flex items-center gap-2">
												{post.chapterNumber ? (
													<span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent text-xs font-bold text-accent">
														{post.chapterNumber}
													</span>
												) : null}
												{post.chapterNumber ? (
													<span className="font-mono text-[11px] font-bold uppercase tracking-widest text-accent">
														Chapter {post.chapterNumber}
													</span>
												) : null}
											</div>
											<h2 className="mt-2.5 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-lg">
												{post.title}
											</h2>
											<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
												{post.summary}
											</p>
											<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
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
											</div>
										</Link>
									))}
								</div>
							</div>
						)}
					</div>
				</section>
			) : null}

			{/* ═══ ALL CHAPTERS — Chronological list ═══ */}
			{otherPosts.length > 0 ? (
				<section>
					<div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
						<div className="divide-y divide-border">
							{otherPosts.map((post) => (
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
											<div className="flex items-center gap-2">
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
														{post.tags.slice(0, 2).map((t) => (
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
					</div>
				</section>
			) : posts.length === 0 ? (
				<section>
					<div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
						<p className="text-lg font-bold text-foreground">Chưa có chapter nào</p>
						<p className="mt-2 text-sm text-muted">Nội dung sẽ sớm được cập nhật.</p>
					</div>
				</section>
			) : null}
		</main>
	);
}
