import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingCta, SectionHeading, StructuredData } from '@/components/marketing';
import { aboutContent } from '@/content/about';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, SITE_EYEBROW, absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: aboutContent.title,
	description: aboutContent.intro,
	alternates: { canonical: absoluteUrl(routes.about) },
};

export default function AboutPage() {
	const personLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		jobTitle: SITE_EYEBROW,
		description: aboutContent.intro,
	};

	return (
		<main className="min-h-screen">
			<StructuredData data={personLd} />
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
						{aboutContent.eyebrow}
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{aboutContent.title}</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">{aboutContent.intro}</p>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-2">
					<div>
						<SectionHeading title="Tôi là ai" />
						<ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-secondary">
							{aboutContent.whoIAm.map((line) => (
								<li key={line} className="border-t border-hairline pt-3">
									{line}
								</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Điều quan tâm" />
						<ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-secondary">
							{aboutContent.careAbout.map((line) => (
								<li key={line} className="border-t border-hairline pt-3">
									{line}
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<SectionHeading title="Công việc" />
					<ul className="mt-8 grid gap-8 md:grid-cols-3">
						{aboutContent.work.map((item) => (
							<li key={item.title} className="border-t border-hairline pt-5">
								<h3 className="font-display text-lg font-medium text-ink">{item.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-2">
					<div>
						<SectionHeading title="Triết lý kiến thức" />
						<ul className="mt-6 space-y-3 text-sm text-ink-secondary">
							{aboutContent.philosophy.map((line) => (
								<li key={line} className="border-t border-hairline pt-3">
									{line}
								</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Giới hạn" />
						<ul className="mt-6 space-y-3 text-sm text-ink-secondary">
							{aboutContent.limits.map((line) => (
								<li key={line} className="border-t border-hairline pt-3">
									{line}
								</li>
							))}
						</ul>
						<p className="mt-8 text-sm leading-relaxed text-ink-secondary">{aboutContent.outsideWork}</p>
					</div>
				</div>
			</section>

			<section>
				<div className="shell flex flex-wrap gap-3 py-14 sm:py-16">
					{aboutContent.ctas.map((cta) => (
						<MarketingCta key={cta.href} href={cta.href} variant={cta.href.includes('lien-he') ? 'primary' : 'secondary'}>
							{cta.label}
						</MarketingCta>
					))}
					<Link href={routes.home} className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary">
						← Trang chủ
					</Link>
				</div>
			</section>
		</main>
	);
}
