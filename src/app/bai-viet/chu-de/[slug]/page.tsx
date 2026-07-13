import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JOURNAL_PILLARS, getPillarLabel } from '@/content/journal';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME, absoluteUrl } from '@/config/site';
import { getAllPosts } from '@/services/postService';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return JOURNAL_PILLARS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const label = getPillarLabel(slug);
	if (!label) return { title: 'Không tìm thấy', robots: { index: false } };
	return {
		title: `${label} · ${EDITORIAL_NAME}`,
		description: `Pillar ${label} trên ${EDITORIAL_NAME} Journal.`,
		alternates: { canonical: absoluteUrl(routes.postPillar(slug)) },
	};
}

export default async function PillarPage({ params }: PageProps) {
	const { slug } = await params;
	const label = getPillarLabel(slug);
	if (!label) notFound();

	const result = await getAllPosts(1, 24, undefined, undefined, 'newest', { pillarSlug: slug });

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						<Link href={routes.posts} className="hover:text-ink">
							{EDITORIAL_NAME} Journal
						</Link>
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{label}</h1>
					<p className="mt-3 text-sm text-ink-secondary">{result.total} bài trong pillar này</p>
				</div>
			</section>
			<section>
				<div className="shell py-12">
					{result.items.length === 0 ? (
						<p className="text-sm text-ink-secondary">
							Chưa có bài gắn pillar này. Gán taxonomy trong admin editor sau khi chạy dry-run mapping.
						</p>
					) : (
						<ul className="divide-y divide-hairline border-y border-hairline">
							{result.items.map((post) => (
								<li key={post.slug}>
									<Link href={routes.post(post.slug)} className="block py-5 hover:text-vermilion">
										<span className="font-display text-xl font-medium text-ink">{post.title}</span>
										<span className="mt-1 block text-sm text-ink-secondary">{post.summary}</span>
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
