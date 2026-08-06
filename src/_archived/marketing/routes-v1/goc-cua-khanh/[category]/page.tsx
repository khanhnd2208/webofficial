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
		robots: { index: false, follow: false },
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
		<main className="min-h-screen bg-canvas">
			<section className="border-b border-hairline px-5 py-20 sm:px-8 sm:py-28">
				<div className="shell">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">
						<Link href={routes.archive} className="hover:text-ink">
							Dự án và tài nguyên
						</Link>
					</p>
					<h1 className="mt-6 max-w-4xl text-balance font-display text-[clamp(3rem,7vw,6rem)] font-normal leading-[0.96] tracking-[-0.04em] text-ink">{meta.title}</h1>
					<p className="mt-7 max-w-2xl text-base font-light leading-[1.8] text-ink-secondary sm:text-lg">{meta.description}</p>
				</div>
			</section>
			<section>
				<div className="shell py-16 sm:py-24">
					{items.length === 0 ? (
						<p className="text-sm text-ink-secondary">Chưa có nội dung công khai trong nhóm này.</p>
					) : (
						<ul className="grid gap-16 md:grid-cols-2">
							{items.map((resource, index) => (
								<li key={resource.slug} className={`group ${index % 2 === 1 ? 'md:translate-y-16' : ''}`}>
									<div className="mb-6 overflow-hidden bg-paper">
										<img src={index % 2 === 0 ? '/brand/hero-landscape.jpg' : '/brand/hero-journey.jpg'} alt="" className="aspect-[4/3] w-full object-cover grayscale-[30%] transition duration-700 group-hover:scale-[1.02] group-hover:grayscale-0" />
									</div>
									<div className="border-t border-hairline pt-5">
									<ResourceBadge productStatus={resource.productStatus} access={resource.access} />
									<h2 className="mt-4 font-display text-3xl font-normal leading-tight tracking-[-0.025em] text-ink">
										<Link
											href={`${routes.lab}/${category}/${resource.slug}`}
											className="hover:text-vermilion"
										>
											{resource.title}
										</Link>
									</h2>
									<p className="mt-3 text-sm leading-[1.75] text-ink-secondary">{resource.summary}</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
