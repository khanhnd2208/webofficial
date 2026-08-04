import type { Metadata } from 'next';

import { ClosingNote, EditorialHero, ServiceOverviewCard, TrackedLink } from '@/components/marketing';
import { SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { serviceOffers, servicesPage } from '@/content/publicMarketing';

export const metadata: Metadata = {
	title: 'Ba cách chúng ta có thể cùng làm việc',
	description:
		'Duy Khánh làm việc với người học, đội ngũ và doanh nghiệp cần hiểu rõ một vấn đề, thiết kế trải nghiệm học tập hoặc đưa kiến thức vào thực tế.',
	alternates: { canonical: absoluteUrl(routes.services) },
};

export default function ServicesPage() {
	return (
		<main className="bg-canvas">
			<EditorialHero
				eyebrow={servicesPage.eyebrow}
				title={servicesPage.title}
				lead={servicesPage.lead}
			/>

			<section className="border-b border-hairline">
				<div className="shell grid gap-6 py-12 md:grid-cols-3 md:py-16">
					{serviceOffers.map((service) => (
						<ServiceOverviewCard
							key={service.id}
							number={service.number}
							title={service.title}
							overview={service.overview}
							href={`#${service.id}`}
						/>
					))}
				</div>
			</section>

			<div>
				{serviceOffers.map((service, index) => (
					<section
						id={service.id}
						key={service.id}
						className={`scroll-mt-28 border-b border-hairline ${index % 2 === 1 ? 'bg-paper' : ''}`}
					>
						<div className="shell py-14 md:py-16 lg:py-20">
							<SectionReveal className="grid gap-12 lg:grid-cols-12 lg:gap-16">
								<header className="lg:col-span-5">
									<p className="font-mono text-sm tracking-[0.08em] text-accent">
										{service.number}
									</p>
									<h2 className="editorial-heading mt-4 text-balance">{service.title}</h2>
								</header>

								<div className="space-y-12 lg:col-span-7">
									<div>
										<p className="editorial-label">Khi nào hướng này hữu ích?</p>
										<p className="mt-4 text-base leading-[1.75] text-ink-secondary">
											{service.whenUseful}
										</p>
									</div>

									<div>
										<p className="editorial-label">Chúng ta có thể cùng làm gì?</p>
										<ul className="mt-5 space-y-4">
											{service.activities.map((item) => (
												<li
													key={item}
													className="border-b border-hairline pb-4 text-base leading-[1.7] text-ink-secondary last:border-b-0"
												>
													{item}
												</li>
											))}
										</ul>
									</div>

									<div>
										<p className="editorial-label">
											Một quá trình cộng tác thường diễn ra như thế nào?
										</p>
										<ol className="mt-5 grid gap-4 sm:grid-cols-3">
											{service.process.map((step, stepIndex) => (
												<li key={step} className="border-t border-hairline pt-4">
													<span className="font-mono text-xs text-accent">
														0{stepIndex + 1}
													</span>
													<p className="mt-3 text-base font-medium text-ink">{step}</p>
												</li>
											))}
										</ol>
									</div>

									<div className="border-t border-hairline pt-8">
										<p className="editorial-label">Một dự án liên quan</p>
										<TrackedLink
											href={routes.project(service.project)}
											event="service_proof_click"
											payload={{
												slug: service.project,
												label: service.id,
												sourcePage: routes.services,
											}}
											className="group mt-4 block"
										>
											<p className="type-h3 transition-colors group-hover:text-accent">
												{service.proof}
											</p>
											<p className="mt-3 text-base leading-[1.7] text-ink-secondary">
												{service.proofNote}
											</p>
											<span className="editorial-text-link mt-5">
												Xem dự án <span aria-hidden>→</span>
											</span>
										</TrackedLink>
									</div>

									<TrackedLink
										href={`${routes.contact}?type=${service.inquiryType}&sourcePage=${encodeURIComponent(routes.services)}`}
										event="service_cta_click"
										payload={{
											type: service.inquiryType,
											label: service.id,
											sourcePage: routes.services,
										}}
										className="editorial-button editorial-button-dark"
									>
										{service.cta} <span aria-hidden>→</span>
									</TrackedLink>
								</div>
							</SectionReveal>
						</div>
					</section>
				))}
			</div>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell max-w-3xl">
					<p className="editorial-label">{servicesPage.fitTitle}</p>
					<ul className="mt-6 space-y-4">
						{servicesPage.fitCriteria.map((item) => (
							<li
								key={item}
								className="border-b border-hairline pb-4 text-base leading-[1.7] text-ink-secondary"
							>
								{item}
							</li>
						))}
					</ul>
					<p className="mt-8 text-base leading-[1.7] text-ink">{servicesPage.boundary}</p>
				</div>
			</section>

			<ClosingNote
				eyebrow="Chưa chắc hướng nào phù hợp?"
				title="Bắt đầu bằng bối cảnh, không cần một đề bài hoàn chỉnh."
				body="Hãy cho tôi biết điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Tôi sẽ phản hồi với câu hỏi hoặc bước tiếp theo phù hợp."
				primaryCta={{
					href: `${routes.contact}?type=other&sourcePage=${encodeURIComponent(routes.services)}`,
					label: 'Gửi tôi một lời nhắn',
					event: 'contact_open',
					payload: { type: 'other', sourcePage: routes.services },
				}}
			/>
		</main>
	);
}
