import Link from 'next/link';

import { getLatestPosts, getAllTags } from '@/services/postService';

export const revalidate = 60;

export default async function Home() {
	const [latest, tags] = await Promise.all([getLatestPosts(6), getAllTags()]);

	const featured = latest[0];
	const rest = latest.slice(1, 4);
	const more = latest.slice(4);

	return (
		<main className="min-h-screen">
			{/* ═══ HERO — Bold editorial intro ═══ */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
					<div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
						<div>
							<p className="text-sm tracking-widest uppercase text-muted">Blog & Sharing</p>
							<h1 className="mt-4 text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-7xl">
								Chia sẻ
								<br />
								<span className="font-serif italic font-bold normal-case">&amp; Kiến thức</span>
								<br />
								từ NDK
							</h1>
							<p className="mt-6 max-w-md text-base leading-relaxed text-foreground-secondary">
								Những bài viết về ngôn ngữ, công nghệ và giáo dục — từ góc nhìn của một người thầy đang mỗi ngày học hỏi.
							</p>
							<div className="mt-8 flex items-center gap-4">
								<Link
									href="/blog"
									className="group inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground"
								>
									Đọc Blog
									<svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
								</Link>
							</div>
						</div>

						{/* Stats sidebar */}
						<div className="hidden lg:block">
							<div className="space-y-6 text-right">
								{[
									{ value: `${latest.length}+`, label: 'Bài viết' },
									{ value: `${tags.length}`, label: 'Chủ đề' },
								].map((stat) => (
									<div key={stat.label}>
										<div className="text-3xl font-black tracking-tight text-foreground">{stat.value}</div>
										<div className="mt-0.5 text-xs tracking-widest uppercase text-muted">{stat.label}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ═══ TOPICS — Service-style category bar ═══ */}
			{tags.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<div className="grid grid-cols-2 sm:grid-cols-4">
							{tags.slice(0, 4).map((t, i) => (
								<Link
									key={t}
									href={`/blog?tag=${encodeURIComponent(t)}`}
									className={`group border-border py-6 ${i > 0 ? 'border-l' : ''} px-4 transition-colors hover:bg-surface-hover`}
								>
									<h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{t}</h3>
									<p className="mt-1 text-xs text-muted">
										Khám phá các bài viết về chủ đề này
									</p>
								</Link>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ FEATURED POST — Large editorial block ═══ */}
			{featured ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
						<div className="flex items-end justify-between">
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Bài viết nổi bật</p>
							<Link href="/blog" className="text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground">
								Xem tất cả →
							</Link>
						</div>
						<div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
							<Link href={`/blog/${featured.slug}`} className="group block">
								{featured.thumbnailUrl ? (
									<div className="aspect-4/3 overflow-hidden rounded-2xl bg-surface-hover">
										<img
											src={featured.thumbnailUrl}
											alt={featured.title}
											className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
										/>
									</div>
								) : (
									<div className="flex aspect-4/3 items-center justify-center rounded-2xl bg-surface-hover">
										<span className="font-serif text-6xl italic text-border-strong">NDK</span>
									</div>
								)}
							</Link>
							<div className="flex flex-col justify-center">
								{featured.tags[0] ? (
									<span className="text-xs font-bold uppercase tracking-widest text-accent">
										{featured.tags[0]}
									</span>
								) : null}
								<Link href={`/blog/${featured.slug}`} className="group">
									<h2 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl lg:text-4xl">
										{featured.title}
									</h2>
								</Link>
								<p className="mt-4 line-clamp-3 text-base leading-relaxed text-foreground-secondary">
									{featured.summary}
								</p>
								<div className="mt-5 flex items-center gap-3 text-xs text-muted">
									<span className="font-bold uppercase tracking-wider text-foreground-secondary">NDK</span>
									<span>·</span>
									<time>
										{new Date(featured.createdAt).toLocaleDateString('vi-VN', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
										})}
									</time>
								</div>
								<Link
									href={`/blog/${featured.slug}`}
									className="group mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:text-accent"
								>
									Đọc tiếp
									<svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
								</Link>
							</div>
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ RECENT POSTS — Grid ═══ */}
			{rest.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
						<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Gần đây</h2>
						<div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{rest.map((post) => (
								<article key={post.id} className="group">
									<Link href={`/blog/${post.slug}`} className="block">
										{post.thumbnailUrl ? (
											<div className="aspect-4/3 overflow-hidden rounded-xl bg-surface-hover">
												<img
													src={post.thumbnailUrl}
													alt={post.title}
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
											{post.tags[0] ? (
												<span className="text-[10px] font-bold uppercase tracking-widest text-accent">
													{post.tags[0]}
												</span>
											) : null}
											<h3 className="mt-1 text-base font-bold uppercase leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
												{post.title}
											</h3>
											<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-secondary">
												{post.summary}
											</p>
											<time className="mt-3 block text-xs text-muted">
												{new Date(post.createdAt).toLocaleDateString('vi-VN', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</time>
										</div>
									</Link>
								</article>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ ABOUT — Bold statement section ═══ */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
					<div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
						<div>
							<h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
								Chia sẻ kiến thức
								<br />
								<span className="font-serif italic font-bold normal-case">&amp; truyền cảm hứng</span>
							</h2>
						</div>
						<div>
							<p className="text-base leading-[1.8] text-foreground-secondary">
								Xin chào, mình là NDK — một người thầy đam mê chia sẻ kiến thức về ngôn ngữ, công nghệ và giáo dục.
								Mình tin rằng mỗi bài viết là một cơ hội để kết nối, học hỏi và phát triển cùng nhau.
								Blog này là nơi mình ghi lại hành trình, chia sẻ những bài học quý giá và tạo ra giá trị
								cho cộng đồng.
							</p>
							<Link
								href="/blog"
								className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:text-accent"
							>
								Khám phá bài viết
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
								</svg>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ═══ MORE POSTS (if any) ═══ */}
			{more.length > 0 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
						<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Đọc thêm</h2>
						<div className="mt-8 divide-y divide-border">
							{more.map((post) => (
								<article key={post.id} className="group">
									<Link href={`/blog/${post.slug}`} className="flex items-center justify-between gap-6 py-5 transition-colors hover:px-2">
										<div className="flex-1">
											<h3 className="text-sm font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-base">
												{post.title}
											</h3>
											<p className="mt-1 line-clamp-1 text-sm text-muted">{post.summary}</p>
										</div>
										<time className="shrink-0 text-xs text-muted">
											{new Date(post.createdAt).toLocaleDateString('vi-VN', {
												month: 'short',
												day: 'numeric',
											})}
										</time>
									</Link>
								</article>
							))}
						</div>
					</div>
				</section>
			) : null}

			{/* ═══ FOOTER CTA ═══ */}
			<section>
				<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
					<div className="flex flex-col items-center text-center">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">Khám phá</p>
						<h2 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
							Bắt đầu khám phá
						</h2>
						<p className="mt-3 max-w-md text-sm text-foreground-secondary">
							Đọc blog, khám phá kiến thức và cùng học hỏi mỗi ngày.
						</p>
						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
							<Link
								href="/blog"
								className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground"
							>
								Đọc Blog
							</Link>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
