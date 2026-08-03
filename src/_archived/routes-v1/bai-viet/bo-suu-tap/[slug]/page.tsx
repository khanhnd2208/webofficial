import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCollectionBySlug, getPublishedCollections } from '@/content/journal';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME, absoluteUrl } from '@/config/site';
import { getAllPosts } from '@/services/postService';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return getPublishedCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const collection = getCollectionBySlug(slug);
	if (!collection) return { title: 'Không tìm thấy', robots: { index: false } };
	return {
		title: `${collection.title} · ${EDITORIAL_NAME}`,
		description: collection.summary,
		alternates: { canonical: absoluteUrl(routes.postCollection(slug)) },
	};
}

export default async function CollectionPage({ params }: PageProps) {
	const { slug } = await params;
	const collection = getCollectionBySlug(slug);
	if (!collection) notFound();

	const result = await getAllPosts(1, 24, undefined, undefined, 'newest', {
		collectionSlug: slug,
	});

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-12">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
						<Link href={routes.posts} className="hover:text-ink">
							Góc viết {EDITORIAL_NAME}
						</Link>
					</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
						{collection.title}
					</h1>
					<p className="type-lead mt-3 max-w-xl text-ink-secondary">{collection.summary}</p>
				</div>
			</section>
			<section>
				<div className="shell py-12">
					{result.items.length === 0 ? (
						<p className="text-sm text-ink-secondary">Chưa có bài trong loạt bài này.</p>
					) : (
						<ul className="divide-y divide-hairline border-y border-hairline">
							{result.items.map((post) => (
								<li key={post.slug}>
									<Link href={routes.post(post.slug)} className="block py-5 hover:text-vermilion">
										<span className="text-[1.0625rem] font-semibold text-ink">{post.title}</span>
										{post.summary ? (
											<span className="mt-1 block text-sm text-ink-secondary">{post.summary}</span>
										) : null}
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
