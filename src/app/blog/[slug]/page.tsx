import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from '@/components/CodeBlock';
import BilingualArticle from '@/components/BilingualArticle';
import ThumbnailPreview from '@/components/ThumbnailPreview';
import ReactionBar from '@/components/ReactionBar';
import ShareBar from '@/components/ShareBar';
import ViewTracker from '@/components/ViewTracker';
import ScrollToTop from '@/components/ScrollToTop';
import TableOfContents from '@/components/TableOfContents';
import { getPostBySlug, getRelatedPosts } from '@/services/postService';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return { title: 'Bài viết | HANOICAM' };

	const url = `${process.env.NEXT_PUBLIC_URL ?? 'https://ndk.dev'}/blog/${post.slug}`;

	return {
		title: `${post.title} | HANOICAM`,
		description: post.summary,
		openGraph: {
			title: post.title,
			description: post.summary,
			type: 'article',
			url,
			...(post.thumbnailUrl ? { images: [{ url: post.thumbnailUrl, width: 1200, height: 630 }] } : {}),
			publishedTime: post.publishedAt ?? post.createdAt,
			tags: post.tags,
		},
		twitter: {
			card: post.thumbnailUrl ? 'summary_large_image' : 'summary',
			title: post.title,
			description: post.summary,
			...(post.thumbnailUrl ? { images: [post.thumbnailUrl] } : {}),
		},
	};
}

function estimateReadingTime(wordCount: number): number {
	return Math.max(1, Math.round(wordCount / 200));
}

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

/** Extract headings from markdown for Table of Contents */
function extractHeadingsFromMarkdown(markdown: string): { id: string; text: string; level: number }[] {
	const headings: { id: string; text: string; level: number }[] = [];
	const regex = /^(#{1,3})\s+(.+)$/gm;
	let match;
	while ((match = regex.exec(markdown)) !== null) {
		const level = match[1].length;
		const text = match[2].replace(/[`*_~\[\]]/g, '').trim();
		const id = text
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		headings.push({ id, text, level });
	}
	return headings;
}

/** Extract headings from HTML content for Table of Contents */
function extractHeadingsFromHtml(html: string): { id: string; text: string; level: number }[] {
	const headings: { id: string; text: string; level: number }[] = [];
	const regex = /<h([1-3])[^>]*>(.+?)<\/h[1-3]>/gi;
	let match;
	while ((match = regex.exec(html)) !== null) {
		const level = Number(match[1]);
		const text = match[2].replace(/<[^>]*>/g, '').trim();
		const id = text
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		headings.push({ id, text, level });
	}
	return headings;
}

/** Add id attributes to heading tags in HTML for TOC anchor links */
function addHeadingIds(html: string): string {
	return html.replace(/<h([1-3])([^>]*)>(.*?)<\/h[1-3]>/gi, (_match, level: string, attrs: string, inner: string) => {
		const text = inner.replace(/<[^>]*>/g, '').trim();
		const id = text
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		// Preserve existing attributes, but add/override id
		if (attrs.includes('id=')) return `<h${level}${attrs}>${inner}</h${level}>`;
		return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
	});
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) notFound();

	const related = await getRelatedPosts(post.tags, post.slug, 3);
	const readMin = estimateReadingTime(post.wordCount);
	const displayDate = post.publishedAt ?? post.createdAt;
	const dateText = new Date(displayDate).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
	const headings = post.contentFormat === 'html'
		? extractHeadingsFromHtml(post.content)
		: extractHeadingsFromMarkdown(post.content);
	const articleUrl = `${process.env.NEXT_PUBLIC_URL ?? ''}/blog/${post.slug}`;

	return (
		<main className="min-h-screen">
			{/* Back link */}
			<div className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6 py-3">
					<Link
						href="/"
						className="text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground"
					>
						← Trang chủ
					</Link>
				</div>
			</div>

			{/* Article header */}
			<header className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-16 lg:max-w-4xl">
				{/* Chapter + Category + Tags */}
				<div className="flex flex-wrap items-center gap-2">
					{post.chapterNumber ? (
						<span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
							Chapter {post.chapterNumber}
						</span>
					) : null}
					{post.category && post.category !== 'Uncategorized' ? (
						<>
							{post.chapterNumber ? <span className="text-border-strong">·</span> : null}
							<span className="text-xs font-bold uppercase tracking-widest text-foreground-secondary">
								{post.category}
							</span>
						</>
					) : null}
					{post.tags.map((t) => (
						<Link
							key={t}
							href={`/blog?tag=${encodeURIComponent(t)}`}
							className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
						>
							{t}
						</Link>
					))}
				</div>

				<h1 className="mt-4 font-serif text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
					{post.title}
				</h1>

				<p className="mt-5 text-base leading-relaxed text-foreground-secondary sm:text-lg">
					{post.summary}
				</p>

				<div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted sm:gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-black text-background">
						H
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">HANOICAM</span>
						<span>·</span>
						<time>{dateText}</time>
						<span>·</span>
						<span>{readMin} phút đọc</span>
						{post.wordCount > 0 ? (
							<>
								<span>·</span>
								<span>{formatNumber(post.wordCount)} từ</span>
							</>
						) : null}
						{post.views > 0 ? (
							<>
								<span>·</span>
								<span>{formatNumber(post.views)} lượt xem</span>
							</>
						) : null}
					</div>
				</div>
			</header>

			{/* Article body with optional TOC sidebar */}
			<div className="mx-auto mt-8 max-w-3xl px-4 sm:mt-10 sm:px-6 lg:max-w-4xl">
				<div className="relative lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
					{post.contentFormat === 'html' ? (
						/* ═══ HTML content (new Tiptap posts) ═══ */
						<BilingualArticle
							contentVi={addHeadingIds(post.content)}
							contentEn={post.contentEn ? addHeadingIds(post.contentEn) : ''}
							contentFormat="html"
							className="tiptap-content prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-[1.8] prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-accent prose-blockquote:text-foreground-secondary prose-strong:text-foreground prose-code:text-accent max-w-none"
						/>
					) : (
						/* ═══ Markdown content (legacy posts) ═══ */
						<article className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight prose-p:leading-[1.8] prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-accent prose-blockquote:text-foreground-secondary prose-strong:text-foreground prose-code:text-accent max-w-none">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									img: (props) => {
										const src = typeof props.src === 'string' ? props.src.trim() : '';
										if (!src) return null;
										return (
											<img
												{...props}
												src={src}
												alt={props.alt ?? ''}
												className="rounded-xl"
												loading="lazy"
											/>
										);
									},
									pre: (props) => <CodeBlock {...props} />,
									a: ({ children, href, ...props }) => {
										// Convert YouTube/Vimeo links to embeds
										const ytMatch = href?.match(
											/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
										);
										if (ytMatch) {
											return (
												<div className="not-prose my-6 aspect-video overflow-hidden border border-border">
													<iframe
														src={`https://www.youtube.com/embed/${ytMatch[1]}`}
														className="h-full w-full"
														allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
														allowFullScreen
														loading="lazy"
														title="YouTube video"
													/>
												</div>
											);
										}
										// External links open in new tab
										const isExternal = href?.startsWith('http') && !href?.includes(process.env.NEXT_PUBLIC_URL ?? '');
										return (
											<a
												href={href}
												{...props}
												{...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
											>
												{children}
												{isExternal ? <span className="ml-0.5 text-[0.7em] opacity-50">↗</span> : null}
											</a>
										);
									},
									h1: ({ children, ...props }) => {
										const text = String(children ?? '').replace(/[`*_~\[\]]/g, '').trim();
										const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
										return <h1 id={id} {...props}>{children}</h1>;
									},
									h2: ({ children, ...props }) => {
										const text = String(children ?? '').replace(/[`*_~\[\]]/g, '').trim();
										const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
										return <h2 id={id} {...props}>{children}</h2>;
									},
									h3: ({ children, ...props }) => {
										const text = String(children ?? '').replace(/[`*_~\[\]]/g, '').trim();
										const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
										return <h3 id={id} {...props}>{children}</h3>;
									},
								}}
							>
								{post.content}
							</ReactMarkdown>
						</article>
					)}

					{/* Table of Contents — sticky sidebar on desktop */}
					{headings.length >= 3 ? (
						<aside className="hidden lg:block">
							<TableOfContents headings={headings} />
						</aside>
					) : null}
				</div>
			</div>

			{/* Tags footer */}
			{post.tags.length > 0 ? (
				<div className="mx-auto mt-8 max-w-3xl border-t border-border px-4 pt-6 sm:mt-10 sm:px-6 lg:max-w-4xl">
					<div className="flex flex-wrap gap-2">
						{post.tags.map((t) => (
							<Link
								key={t}
								href={`/blog?tag=${encodeURIComponent(t)}`}
								className="rounded-full border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground-secondary transition-colors hover:border-foreground hover:text-foreground"
							>
								{t}
							</Link>
						))}
					</div>
				</div>
			) : null}

			{/* Share */}
			<div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:max-w-4xl">
				<ShareBar url={articleUrl} title={post.title} />
			</div>

			{/* Reactions — anonymous, no login required */}
			<div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6 lg:max-w-4xl">
				<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Bài viết này hữu ích?</p>
				<ReactionBar slug={post.slug} initialReactions={post.reactions} />
			</div>

			{/* Feedback CTA */}
			<div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:max-w-4xl">
				<Link
					href="/feedback"
					className="group flex items-center gap-3 rounded-xl border border-border bg-surface-hover/30 px-5 py-4 transition-colors hover:border-accent/50 hover:bg-accent-subtle/30"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
						</svg>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-bold text-foreground group-hover:text-accent">Gửi phản hồi</p>
						<p className="text-xs text-muted">Góp ý, liên hệ, hoặc đặt câu hỏi cho tác giả.</p>
					</div>
					<svg className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>

			{/* Related posts */}
			{related.length > 0 ? (
				<section className="mx-auto mt-10 max-w-6xl border-t border-border px-4 pt-10 pb-12 sm:mt-14 sm:px-6 sm:pb-16">
					<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
						Bài viết liên quan
					</h2>
					<div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{related.map((p) => (
							<article key={p.id} className="group">
							<Link href={`/blog/${p.slug}`} className="block">
								{p.thumbnailUrl ? (
									<ThumbnailPreview src={p.thumbnailUrl} alt={p.title}>
										<div className="aspect-2/1 overflow-hidden rounded-xl bg-surface-hover">
											<img
												src={p.thumbnailUrl}
												alt={p.title}
												className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
												loading="lazy"
											/>
										</div>
									</ThumbnailPreview>
								) : null}
									<h3 className="mt-3 text-sm font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-accent">
										{p.title}
									</h3>
									<p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">
										{p.summary}
									</p>
								</Link>
							</article>
						))}
					</div>
				</section>
			) : null}
			{/* Scroll to top + View tracker */}
			<ScrollToTop />
			<ViewTracker slug={post.slug} />

			{/* JSON-LD Structured Data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'BlogPosting',
						headline: post.title,
						description: post.summary,
						...(post.thumbnailUrl ? { image: post.thumbnailUrl } : {}),
						datePublished: post.publishedAt ?? post.createdAt,
						author: { '@type': 'Person', name: 'HANOICAM' },
						wordCount: post.wordCount,
						keywords: post.tags.join(', '),
					}),
				}}
			/>
		</main>
	);
}
