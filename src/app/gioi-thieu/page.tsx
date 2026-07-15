import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

import JourneyLine from '@/components/motion/JourneyLine';
import { MarketingCta, SectionHeading, StructuredData } from '@/components/marketing';
import SectionScroll from '@/components/marketing/SectionScroll';
import { aboutContent } from '@/content/about';
import { getPublishedServices } from '@/content/services';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, SITE_EYEBROW, absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: aboutContent.title,
	description: aboutContent.intro,
	alternates: { canonical: absoluteUrl(routes.about) },
};

export default function AboutPage() {
	const services = getPublishedServices();
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
			<Suspense fallback={null}>
				<SectionScroll />
			</Suspense>

			<section className="section-space border-b border-hairline">
				<div className="shell max-w-3xl">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
						{aboutContent.eyebrow}
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">
						{aboutContent.heroHeadline}
					</h1>
					<p className="mt-5 text-lg leading-relaxed text-ink-secondary">{aboutContent.intro}</p>
				</div>
			</section>

			<section className="section-space border-b border-hairline bg-paper/40">
				<div className="shell">
					<SectionHeading eyebrow="Hành trình" title="Ba giai đoạn tôi đi cùng người học" />
					<ul className="mt-12 space-y-0">
						{aboutContent.journey.map((step, i) => (
							<li key={step.title} className="grid gap-3 border-t border-hairline py-8 md:grid-cols-12">
								<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent md:col-span-2">
									0{i + 1}
								</p>
								<h2 className="font-display text-2xl font-medium text-ink md:col-span-3">{step.title}</h2>
								<p className="text-base leading-relaxed text-ink-secondary md:col-span-7">{step.body}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section-space border-b border-hairline">
				<div className="shell max-w-3xl">
					<SectionHeading title="Triết lý" />
					<ul className="mt-8 space-y-4">
						{aboutContent.philosophy.map((line) => (
							<li key={line} className="border-t border-hairline pt-4 text-lg leading-relaxed text-ink-secondary">
								{line}
							</li>
						))}
					</ul>
				</div>
			</section>

			<section
				id="dich-vu"
				className="section-space scroll-mt-[calc(var(--header-height)+1rem)] border-b border-hairline bg-paper/40"
			>
				<div className="shell">
					<SectionHeading
						eyebrow="Dịch vụ"
						title="Ba cách đồng hành"
						description="Mentoring và cố vấn doanh nghiệp nằm trong tư vấn phát triển. AI là năng lực xuyên suốt."
					/>
					<ul className="mt-12 space-y-0">
						{services.map((service) => (
							<li
								key={service.slug}
								id={service.anchorId}
								className="scroll-mt-[calc(var(--header-height)+1rem)] border-t border-hairline py-10"
							>
								<h3 className="font-display text-2xl font-medium text-ink sm:text-3xl">{service.title}</h3>
								<p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">{service.summary}</p>
								{service.contexts.length > 0 ? (
									<ul className="mt-6 grid gap-4 sm:grid-cols-2">
										{service.contexts.map((ctx) => (
											<li key={ctx.id} className="border-t border-hairline pt-4">
												<p className="font-display text-lg text-ink">{ctx.title}</p>
												<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{ctx.summary}</p>
											</li>
										))}
									</ul>
								) : null}
								<div className="mt-6">
									<MarketingCta
										href={`${routes.contact}?type=${service.inquiryType}`}
										variant="secondary"
									>
										Kết nối về {service.shortTitle}
									</MarketingCta>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section
				id="quy-trinh"
				className="section-space scroll-mt-[calc(var(--header-height)+1rem)] border-b border-hairline"
			>
				<div className="shell">
					<SectionHeading title="Quy trình" description="Ba bước gọn — làm rõ trước khi mở rộng." />
					<div className="mt-8 max-w-lg text-accent">
						<JourneyLine variant="process" className="h-8 w-full" />
					</div>
					<ol className="mt-10 grid gap-8 md:grid-cols-3">
						{aboutContent.process.map((step, i) => (
							<li key={step.title} className="border-t border-hairline pt-5">
								<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">0{i + 1}</p>
								<h3 className="mt-2 font-display text-xl font-medium text-ink">{step.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.description}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Anchor kept for redirects even when no verified milestones yet */}
			<section
				id="dau-moc"
				className="scroll-mt-[calc(var(--header-height)+1rem)] border-b border-hairline"
				aria-label="Dấu mốc"
			>
				{aboutContent.milestones.length > 0 ? (
					<div className="shell section-space">
						<SectionHeading title="Dấu mốc" description="Chỉ những cột mốc đã được xác minh." />
						<ul className="mt-10 space-y-6">
							{aboutContent.milestones.map((m) => (
								<li key={m.id} className="border-t border-hairline pt-4">
									<p className="font-display text-xl text-ink">{m.label}</p>
									<p className="mt-2 text-sm text-ink-secondary">{m.detail}</p>
								</li>
							))}
						</ul>
					</div>
				) : (
					<div className="shell py-6">
						<p className="sr-only">Dấu mốc sẽ xuất hiện khi được xác minh.</p>
					</div>
				)}
			</section>

			<section className="section-space">
				<div className="shell flex flex-wrap gap-3">
					{aboutContent.ctas.map((cta) => (
						<MarketingCta
							key={cta.href}
							href={cta.href}
							variant={cta.href.includes('lien-he') ? 'primary' : 'secondary'}
						>
							{cta.label}
						</MarketingCta>
					))}
					<Link
						href={routes.home}
						className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary"
					>
						← Trang chủ
					</Link>
				</div>
			</section>
		</main>
	);
}
