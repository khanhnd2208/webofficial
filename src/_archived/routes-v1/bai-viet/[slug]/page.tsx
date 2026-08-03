import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import ArticleHeader from '@/components/ArticleHeader';
import BilingualArticle from '@/components/BilingualArticle';
import BilingualMarkdownArticle from '@/components/BilingualMarkdownArticle';
import EditorialCover from '@/components/motion/EditorialCover';
import ReactionBar from '@/components/ReactionBar';
import ShareBar from '@/components/ShareBar';
import ViewTracker from '@/components/ViewTracker';
import ScrollToTop from '@/components/ScrollToTop';
import TableOfContents from '@/components/TableOfContents';
import ThumbnailPreview from '@/components/ThumbnailPreview';
import ReadingProgress from '@/components/motion/ReadingProgress';
import { absoluteUrl, EDITORIAL_NAME, SITE_NAME } from '@/config/site';
import { getPostBySlug, getRelatedPosts } from '@/services/postService';
import { routes } from '@/config/routes';
import { displayCategoryLabel } from '@/features/posts/publicAdapter';

export const revalidate = 60;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return { title: 'Bài viết' };

	const url = absoluteUrl(routes.post(post.slug));

	return {
		title: post.title,
		description: post.summary,
		openGraph: {
			title: post.title,
			description: post.summary,
			type: 'article',
			url,
			...(post.thumbnailUrl
				? { images: [{ url: post.thumbnailUrl, width: 1200, height: 630 }] }
				: {}),
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

function extractHeadingsFromMarkdown(
	markdown: string,
): { id: string; text: string; level: number }[] {
	const headings: { id: string; text: string; level: number }[] = [];
	const regex = /^(#{1,3})\s+(.+)$/gm;
	let match;
	while ((match = regex.exec(markdown)) !== null) {
		const level = match[1].length;
		const text = match[2].replace(/[`*_~[\]]/g, '').trim();
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

function addHeadingIds(html: string): string {
	return html.replace(
		/<h([1-3])([^>]*)>(.*?)<\/h[1-3]>/gi,
		(_match, level: string, attrs: string, inner: string) => {
			const text = inner.replace(/<[^>]*>/g, '').trim();
			const id = text
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
			if (attrs.includes('id=')) return `<h${level}${attrs}>${inner}</h${level}>`;
			return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
		},
	);
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
	const headings =
		post.contentFormat === 'html'
			? extractHeadingsFromHtml(post.content)
			: extractHeadingsFromMarkdown(post.content);
	const articleUrl = absoluteUrl(routes.post(post.slug));

	return (
		<main className="min-h-screen">
			<ReadingProgress />

			<div className="border-b border-hairline">
				<div className="shell py-3">
					<Link
						href={routes.posts}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary transition-colors hover:text-ink"
					>
						← Bài viết
					</Link>
				</div>
			</div>

			{/* Reading room header — three beats */}
			<ArticleHeader
				chapterNumber={post.chapterNumber}
				category={post.category}
				title={post.title}
				summary={post.summary}
				meta={
					<>
						<span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
							{EDITORIAL_NAME}
						</span>
						<span>·</span>
						<time>{dateText}</time>
						<span>·</span>
						<span>{readMin} phút đọc</span>
						{post.views > 0 ? (
							<>
								<span>·</span>
								<span>{formatNumber(post.views)} lượt xem</span>
							</>
						) : null}
					</>
				}
			/>

			<div className="shell mt-8 max-w-4xl sm:mt-10">
				{post.thumbnailUrl ? (
					<ThumbnailPreview src={post.thumbnailUrl} alt={post.title}>
						<div className="aspect-[16/9] overflow-hidden border border-hairline bg-paper">
							<img
								src={post.thumbnailUrl}
								alt={post.title}
								className="h-full w-full object-cover grayscale-[12%]"
								fetchPriority="high"
							/>
						</div>
					</ThumbnailPreview>
				) : (
					<EditorialCover
						title={post.title}
						kicker={displayCategoryLabel(post.category)}
						index={post.chapterNumber}
						aspectRatio="16 / 9"
					/>
				)}
			</div>

			<div className="shell mt-10 max-w-3xl sm:mt-12 lg:max-w-4xl">
				<div className="relative lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
					{headings.length >= 3 ? (
						<div className="lg:order-2">
							<TableOfContents headings={headings} />
						</div>
					) : null}

					<div className="lg:order-1">
						{post.contentFormat === 'html' ? (
							<BilingualArticle
								contentVi={addHeadingIds(post.content)}
								contentEn={post.contentEn ? addHeadingIds(post.contentEn) : ''}
								contentFormat="html"
								className="prose-article tiptap-content prose prose-lg dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-[1.8] prose-a:text-vermilion prose-a:no-underline hover:prose-a:underline prose-img:rounded-[2px] prose-blockquote:border-l-vermilion prose-blockquote:text-ink-secondary prose-strong:text-ink prose-code:text-vermilion max-w-[68ch]"
							/>
						) : (
							<BilingualMarkdownArticle
								contentVi={post.content}
								contentEn={post.contentEn ?? ''}
								className="prose-article prose prose-lg dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-[1.8] prose-a:text-vermilion prose-a:no-underline hover:prose-a:underline prose-img:rounded-[2px] prose-blockquote:border-l-vermilion prose-blockquote:text-ink-secondary prose-strong:text-ink prose-code:text-vermilion max-w-[68ch]"
							/>
						)}
					</div>
				</div>
			</div>

			{post.tags.length > 0 ? (
				<div className="shell mt-10 max-w-3xl border-t border-hairline pt-6 lg:max-w-4xl">
					<div className="flex flex-wrap gap-2">
						{post.tags.map((t) => (
							<Link
								key={t}
								href={`/bai-viet?tag=${encodeURIComponent(t)}`}
								className="rounded-[2px] border border-hairline px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:border-ink hover:text-ink"
							>
								{t}
							</Link>
						))}
					</div>
				</div>
			) : null}

			<div className="shell mt-8 max-w-3xl lg:max-w-4xl">
				<ShareBar url={articleUrl} title={post.title} />
			</div>

			<div className="shell mt-6 max-w-3xl pb-8 lg:max-w-4xl">
				<p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-secondary">
					Bài viết này hữu ích?
				</p>
				<ReactionBar slug={post.slug} initialReactions={post.reactions} />
			</div>

			{/* Closing scene — dark */}
			{related.length > 0 ? (
				<section className="mt-4 bg-[#161410] py-10 text-[#F2ECE1] sm:py-14 dark:bg-[#0c0b09]">
					<div className="shell">
						<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#B7AFA2]">
							Đọc tiếp
						</p>
						<h2 className="mt-2.5 font-display type-section font-medium">Bài viết liên quan</h2>
						<div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{related.map((p) => (
								<article key={p.id} className="group">
									<Link href={routes.post(p.slug)} className="block">
										{p.thumbnailUrl ? (
											<ThumbnailPreview src={p.thumbnailUrl} alt={p.title}>
												<div className="aspect-[16/10] overflow-hidden rounded-[2px] bg-[#1A1815]">
													<img
														src={p.thumbnailUrl}
														alt=""
														className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
														loading="lazy"
													/>
												</div>
											</ThumbnailPreview>
										) : (
											<EditorialCover
												title={p.title}
												kicker={displayCategoryLabel(p.category) ?? undefined}
												index={p.chapterNumber}
												aspectRatio="16 / 10"
												tone="espresso"
											/>
										)}
										<h3 className="mt-4 font-display text-xl font-medium leading-snug text-[#F2ECE1] transition-colors group-hover:text-[var(--vermilion)]">
											{p.title}
										</h3>
										<p className="mt-2 line-clamp-2 text-sm text-[#B7AFA2]">{p.summary}</p>
									</Link>
								</article>
							))}
						</div>
					</div>
				</section>
			) : null}

			<ScrollToTop />
			<ViewTracker slug={post.slug} />

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
						author: { '@type': 'Person', name: SITE_NAME },
						wordCount: post.wordCount,
						keywords: post.tags.join(', '),
					}),
				}}
			/>
		</main>
	);
}
