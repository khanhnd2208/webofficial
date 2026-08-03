import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { ImpactMetric, ProofNote, TestimonialBlock, TrackedLink } from '@/components/marketing';
import { CaseStudyViewTracker, getProject, projects } from '@/features/portfolio';

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
	const { slug } = await params;
	const project = getProject(slug);
	if (!project) return {};
	return {
		title: project.title,
		description: project.summary,
		alternates: { canonical: absoluteUrl(routes.project(project.slug)) },
		openGraph: {
			title: project.title,
			description: project.summary,
			type: 'article',
			images: [absoluteUrl(project.coverImage)],
		},
	};
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
	const { slug } = await params;
	const project = getProject(slug);
	if (!project) notFound();
	const publicGallery = project.gallery.filter((image) => image.approval === 'approved');
	const hasVerifiedArtifacts = publicGallery.some(
		(image) => image.proofStatus === 'verified' && image.kind !== 'illustration',
	);
	const related = project.relatedProjects
		.map(getProject)
		.filter((item): item is NonNullable<typeof item> => Boolean(item));

	return (
		<main className="bg-canvas">
			<CaseStudyViewTracker slug={project.slug} />
			<section className="border-b border-hairline">
				<div className="shell grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
					<header className="lg:col-span-7">
						<p className="editorial-label">
							{project.kicker} · {project.year}
						</p>
						<h1 className="premium-display mt-5 text-ink">{project.title}</h1>
						<p className="premium-lead mt-6 max-w-2xl">{project.summary}</p>
					</header>
					<div className="lg:col-span-5">
						<div className="premium-media relative aspect-[4/5]">
							<Image
								src={project.coverImage}
								alt=""
								fill
								priority
								sizes="(max-width: 1023px) calc(100vw - 48px), 40vw"
								className={`object-cover grayscale-[14%] ${project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="border-b border-hairline bg-paper py-10">
				<div className="shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{[
						['Vai trò', project.role],
						['Đối tượng', project.audience],
						['Phạm vi', project.scope],
						['Trạng thái', project.status],
					].map(([label, value]) => (
						<div key={label}>
							<p className="editorial-label">{label}</p>
							<p className="mt-3 text-base leading-[1.7] text-ink">{value}</p>
						</div>
					))}
				</div>
			</section>

			<section className="editorial-section border-b border-hairline">
				<div className="shell grid gap-14 lg:grid-cols-12 lg:gap-20">
					<div className="lg:col-span-5">
						<p className="editorial-label">Vấn đề</p>
						<h2 className="editorial-heading mt-4">Điều gì cần được giải quyết?</h2>
					</div>
					<div className="space-y-12 lg:col-span-6 lg:col-start-7">
						<div>
							<h3 className="type-h3">Vấn đề trọng tâm</h3>
							<p className="mt-4 text-base leading-[1.75] text-ink-secondary">{project.problem}</p>
						</div>
						<div className="border-t border-hairline pt-10">
							<h3 className="type-h3">Bối cảnh thực tế</h3>
							<p className="mt-4 text-base leading-[1.75] text-ink-secondary">{project.context}</p>
						</div>
					</div>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell grid gap-14 lg:grid-cols-12 lg:gap-20">
					<header className="lg:col-span-4">
						<p className="editorial-label">Những quyết định quan trọng</p>
						<h2 className="editorial-heading mt-4">Từ câu hỏi đến một cấu trúc có thể sử dụng.</h2>
					</header>
					<ol className="border-t border-hairline lg:col-span-7 lg:col-start-6">
						{project.approach.map((step, index) => (
							<li
								key={step}
								className="grid grid-cols-[3rem_1fr] gap-5 border-b border-hairline py-6"
							>
								<span className="font-mono text-xs text-accent">
									{String(index + 1).padStart(2, '0')}
								</span>
								<p className="text-base leading-[1.7] text-ink-secondary">{step}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline">
				<div className="shell">
					<header className="max-w-2xl">
						<p className="editorial-label">
							{hasVerifiedArtifacts ? 'Sản phẩm & artefact' : 'Visual tạm thời'}
						</p>
						<h2 className="editorial-heading mt-4">
							{hasVerifiedArtifacts
								? 'Những gì được thiết kế và bàn giao.'
								: 'Minh họa đang chờ được thay bằng artefact thật.'}
						</h2>
					</header>
					<ul className="mt-10 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-3">
						{project.deliverables.map((item, index) => (
							<li
								key={item}
								className="border-b border-hairline py-6 text-base text-ink-secondary sm:px-6"
							>
								<span className="mr-4 font-mono text-xs text-accent">
									{String(index + 1).padStart(2, '0')}
								</span>
								{item}
							</li>
						))}
					</ul>
					<div className="mt-14 grid gap-8 md:grid-cols-2">
						{publicGallery.map((image) => (
							<figure key={image.src}>
								<TrackedLink
									href={image.src}
									target="_blank"
									event="case_artifact_engage"
									payload={{
										slug: project.slug,
										label: image.caption,
										sourcePage: routes.project(project.slug),
									}}
									className="premium-media relative block aspect-[16/10]"
								>
									<Image
										src={image.src}
										alt={image.alt}
										fill
										sizes="(max-width: 767px) calc(100vw - 48px), 44vw"
										className="object-cover grayscale-[12%]"
									/>
								</TrackedLink>
								<p className="editorial-label mt-4">
									{image.proofStatus === 'verified' ? 'Artefact đã xác minh' : 'Minh họa tạm thời'}
								</p>
								<figcaption className="mt-3 text-sm leading-[1.65] text-ink-secondary">
									{image.caption}
								</figcaption>
							</figure>
						))}
					</div>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell">
					{project.verifiedImpact?.length ? (
						<div className="mb-12">
							<p className="editorial-label">Tác động đã xác minh</p>
							<div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
								{project.verifiedImpact.map((metric) => (
									<ImpactMetric
										key={`${metric.value}-${metric.label}`}
										value={metric.value}
										label={metric.label}
									/>
								))}
							</div>
						</div>
					) : null}
					<div>
						<p className="editorial-label">Phạm vi & cấu phần</p>
						<div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
							{project.projectFacts.map((fact) => (
								<div key={`${fact.value}-${fact.label}`} className="border-t border-hairline pt-6">
									<p className="type-h3">{fact.value}</p>
									<p className="mt-3 text-sm leading-[1.65] text-ink-secondary">{fact.label}</p>
								</div>
							))}
						</div>
					</div>
					<ProofNote>{project.evidenceNote}</ProofNote>
					<div className="mt-12 grid gap-12 border-t border-hairline pt-10 md:grid-cols-2 md:gap-16">
						<div>
							<p className="editorial-label">Kết quả hiện có</p>
							<h2 className="editorial-heading mt-4">Điều có thể kết luận ở thời điểm này</h2>
							<p className="mt-5 text-base leading-[1.75] text-ink-secondary">{project.outcomes}</p>
						</div>
						<div>
							<p className="editorial-label">Điều dự án chứng minh</p>
							<h2 className="editorial-heading mt-4">
								Một nguyên tắc có thể mang sang công việc khác
							</h2>
							<p className="mt-5 text-base leading-[1.75] text-ink-secondary">{project.lessons}</p>
						</div>
					</div>
					{project.testimonial ? (
						<div className="mt-12 max-w-3xl border-t border-hairline pt-10">
							<TestimonialBlock {...project.testimonial} />
						</div>
					) : null}
				</div>
			</section>

			<section className="editorial-section border-b border-hairline">
				<div className="shell">
					<p className="editorial-label">Dự án liên quan</p>
					<div className="mt-8 grid gap-10 md:grid-cols-2">
						{related.map((item) => (
							<Link
								key={item.slug}
								href={routes.project(item.slug)}
								className="group border-t border-hairline pt-6"
							>
								<p className="editorial-label">{item.kicker}</p>
								<h2 className="type-h3 mt-3 transition-colors group-hover:text-accent">
									{item.title}
								</h2>
								<span className="editorial-text-link mt-5">
									Xem dự án <span aria-hidden>→</span>
								</span>
							</Link>
						))}
					</div>
				</div>
			</section>

			<section className="editorial-section bg-ink text-center text-canvas">
				<div className="shell mx-auto max-w-3xl">
					<p className="editorial-label !text-sunlight">Một vấn đề tương tự?</p>
					<h2 className="editorial-heading mx-auto mt-5 max-w-3xl text-balance text-canvas">
						Bạn đang muốn phát triển một chương trình hoặc giải quyết một vấn đề tương tự?
					</h2>
					<TrackedLink
						href={`${routes.contact}?type=${project.cta.inquiryType}&sourcePage=${encodeURIComponent(routes.project(project.slug))}`}
						event="service_cta_click"
						payload={{
							type: project.cta.inquiryType,
							slug: project.slug,
							sourcePage: routes.project(project.slug),
						}}
						className="editorial-button mt-8 border-canvas bg-canvas text-ink"
					>
						Trao đổi về một dự án tương tự <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>
		</main>
	);
}
