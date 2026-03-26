import Link from 'next/link';

import BlogSearch from '@/components/BlogSearch';
import ThumbnailPreview from '@/components/ThumbnailPreview';
import { getAllPosts, getAllTags } from '@/services/postService';
import { formatDateShort } from '@/utils/formatDate';
import { formatNumber } from '@/utils/formatNumber';

export const revalidate = 60;

export const metadata = {
	title: 'HANOICAM',
	description: 'HANOICAM — by NDK.',
};

export default async function Home() {
	const [result, tags] = await Promise.all([getAllPosts(1, 100), getAllTags()]);
	const posts = result.items;

	const pinnedPosts = posts.filter((p) => p.isPinned);
	const otherPosts = posts.filter((p) => !p.isPinned);

	return (
		<main className="min-h-screen">
			{/* ═══ HERO ═══ */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
					<h1 className="font-serif text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
						HANOICAM
					</h1>
					<p className="mt-4 max-w-lg text-base leading-relaxed text-foreground-secondary sm:text-lg">
						Ghi chép, suy tư, và những câu chuyện cá nhân.
					</p>
					<div className="mt-8 flex items-center gap-4">
						<span className="font-mono text-xs text-muted">{posts.length} chapters</span>
						<span className="text-border-strong">·</span>
						<BlogSearch />
					</div>
				</div>
			</section>

			{/* ═══ TAGS ═══ */}
			{tags.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-5xl overflow-x-auto px-4 py-3 sm:px-6">
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

			{/* ═══ FEATURED — Pinned posts, large visual cards ═══ */}
			{pinnedPosts.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
						<div className={pinnedPosts.length === 1 ? '' : 'grid gap-6 sm:grid-cols-2'}>
							{pinnedPosts.map((post, i) => (
								<Link
									key={post.id}
									href={`/blog/${post.slug}`}
									className={`group relative block overflow-hidden rounded-2xl transition-shadow hover:shadow-lg ${
										pinnedPosts.length === 1 ? '' : ''
									}`}
								>
									{/* Thumbnail or gradient placeholder */}
									{post.thumbnailUrl ? (
										<div className={`overflow-hidden ${pinnedPosts.length === 1 ? 'aspect-21/9' : 'aspect-16/10'}`}>
											<img
												src={post.thumbnailUrl}
												alt={post.title}
												className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
												loading={i === 0 ? 'eager' : 'lazy'}
											/>
										</div>
									) : (
										<div className={`bg-linear-to-br from-surface-secondary to-surface-active ${pinnedPosts.length === 1 ? 'aspect-21/9' : 'aspect-16/10'}`} />
									)}
									{/* Overlay gradient */}
									<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
									{/* Content over image */}
									<div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
										<div className="flex items-center gap-2">
											{post.chapterNumber ? (
												<span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/70">
													Chapter {post.chapterNumber}
												</span>
											) : null}
										</div>
										<h2 className={`mt-1.5 font-bold leading-tight text-white ${
											pinnedPosts.length === 1
												? 'text-xl sm:text-2xl md:text-3xl'
												: 'text-lg sm:text-xl'
										}`}>
											{post.title}
										</h2>
										{post.summary ? (
											<p className={`mt-2 line-clamp-2 leading-relaxed text-white/75 ${
												pinnedPosts.length === 1 ? 'text-sm sm:text-base' : 'text-sm'
											}`}>
												{post.summary}
											</p>
										) : null}
										<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
											<time>{formatDateShort(post.publishedAt ?? post.createdAt)}</time>
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
														<span key={t} className="text-white/60">{t}</span>
													))}
												</>
											) : null}
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ ALL CHAPTERS — Card grid ═══ */}
			{otherPosts.length > 0 ? (
				<section>
					<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
						<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
							Tất cả chapters
						</h2>
						<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{otherPosts.map((post) => (
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

										{/* Text content */}
										<div className="mt-3.5">
											<div className="flex items-center gap-2">
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
											<h3 className="mt-1 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
												{post.title}
											</h3>
											{post.summary ? (
												<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
													{post.summary}
												</p>
											) : null}
											<div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
												<time>{formatDateShort(post.publishedAt ?? post.createdAt)}</time>
												{post.views > 0 ? (
													<>
														<span>·</span>
														<span>{formatNumber(post.views)} views</span>
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
					<div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
						<p className="font-serif text-2xl font-bold text-foreground">Chưa có chapter nào</p>
						<p className="mt-3 text-sm text-muted">Nội dung sẽ sớm được cập nhật.</p>
					</div>
				</section>
			) : null}
		</main>
	);
}
