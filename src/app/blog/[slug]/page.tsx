import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from '@/components/CodeBlock';
import { getPostBySlug, getRelatedPosts } from '@/services/postService';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return { title: 'Bài viết | Website thầy giáo NDK' };
	return {
		title: `${post.title} | Website thầy giáo NDK`,
		description: post.summary,
	};
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) notFound();

	const related = await getRelatedPosts(post.tags, post.slug, 3);
	const createdAtText = new Date(post.createdAt).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<main className="mx-auto max-w-3xl bg-white px-6 py-12">
			<header className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link className="text-sm underline underline-offset-4" href="/blog">
						← Quay lại Blog
					</Link>
				</div>
				<div className="space-y-2">
					<h1 className="font-serif text-3xl font-semibold tracking-tight">{post.title}</h1>
					<p className="text-sm text-foreground/70">{post.summary}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
					<span>{createdAtText}</span>
					<span className="text-foreground/30">•</span>
					<span>NDK</span>
				</div>
				{post.tags.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{post.tags.map((t) => (
							<Link
								key={t}
								href={`/blog?tag=${encodeURIComponent(t)}`}
								className="rounded-full border border-foreground/15 px-3 py-1 text-xs"
							>
								{t}
							</Link>
						))}
					</div>
				) : null}
				{post.thumbnailUrl ? (
					<img
						src={post.thumbnailUrl}
						alt={post.title}
						className="mt-4 aspect-video w-full rounded-xl border border-foreground/10 object-cover"
						loading="lazy"
					/>
				) : null}
			</header>

			<article className="prose prose-lg prose-blue prose-headings:font-serif mt-10 max-w-none">
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
									className="rounded-lg border border-foreground/10"
									loading="lazy"
								/>
							);
						},
						pre: (props) => <CodeBlock {...props} />,
					}}
				>
					{post.content}
				</ReactMarkdown>
			</article>

			{related.length > 0 ? (
				<section className="mt-12">
					<h2 className="text-lg font-semibold tracking-tight">Bài viết liên quan</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						{related.map((p) => (
							<article key={p.id} className="rounded-lg border border-foreground/10 p-4">
								<Link href={`/blog/${p.slug}`} className="block">
									<div className="text-sm font-semibold leading-snug">{p.title}</div>
									<p className="mt-1 text-sm text-foreground/70">{p.summary}</p>
								</Link>
							</article>
						))}
					</div>
				</section>
			) : null}
		</main>
	);
}
