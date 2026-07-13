import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { MarketingCta, SectionHeading, StructuredData } from '@/components/marketing';
import {
	audienceGateway,
	capabilityPillars,
	getApprovedTestimonials,
	getPublishedCaseStudies,
	getPublishedResources,
	getPublishedServices,
	labCategoryForResource,
	methodologySteps,
} from '@/content';
import { routes } from '@/config/routes';
import {
	EDITORIAL_NAME,
	SITE_DESCRIPTION,
	SITE_EYEBROW,
	SITE_NAME,
	SITE_ORIGIN,
	absoluteUrl,
	siteProfile,
} from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export const revalidate = 60;

export const metadata: Metadata = {
	title: { absolute: SITE_NAME },
	description: SITE_DESCRIPTION,
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [{ url: absoluteUrl('/brand/hero-journey.jpg'), width: 819, height: 1024, alt: SITE_NAME }],
	},
};

const HERO_IMAGE = '/brand/hero-journey.jpg';

export default async function Home() {
	const services = getPublishedServices();
	const cases = getPublishedCaseStudies().slice(0, 3);
	const testimonials = getApprovedTestimonials().slice(0, 3);
	const resources = getPublishedResources().slice(0, 4);
	const posts = (await getLatestPosts(3)).slice(0, 3);

	const personLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		jobTitle: SITE_EYEBROW,
		description: SITE_DESCRIPTION,
	};

	const websiteLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		description: SITE_DESCRIPTION,
	};

	return (
		<main className="min-h-screen">
			<StructuredData data={[personLd, websiteLd]} />

			{/* Hero — brand + illustration (TheTOP-inspired composition, Duy Khánh system) */}
			<section className="relative overflow-hidden border-b border-hairline">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(from_var(--vermilion)_/_0.06),transparent_55%)]" />
				<div className="shell relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
					<div className="lg:col-span-5">
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
							{SITE_EYEBROW}
						</p>
						<h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
							{SITE_NAME}
						</h1>
						<p className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary sm:text-lg">
							{siteProfile.shortBio}
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<MarketingCta href={routes.accompany}>Đồng hành cùng Khánh</MarketingCta>
							<MarketingCta href={routes.posts} variant="secondary">
								{EDITORIAL_NAME} Journal
							</MarketingCta>
						</div>
					</div>
					<div className="relative lg:col-span-7">
						<div className="relative mx-auto aspect-[819/1024] w-full max-w-lg lg:max-w-none lg:translate-x-2">
							<Image
								src={HERO_IMAGE}
								alt={`${SITE_NAME} — minh họa hành trình nhìn về phía trước`}
								fill
								priority
								sizes="(max-width: 1024px) 90vw, 55vw"
								className="object-contain object-center dark:invert"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Audience gateway */}
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<SectionHeading
						eyebrow="Bạn đang ở đâu?"
						title="Chọn lối vào phù hợp"
						description="Hai luồng cá nhân và tổ chức được ưu tiên ngang nhau — chọn điểm bắt đầu, không cần biết hết mọi dịch vụ."
					/>
					<ul className="mt-10 grid gap-0 sm:grid-cols-2">
						{audienceGateway.map((item) => (
							<li key={item.id} className="border-t border-hairline py-6 sm:odd:pr-8 sm:even:pl-8">
								<h3 className="font-display text-xl font-medium text-ink">{item.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.description}</p>
								<Link
									href={item.href}
									className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-vermilion hover:underline"
								>
									{item.cta} →
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Capability pillars */}
			<section className="border-b border-hairline bg-paper/40">
				<div className="shell py-14 sm:py-16">
					<SectionHeading eyebrow="Năng lực" title="Ba trụ theo lợi ích" />
					<ul className="mt-10 grid gap-8 md:grid-cols-3">
						{capabilityPillars.map((pillar) => (
							<li key={pillar.title} className="border-t border-hairline pt-5">
								<h3 className="font-display text-lg font-medium text-ink">{pillar.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{pillar.description}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Four accompaniment forms */}
			{services.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-16">
						<SectionHeading
							eyebrow="Đồng hành"
							title="Bốn hình thức"
							description="Không phải marketplace — mỗi lối vào gắn với một loại nhu cầu rõ."
						/>
						<ul className="mt-10 grid gap-6 sm:grid-cols-2">
							{services.map((service) => (
								<li key={service.slug} className="border-t border-hairline pt-5">
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
										{service.shortTitle}
									</p>
									<h3 className="mt-2 font-display text-xl font-medium text-ink">
										<Link
											href={`${routes.accompany}/${service.slug}`}
											className="transition-colors hover:text-vermilion"
										>
											{service.title}
										</Link>
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{service.summary}</p>
								</li>
							))}
						</ul>
						<div className="mt-10">
							<MarketingCta href={routes.accompany} variant="secondary">
								Xem tổng quan đồng hành
							</MarketingCta>
						</div>
					</div>
				</section>
			) : null}

			{/* Professional / thinking — proof strip only with real figures */}
			<section className="border-b border-hairline bg-paper/40">
				<div className="shell py-14 sm:py-16">
					<SectionHeading
						eyebrow="Cách làm việc"
						title="Chuyên môn · Trải nghiệm · Tư duy"
						description="Giảng dạy, mentoring và cố vấn ngắn hạn — ưu tiên làm rõ bài toán trước công cụ."
					/>
					<ul className="mt-10 grid gap-6 md:grid-cols-3">
						<li className="border-t border-hairline pt-5">
							<h3 className="font-display text-lg font-medium text-ink">Chuyên môn</h3>
							<p className="mt-2 text-sm text-ink-secondary">
								Quản trị, học tập và AI ứng dụng trong công việc tri thức.
							</p>
						</li>
						<li className="border-t border-hairline pt-5">
							<h3 className="font-display text-lg font-medium text-ink">Trải nghiệm</h3>
							<p className="mt-2 text-sm text-ink-secondary">
								Làm việc với sinh viên, young professional và đội ngũ doanh nghiệp trẻ.
							</p>
						</li>
						<li className="border-t border-hairline pt-5">
							<h3 className="font-display text-lg font-medium text-ink">Tư duy</h3>
							<p className="mt-2 text-sm text-ink-secondary">
								Viết và hệ thống hóa góc nhìn qua HANOICAM Journal — không thay bằng chứng giả.
							</p>
						</li>
					</ul>
				</div>
			</section>

			{/* Methodology */}
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<SectionHeading
						eyebrow="Cách làm"
						title="Hiểu đúng → Kết nối → Làm rõ → Hành động"
					/>
					<ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{methodologySteps.map((step, index) => (
							<li key={step.title} className="border-t border-hairline pt-5">
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vermilion">
									0{index + 1}
								</p>
								<h3 className="mt-2 font-display text-lg font-medium text-ink">{step.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.description}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Cases — only if approved */}
			{cases.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-16">
						<SectionHeading eyebrow="Bằng chứng" title="Case nổi bật" />
						<ul className="mt-10 space-y-6">
							{cases.map((item) => (
								<li key={item.slug} className="border-t border-hairline pt-5">
									<h3 className="font-display text-xl font-medium text-ink">
										<Link href={`${routes.caseStudies}/${item.slug}`} className="hover:text-vermilion">
											{item.title}
										</Link>
									</h3>
									<p className="mt-2 text-sm text-ink-secondary">{item.context}</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{testimonials.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-16">
						<SectionHeading eyebrow="Phản hồi" title="Từ người đã làm việc cùng" />
						<ul className="mt-10 space-y-8">
							{testimonials.map((t) => (
								<li key={t.id} className="border-l border-vermilion pl-5">
									<blockquote className="font-serif text-lg text-ink">“{t.quote}”</blockquote>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{/* Journal */}
			{posts.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-16">
						<SectionHeading
							eyebrow={EDITORIAL_NAME}
							title="Từ Journal"
							description="Một vài bài gần đây — đọc đầy đủ trong thư viện biên tập."
						/>
						<ul className="mt-10 divide-y divide-hairline border-y border-hairline">
							{posts.map((post) => (
								<li key={post.slug}>
									<Link
										href={routes.post(post.slug)}
										className="group flex items-baseline justify-between gap-6 py-5"
									>
										<span className="font-display text-xl font-medium text-ink group-hover:text-vermilion">
											{post.title}
										</span>
										<span aria-hidden className="text-vermilion opacity-0 transition-opacity group-hover:opacity-100">
											→
										</span>
									</Link>
								</li>
							))}
						</ul>
						<div className="mt-8">
							<MarketingCta href={routes.posts} variant="text">
								Xem tất cả bài viết
							</MarketingCta>
						</div>
					</div>
				</section>
			) : null}

			{/* Lab */}
			{resources.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-16">
						<SectionHeading
							eyebrow="Góc của Khánh"
							title="Tài nguyên đang mở"
							description="Mỗi mục có status và access rõ — prototype khác bản ổn định."
						/>
						<ul className="mt-10 grid gap-6 sm:grid-cols-2">
							{resources.map((resource) => (
								<li key={resource.slug} className="border-t border-hairline pt-5">
									<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
										{resource.productStatus} · {resource.access}
									</p>
									<h3 className="mt-2 font-display text-lg font-medium text-ink">
										<Link
											href={`${routes.lab}/${labCategoryForResource(resource.type)}/${resource.slug}`}
											className="hover:text-vermilion"
										>
											{resource.title}
										</Link>
									</h3>
									<p className="mt-2 text-sm text-ink-secondary">{resource.summary}</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{/* Closing CTA */}
			<section>
				<div className="shell py-16 sm:py-20">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Bước tiếp theo</p>
					<h2 className="mt-3 max-w-xl font-display text-3xl font-medium text-ink sm:text-4xl">
						Chưa chắc nên bắt đầu từ đâu?
					</h2>
					<p className="mt-4 max-w-lg text-base text-ink-secondary">
						Gửi vài dòng về bối cảnh — Khánh sẽ phản hồi phạm vi phù hợp hoặc hướng bạn tới Journal / tài nguyên.
					</p>
					<div className="mt-8">
						<MarketingCta href={`${routes.contact}?type=unsure`}>Trao đổi cùng Khánh</MarketingCta>
					</div>
				</div>
			</section>
		</main>
	);
}
