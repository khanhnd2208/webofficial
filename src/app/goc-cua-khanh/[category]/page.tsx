import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ResourceBadge } from '@/components/marketing';
import { getPublishedResources } from '@/content';
import { LAB_CATEGORY_META } from '@/content/lab';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { category } = await params;
	const meta = LAB_CATEGORY_META[category];
	if (!meta) return { title: 'Không tìm thấy' };
	return {
		title: meta.title,
		description: meta.description,
		alternates: { canonical: absoluteUrl(`${routes.lab}/${category}`) },
	};
}

export function generateStaticParams() {
	return Object.keys(LAB_CATEGORY_META).map((category) => ({ category }));
}

export default async function LabCategoryPage({ params }: PageProps) {
	const { category } = await params;
	const meta = LAB_CATEGORY_META[category];
	if (!meta) notFound();

	const items = getPublishedResources().filter(meta.match);

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						<Link href={routes.lab} className="hover:text-ink">
							Góc của Khánh
						</Link>
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{meta.title}</h1>
					<p className="mt-4 max-w-2xl text-base text-ink-secondary">{meta.description}</p>
				</div>
			</section>
			<section>
				<div className="shell py-12">
					{items.length === 0 ? (
						<p className="text-sm text-ink-secondary">Chưa có mục published trong nhóm này.</p>
					) : (
						<ul className="space-y-8">
							{items.map((resource) => (
								<li key={resource.slug} className="border-t border-hairline pt-5">
									<ResourceBadge productStatus={resource.productStatus} access={resource.access} />
									<h2 className="mt-3 font-display text-xl font-medium text-ink">
										<Link href={`${routes.lab}/${category}/${resource.slug}`} className="hover:text-vermilion">
											{resource.title}
										</Link>
									</h2>
									<p className="mt-2 text-sm text-ink-secondary">{resource.summary}</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
