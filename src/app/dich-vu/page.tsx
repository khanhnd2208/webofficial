import type { Metadata } from 'next';

import { ProofNote, ServiceDisclosure, TrackedLink } from '@/components/marketing';
import { SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { serviceOffers } from '@/content/publicMarketing';

export const metadata: Metadata = {
	title: 'Hình thức học tập, đào tạo và cố vấn',
	description:
		'Chọn hình thức học quản trị, đào tạo ứng dụng AI hoặc cố vấn doanh nghiệp phù hợp với điều bạn muốn thay đổi.',
	alternates: { canonical: absoluteUrl(routes.services) },
};

const listClass = 'mt-4 space-y-3';
const itemClass = 'border-b border-hairline pb-3 text-base leading-[1.7] text-ink-secondary';

export default function ServicesPage() {
	return (
		<main className="bg-canvas">
			<section className="editorial-section border-b border-hairline">
				<div className="shell grid gap-8 lg:grid-cols-12 lg:items-end">
					<header className="lg:col-span-8">
						<p className="editorial-label">Học tập · Đào tạo · Cố vấn</p>
						<h1 className="premium-display mt-5 max-w-[16ch] text-ink">
							Ba hướng hỗ trợ. Chọn theo điều bạn muốn thay đổi.
						</h1>
					</header>
					<div className="lg:col-span-4">
						<p className="premium-lead">
							Mỗi hướng nêu rõ mức độ phù hợp, kết quả hướng tới, hình thức hợp tác và bước tiếp
							theo — để bạn quyết định nhanh mà không bị quảng cáo.
						</p>
						<ProofNote>
							Đề xuất chỉ được hình thành sau khi hai bên thống nhất bối cảnh và điều cần đạt.
						</ProofNote>
					</div>
				</div>
			</section>

			<nav
				className="sticky top-16 z-30 border-b border-hairline bg-canvas/95 backdrop-blur-md lg:top-[4.5rem]"
				aria-label="Chọn hướng hỗ trợ"
			>
				<div className="shell no-scrollbar flex gap-2 overflow-x-auto py-3">
					{serviceOffers.map((service) => (
						<TrackedLink
							key={service.id}
							href={`#${service.id}`}
							event="service_select"
							payload={{ label: service.id, sourcePage: routes.services }}
							className="inline-flex min-h-11 shrink-0 items-center border border-hairline bg-paper px-4 text-sm font-semibold tracking-[0.02em] text-ink transition-colors hover:border-accent hover:text-accent"
						>
							{service.number} · {service.shortTitle}
						</TrackedLink>
					))}
				</div>
			</nav>

			<div>
				{serviceOffers.map((service, index) => (
					<section
						id={service.id}
						key={service.id}
						className={`scroll-mt-36 border-b border-hairline ${index % 2 === 1 ? 'bg-paper' : ''}`}
					>
						<div className="shell py-14 md:py-16 lg:py-20">
							<SectionReveal className="grid gap-10 lg:grid-cols-12 lg:gap-14">
								{/* Decision layer — always visible */}
								<header className="lg:col-span-5">
									<p className="font-mono text-sm tracking-[0.08em] text-accent">
										{service.number}
									</p>
									<h2 className="editorial-heading mt-4 text-balance">{service.title}</h2>

									<div className="mt-8 border-l-2 border-accent bg-accent-subtle/40 py-4 pl-5 pr-4">
										<p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
											Phù hợp khi
										</p>
										<p className="mt-2 text-base font-medium leading-[1.7] text-ink">
											{service.fit}
										</p>
									</div>

									<div className="mt-8">
										<p className="editorial-label">Dành cho ai</p>
										<ul className={listClass}>
											{service.audience.map((item) => (
												<li key={item} className={itemClass}>
													{item}
												</li>
											))}
										</ul>
									</div>
								</header>

								<div className="lg:col-span-7">
									{/* Outcomes — highest visual weight after title */}
									<div className="border border-ink/15 bg-surface-elevated p-6 sm:p-8">
										<p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
											Kết quả hướng tới
										</p>
										<ul className="mt-5 space-y-4">
											{service.outcomes.map((item, outcomeIndex) => (
												<li
													key={item}
													className="flex gap-4 border-b border-hairline pb-4 last:border-b-0 last:pb-0"
												>
													<span className="mt-0.5 font-mono text-xs text-accent" aria-hidden>
														0{outcomeIndex + 1}
													</span>
													<span className="text-base font-medium leading-[1.65] text-ink">
														{item}
													</span>
												</li>
											))}
										</ul>
									</div>

									{/* Secondary detail — progressive on small screens */}
									<div className="mt-8">
										<ServiceDisclosure
											serviceId={service.id}
											title={service.shortTitle}
											summaryLabel={`Hình thức, đầu ra và cách làm — ${service.shortTitle}`}
											defaultOpen={index === 0}
										>
											<div className="grid gap-10 pt-8 sm:grid-cols-2 lg:pt-2">
												<div>
													<h3 className="type-h3 text-[1.05rem]">Hình thức hợp tác</h3>
													<ul className={listClass}>
														{service.formats.map((item) => (
															<li key={item} className={itemClass}>
																{item}
															</li>
														))}
													</ul>
												</div>
												<div>
													<h3 className="type-h3 text-[1.05rem]">Đầu ra cụ thể</h3>
													<ul className={listClass}>
														{service.deliverables.map((item) => (
															<li key={item} className={itemClass}>
																{item}
															</li>
														))}
													</ul>
												</div>
												<div className="sm:col-span-2">
													<h3 className="type-h3 text-[1.05rem]">Cách làm</h3>
													<ol className="mt-5 grid border-t border-hairline sm:grid-cols-2">
														{service.approach.map((item, step) => (
															<li
																key={item}
																className="border-b border-hairline py-4 text-base text-ink-secondary sm:px-4"
															>
																<span className="mr-3 font-mono text-xs text-accent">
																	0{step + 1}
																</span>
																{item}
															</li>
														))}
													</ol>
												</div>
											</div>
										</ServiceDisclosure>
									</div>

									{/* Qualification last — quieter than outcomes */}
									<div className="mt-8 border-t border-hairline pt-7">
										<p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-secondary">
											Có thể không phù hợp nếu
										</p>
										<p className="mt-3 text-base leading-[1.7] text-ink-secondary">
											{service.notFit}
										</p>
									</div>

									{/* Proof secondary, CTA primary */}
									<div className="mt-9 flex flex-col gap-5 border-t border-hairline pt-7 sm:flex-row sm:flex-wrap sm:items-center">
										<div className="min-w-0 flex-1">
											<p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-secondary">
												Công việc liên quan
											</p>
											<TrackedLink
												href={routes.project(service.project)}
												event="service_proof_click"
												payload={{
													slug: service.project,
													label: service.id,
													sourcePage: routes.services,
												}}
												className="editorial-text-link mt-2"
											>
												{service.proof} <span aria-hidden>↗</span>
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
											className="editorial-button editorial-button-dark sm:ml-auto"
										>
											{service.cta} <span aria-hidden>→</span>
										</TrackedLink>
									</div>
								</div>
							</SectionReveal>
						</div>
					</section>
				))}
			</div>

			<section className="editorial-section bg-ink text-canvas">
				<div className="shell grid gap-8 lg:grid-cols-12 lg:items-end">
					<div className="lg:col-span-8">
						<p className="editorial-label !text-sunlight">Chưa chắc hướng nào phù hợp?</p>
						<h2 className="editorial-heading mt-5 max-w-3xl text-balance text-canvas">
							Bắt đầu bằng bối cảnh, không cần một đề bài hoàn chỉnh.
						</h2>
					</div>
					<div className="lg:col-span-4">
						<p className="text-base leading-[1.7] text-canvas/70">
							Hãy cho tôi biết ai đang liên quan, điều gì chưa hiệu quả và kết quả nào sẽ hữu ích.
							Tôi sẽ phản hồi với câu hỏi hoặc bước tiếp theo phù hợp.
						</p>
						<TrackedLink
							href={`${routes.contact}?type=other&sourcePage=${encodeURIComponent(routes.services)}`}
							event="contact_open"
							payload={{ type: 'other', sourcePage: routes.services }}
							className="editorial-button mt-7 border-canvas bg-canvas text-ink"
						>
							Chọn nội dung muốn trao đổi <span aria-hidden>→</span>
						</TrackedLink>
					</div>
				</div>
			</section>
		</main>
	);
}
