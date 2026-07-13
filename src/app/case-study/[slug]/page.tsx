import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SectionHeading } from '@/components/marketing';
import { getCaseStudyBySlug, getPublishedCaseStudies } from '@/content';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return getPublishedCaseStudies().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const item = getCaseStudyBySlug(slug);
	if (!item) return { title: 'Không tìm thấy', robots: { index: false } };
	return {
		title: item.title,
		description: item.context,
		alternates: { canonical: absoluteUrl(`${routes.caseStudies}/${item.slug}`) },
	};
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const item = getCaseStudyBySlug(slug);
	if (!item) notFound();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						<Link href={routes.caseStudies} className="hover:text-ink">
							Case study
						</Link>
					</p>
					<p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						{item.isAnonymous ? 'Ẩn danh' : item.clientName}
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{item.title}</h1>
				</div>
			</section>
			<section>
				<div className="shell grid max-w-3xl gap-10 py-12">
					<div>
						<SectionHeading title="Bối cảnh" />
						<p className="mt-4 text-sm text-ink-secondary">{item.context}</p>
					</div>
					<div>
						<SectionHeading title="Thách thức" />
						<p className="mt-4 text-sm text-ink-secondary">{item.challenge}</p>
					</div>
					<div>
						<SectionHeading title="Cách làm" />
						<ul className="mt-4 space-y-2 text-sm text-ink-secondary">
							{item.approach.map((a) => (
								<li key={a}>· {a}</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Deliverables" />
						<ul className="mt-4 space-y-2 text-sm text-ink-secondary">
							{item.deliverables.map((d) => (
								<li key={d}>· {d}</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Kết quả" />
						<ul className="mt-4 space-y-2 text-sm text-ink-secondary">
							{item.outcomes.map((o) => (
								<li key={o}>· {o}</li>
							))}
						</ul>
					</div>
				</div>
			</section>
		</main>
	);
}
