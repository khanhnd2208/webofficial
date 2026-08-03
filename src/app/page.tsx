import type { Metadata } from 'next';
import Image from 'next/image';

import {
	SocialProofSection,
	StructuredData,
	TrackedLink,
	TrustStrip,
} from '@/components/marketing';
import { SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import {
	corePositioning,
	needStates,
	verifiedTrustItems,
	workingProcess,
} from '@/content/publicMarketing';
import { getPublishableOrganizations, getPublishableTestimonials } from '@/content/publicProof';
import { getProject } from '@/features/portfolio';

export const metadata: Metadata = {
	title: { absolute: 'Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI' },
	description:
		'Giúp người học và tổ chức biến kiến thức quản trị và AI thành chương trình, năng lực và quy trình có thể áp dụng.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: 'Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI',
		description:
			'Biến kiến thức quản trị và AI thành chương trình, năng lực và quy trình có thể áp dụng.',
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [
			{
				url: absoluteUrl('/og-editorial-premium.png'),
				width: 1734,
				height: 907,
				alt: 'Duy Khánh — Học để hiểu sâu. Làm để tạo thay đổi.',
			},
		],
	},
	twitter: { card: 'summary_large_image', images: [absoluteUrl('/og-editorial-premium.png')] },
};

const featuredSlugs = [
	'strategic-management-learning-experience',
	'ai50-ai-cho-moi-nguoi',
	'moonie-cafe-business-development',
] as const;

export default function HomePage() {
	const featuredProjects = featuredSlugs.map(getProject).filter((project) => Boolean(project));
	const testimonials = getPublishableTestimonials();
	const organizations = getPublishableOrganizations();

	return (
		<main className="overflow-hidden bg-canvas">
			<StructuredData
				data={[
					{
						'@context': 'https://schema.org',
						'@type': 'Person',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						jobTitle: 'Giảng viên và người thiết kế trải nghiệm học tập',
						description: corePositioning.promise,
					},
					{
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						description: corePositioning.promise,
						inLanguage: 'vi-VN',
					},
				]}
			/>

			<section
				className="border-b border-hairline pt-[var(--header-height)]"
				aria-labelledby="home-title"
			>
				<div className="shell grid items-center gap-11 py-12 md:grid-cols-12 md:gap-10 md:py-16 lg:py-20">
					<div className="md:col-span-7 md:pr-6 lg:pr-14">
						<p className="editorial-label">Management Education · Learning Design · Applied AI</p>
						<h1 id="home-title" className="premium-display mt-5 max-w-[12ch] text-ink">
							Học để hiểu sâu.
							<br />
							Làm để tạo thay đổi.
						</h1>
						<p className="premium-lead mt-6 max-w-[42rem]">{corePositioning.full}</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
							<TrackedLink
								href="#nhu-cau"
								event="home_primary_cta_click"
								payload={{ sourcePage: routes.home, label: 'need-routing' }}
								className="editorial-button editorial-button-dark"
							>
								Tìm hướng hỗ trợ phù hợp <span aria-hidden>↓</span>
							</TrackedLink>
							<TrackedLink
								href={routes.projects}
								event="home_secondary_cta_click"
								payload={{ sourcePage: routes.home }}
								className="editorial-button border-hairline bg-transparent text-ink"
							>
								Xem công việc đã thực hiện <span aria-hidden>↗</span>
							</TrackedLink>
						</div>
					</div>
					<div className="md:col-span-5" data-testid="home-hero-artwork">
						<div className="premium-media aspect-[4/5]">
							<Image
								src="/brand/learning-as-becoming-mobile.jpg"
								alt="Minh họa hành trình học hỏi và giảng dạy của Duy Khánh"
								fill
								priority
								sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 42vw, 480px"
								className="object-cover object-[15%_50%] grayscale-[8%] transition duration-1000 hover:scale-[1.02] hover:grayscale-0"
							/>
							<span className="absolute bottom-4 right-4 z-10 bg-canvas/92 px-3 py-2 text-xs tracking-[0.04em] text-ink-secondary backdrop-blur">
								Hiểu · Thiết kế · Thử · Điều chỉnh
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-paper" aria-label="Thông tin chuyên môn">
				<div className="shell py-8 md:py-10">
					<TrustStrip items={verifiedTrustItems} />
				</div>
			</section>

			<section
				id="nhu-cau"
				className="editorial-section scroll-mt-24 border-y border-hairline"
				aria-labelledby="needs-title"
			>
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Bạn đang muốn đạt điều gì?</p>
						<h2 id="needs-title" className="editorial-heading mt-5">
							Bắt đầu từ nhu cầu của bạn.
						</h2>
						<p className="premium-lead mt-6">
							Ba hướng cộng tác khác nhau, cùng một mục tiêu: chuyển điều phức tạp thành một bước đi
							có thể sử dụng.
						</p>
					</header>
					<div className="mt-14 border-t border-hairline">
						{needStates.map((item) => (
							<SectionReveal
								as="article"
								key={item.id}
								className="grid gap-5 border-b border-hairline py-9 md:grid-cols-12 md:gap-8 md:py-12"
							>
								<p className="font-mono text-xs text-accent md:col-span-1">{item.number}</p>
								<div className="md:col-span-4">
									<h3 className="type-h3">{item.title}</h3>
									<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{item.situation}</p>
								</div>
								<div className="md:col-span-7 lg:grid lg:grid-cols-2 lg:gap-10">
									<div>
										<p className="editorial-label">Kết quả hướng tới</p>
										<p className="mt-3 text-base leading-[1.7] text-ink">{item.outcome}</p>
									</div>
									<div className="mt-7 flex flex-col items-start gap-4 lg:mt-0">
										<TrackedLink
											href={`${routes.services}#${item.serviceId}`}
											event="home_need_select"
											payload={{ label: item.id, type: item.inquiryType, sourcePage: routes.home }}
											className="editorial-text-link"
										>
											{item.serviceLabel} <span aria-hidden>→</span>
										</TrackedLink>
										<TrackedLink
											href={routes.project(item.project)}
											event="home_project_click"
											payload={{ slug: item.project, sourcePage: routes.home }}
											className="text-base text-ink-secondary underline decoration-hairline underline-offset-4 transition-colors hover:text-accent"
										>
											{item.projectLabel}
										</TrackedLink>
									</div>
								</div>
							</SectionReveal>
						))}
					</div>
				</div>
			</section>

			<section
				className="editorial-section border-b border-hairline bg-paper"
				aria-labelledby="projects-title"
			>
				<div className="shell">
					<header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
						<div>
							<p className="editorial-label">Công việc chọn lọc</p>
							<h2 id="projects-title" className="editorial-heading mt-5">
								Từ vấn đề đến một đầu ra có thể dùng.
							</h2>
						</div>
						<p className="max-w-lg text-base leading-[1.7] text-ink-secondary">
							Mỗi hồ sơ ghi rõ bối cảnh, vai trò, sản phẩm được tạo và giới hạn của bằng chứng hiện
							có.
						</p>
					</header>
					<div className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2">
						{featuredProjects.map((project, index) =>
							project ? (
								<SectionReveal key={project.slug} className={index === 1 ? 'md:mt-20' : ''}>
									<TrackedLink
										href={routes.project(project.slug)}
										event="home_project_click"
										payload={{ slug: project.slug, sourcePage: routes.home }}
										className="group block"
									>
										<div
											className={`premium-media ${index === 0 ? 'aspect-[16/11]' : 'aspect-[4/3]'}`}
										>
											<Image
												src={project.coverImage}
												alt=""
												fill
												sizes="(max-width: 767px) calc(100vw - 48px), 44vw"
												className={`object-cover grayscale-[18%] transition duration-1000 group-hover:scale-[1.025] group-hover:grayscale-0 ${project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
											/>
										</div>
										<div className="mt-6 border-t border-hairline pt-5">
											<p className="editorial-label">
												{project.kicker} · {project.status}
											</p>
											<h3 className="type-h3 mt-3 transition-colors group-hover:text-accent">
												{project.title}
											</h3>
											<p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-secondary">
												{project.problem}
											</p>
											<dl className="mt-5 grid gap-3 border-l border-accent pl-4 text-xs leading-[1.65] text-ink-secondary sm:grid-cols-2">
												<div>
													<dt className="font-semibold text-ink">Vai trò</dt>
													<dd>{project.role}</dd>
												</div>
												<div>
													<dt className="font-semibold text-ink">Đầu ra nổi bật</dt>
													<dd>{project.deliverables[0]}</dd>
												</div>
											</dl>
											<span className="editorial-text-link mt-6">
												Xem cách dự án được thực hiện <span aria-hidden>→</span>
											</span>
										</div>
									</TrackedLink>
								</SectionReveal>
							) : null,
						)}
					</div>
					<TrackedLink
						href={routes.projects}
						event="home_secondary_cta_click"
						payload={{ sourcePage: routes.home, label: 'all-projects' }}
						className="editorial-button mt-14"
					>
						Xem tất cả công việc <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>

			<SocialProofSection testimonials={testimonials} organizations={organizations} />

			<section
				className="editorial-section border-b border-hairline"
				aria-labelledby="process-title"
			>
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Cách tôi làm việc</p>
						<h2 id="process-title" className="editorial-heading mt-5">
							Một giải pháp tốt không bắt đầu từ công cụ.
						</h2>
					</header>
					<div className="mt-12 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-4">
						{workingProcess.map(([number, title, body]) => (
							<div
								key={number}
								className="border-b border-hairline py-8 sm:px-6 lg:border-r lg:last:border-r-0"
							>
								<span className="font-mono text-xs text-accent">{number}</span>
								<h3 className="type-h3 mt-5">{title}</h3>
								<p className="mt-3 text-base leading-[1.7] text-ink-secondary">{body}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="editorial-section bg-ink text-center text-canvas">
				<div className="shell mx-auto max-w-4xl">
					<p className="editorial-label !text-sunlight">Bước tiếp theo</p>
					<h2 className="editorial-heading mx-auto mt-5 max-w-3xl text-balance text-canvas">
						Bạn đang muốn thiết kế một chương trình học, đào tạo đội ngũ hoặc giải quyết một vấn đề
						trong tổ chức?
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-base leading-[1.7] text-canvas/70">
						Chọn nội dung gần nhất với nhu cầu của bạn. Form sẽ giữ sẵn bối cảnh để cuộc trao đổi
						bắt đầu đúng trọng tâm.
					</p>
					<TrackedLink
						href={routes.contact}
						event="contact_open"
						payload={{ sourcePage: routes.home }}
						className="editorial-button mt-9 border-canvas bg-canvas text-ink"
					>
						Chọn nội dung muốn trao đổi <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>
		</main>
	);
}
