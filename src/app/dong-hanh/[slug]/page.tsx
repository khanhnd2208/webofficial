import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumb, MarketingCta, SectionHeading, StructuredData } from '@/components/marketing';
import {
	getApprovedTestimonials,
	getPublishedCaseStudies,
	getServiceBySlug,
	services,
} from '@/content';
import { routes } from '@/config/routes';
import { SITE_NAME, absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return services.filter((s) => s.status === 'published').map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const service = getServiceBySlug(slug);
	if (!service) return { title: 'Không tìm thấy' };
	return {
		title: service.title,
		description: service.summary,
		alternates: { canonical: absoluteUrl(`${routes.accompany}/${service.slug}`) },
	};
}

export default async function ServicePage({ params }: PageProps) {
	const { slug } = await params;
	const service = getServiceBySlug(slug);
	if (!service) notFound();

	const relatedCases = getPublishedCaseStudies().filter(
		(c) => service.relatedCaseSlugs.includes(c.slug) || c.relatedServices.includes(service.slug),
	);
	const testimonials = getApprovedTestimonials(service.slug);

	const serviceLd = {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: service.title,
		description: service.summary,
		provider: { '@type': 'Person', name: SITE_NAME },
		url: absoluteUrl(`${routes.accompany}/${service.slug}`),
	};

	const faqLd =
		service.faq.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: service.faq.map((item) => ({
						'@type': 'Question',
						name: item.question,
						acceptedAnswer: { '@type': 'Answer', text: item.answer },
					})),
				}
			: null;

	const contactHref = `${routes.contact}?type=${service.inquiryType}&sourcePage=${encodeURIComponent(`${routes.accompany}/${service.slug}`)}`;

	return (
		<main className="min-h-screen">
			<StructuredData data={faqLd ? [serviceLd, faqLd] : serviceLd} />

			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-14">
					<Breadcrumb
						items={[
							{ label: 'Trang chủ', href: routes.home },
							{ label: 'Đồng hành', href: routes.accompany },
							{ label: service.shortTitle },
						]}
					/>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
						Đồng hành
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">
						{service.title}
					</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						{service.summary}
					</p>
					<div className="mt-8">
						<MarketingCta href={contactHref}>Trao đổi về {service.shortTitle}</MarketingCta>
					</div>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell grid gap-12 py-14 lg:grid-cols-2">
					<div>
						<SectionHeading title="Những tình huống thường gặp" />
						<ul className="mt-6 space-y-3 text-sm text-ink-secondary">
							{service.problems.map((p) => (
								<li key={p} className="border-t border-hairline pt-3">
									{p}
								</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Ai phù hợp với hình thức này?" />
						<p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Dành cho
						</p>
						<ul className="mt-2 space-y-2 text-sm text-ink-secondary">
							{service.audience.map((a) => (
								<li key={a}>· {a}</li>
							))}
						</ul>
						<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Không dành cho
						</p>
						<ul className="mt-2 space-y-2 text-sm text-ink-secondary">
							{service.notFor.map((a) => (
								<li key={a}>· {a}</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell grid gap-12 py-14 lg:grid-cols-2">
					<div>
						<SectionHeading title="Kết quả mong đợi" />
						<ul className="mt-6 space-y-3 text-sm text-ink-secondary">
							{service.outcomes.map((o) => (
								<li key={o} className="border-t border-hairline pt-3">
									{o}
								</li>
							))}
						</ul>
					</div>
					<div>
						<SectionHeading title="Bạn sẽ nhận được" />
						<ul className="mt-6 space-y-3 text-sm text-ink-secondary">
							{service.deliverables.map((d) => (
								<li key={d} className="border-t border-hairline pt-3">
									{d}
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-14">
					<SectionHeading title="Quy trình" />
					<ol className="mt-8 grid gap-6 md:grid-cols-3">
						{service.process.map((step, i) => (
							<li key={step.title} className="border-t border-hairline pt-5">
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vermilion">
									0{i + 1}
								</p>
								<h3 className="mt-2 font-display text-lg font-medium text-ink">{step.title}</h3>
								<p className="mt-2 text-sm text-ink-secondary">{step.description}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-14">
					<SectionHeading title="Hình thức đồng hành" />
					<ul className="mt-8 grid gap-6 sm:grid-cols-2">
						{service.formats.map((format) => (
							<li key={format.name} className="border-t border-hairline pt-5">
								<h3 className="font-display text-lg font-medium text-ink">{format.name}</h3>
								<p className="mt-2 text-sm text-ink-secondary">{format.description}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{(relatedCases.length > 0 || testimonials.length > 0) && (
				<section className="border-b border-hairline">
					<div className="shell py-14">
						<SectionHeading title="Những kết quả đã được phép chia sẻ" />
						{/* Intentionally empty when no approved proof — section only renders with real items */}
						<ul className="mt-8 space-y-6">
							{relatedCases.map((c) => (
								<li
									key={c.slug}
									className="border-t border-hairline pt-4 text-sm text-ink-secondary"
								>
									{c.title}
								</li>
							))}
							{testimonials.map((t) => (
								<li
									key={t.id}
									className="border-l border-vermilion pl-4 font-serif text-lg text-ink"
								>
									“{t.quote}”
								</li>
							))}
						</ul>
					</div>
				</section>
			)}

			<section className="border-b border-hairline">
				<div className="shell py-14">
					<SectionHeading title="Chi phí" />
					<p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
						{service.pricingNote}
					</p>
				</div>
			</section>

			{service.faq.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14">
						<SectionHeading title="Câu hỏi thường gặp" />
						<ul className="mt-8 space-y-6">
							{service.faq.map((item) => (
								<li key={item.question} className="border-t border-hairline pt-5">
									<h3 className="font-display text-lg font-medium text-ink">{item.question}</h3>
									<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.answer}</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			<section>
				<div className="shell py-14 sm:py-16">
					<h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">
						Sẵn sàng trao đổi?
					</h2>
					<p className="mt-3 max-w-lg text-sm text-ink-secondary">
						Gửi tôi vài dòng về bối cảnh và điều bạn muốn giải quyết. Tôi sẽ phản hồi về cách đồng
						hành phù hợp trước khi trao đổi chi phí.
					</p>
					<div className="mt-8">
						<MarketingCta href={contactHref}>Trao đổi về {service.shortTitle}</MarketingCta>
					</div>
				</div>
			</section>
		</main>
	);
}
