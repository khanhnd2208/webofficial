import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArtifactGallery, TrackedLink } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import {
	CaseStudyViewTracker,
	getProject,
	getVerifiedGallery,
	projects,
	type Project,
} from '@/features/portfolio';

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

function Opening({ project }: { project: Project }) {
	const verifiedGallery = getVerifiedGallery(project);
	const heroImage = verifiedGallery[0]?.src ?? project.coverImage;

	return (
		<section className="border-b border-hairline">
			<div className="shell grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
				<header className="lg:col-span-7">
					<p className="editorial-label">
						{project.category} · {project.year}
					</p>
					<h1 className="premium-display mt-5 text-ink">{project.title}</h1>
					{project.subtitle ? (
						<p className="mt-5 max-w-2xl text-lg leading-[1.65] text-ink md:text-xl">
							{project.subtitle}
						</p>
					) : (
						<p className="premium-lead mt-6 max-w-2xl">{project.summary}</p>
					)}
					<dl className="mt-10 grid gap-6 border-t border-hairline pt-8 sm:grid-cols-3">
						<div>
							<dt className="editorial-label">Vai trò</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.role}</dd>
						</div>
						<div>
							<dt className="editorial-label">Thời gian</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.timeframe}</dd>
						</div>
						<div>
							<dt className="editorial-label">Trạng thái</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.status}</dd>
						</div>
					</dl>
				</header>
				<div className="lg:col-span-5">
					<div className="premium-media relative aspect-[4/5]">
						<Image
							src={heroImage}
							alt=""
							fill
							priority
							sizes="(max-width: 1023px) calc(100vw - 48px), 40vw"
							className={`object-cover grayscale-[10%] ${heroImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

function OpeningQuestion({ project }: { project: Project }) {
	const title =
		project.template === 'inquiry' ? 'Câu hỏi tôi đang theo đuổi' : 'Câu hỏi khởi đầu';
	return (
		<section className="editorial-section border-b border-hairline">
			<div className="shell grid gap-10 lg:grid-cols-12">
				<div className="lg:col-span-4">
					<p className="editorial-label">{title}</p>
				</div>
				<div className="lg:col-span-7 lg:col-start-6">
					<p className="font-display text-2xl leading-[1.45] text-ink md:text-3xl">
						{project.openingQuestion}
					</p>
				</div>
			</div>
		</section>
	);
}

function IntendedChange({ project }: { project: Project }) {
	if (project.template === 'inquiry') return null;
	return (
		<section className="editorial-section border-b border-hairline bg-paper">
			<div className="shell">
				<p className="editorial-label">Điều tôi muốn thay đổi</p>
				<ul className="mt-10 grid gap-8 border-t border-hairline pt-10 md:grid-cols-3">
					{project.intendedChange.map((item, index) => (
						<li key={item}>
							<span className="font-mono text-xs text-accent">0{index + 1}</span>
							<p className="mt-4 text-base leading-[1.7] text-ink">{item}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function DesignJourney({ project }: { project: Project }) {
	if (!project.designJourney?.length) return null;
	return (
		<section className="editorial-section border-b border-hairline">
			<div className="shell grid gap-12 lg:grid-cols-12">
				<header className="lg:col-span-4">
					<p className="editorial-label">Tôi đã thiết kế như thế nào</p>
					<h2 className="editorial-heading mt-4">Hành trình học tập</h2>
				</header>
				<ol className="border-t border-hairline lg:col-span-7 lg:col-start-6">
					{project.designJourney.map((step, index) => (
						<li
							key={step.label}
							className="grid grid-cols-[3rem_1fr] gap-5 border-b border-hairline py-6"
						>
							<span className="font-mono text-xs text-accent">
								{String(index + 1).padStart(2, '0')}
							</span>
							<div>
								<p className="text-base font-semibold text-ink">{step.label}</p>
								<p className="mt-2 text-base leading-[1.7] text-ink-secondary">{step.body}</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}

function InquirySections({ project }: { project: Project }) {
	if (project.template !== 'inquiry') return null;
	return (
		<>
			{project.workingAssumptions?.length ? (
				<section className="editorial-section border-b border-hairline bg-paper">
					<div className="shell grid gap-10 lg:grid-cols-12">
						<header className="lg:col-span-4">
							<p className="editorial-label">Giả định làm việc hiện tại</p>
						</header>
						<ul className="space-y-5 lg:col-span-7 lg:col-start-6">
							{project.workingAssumptions.map((item) => (
								<li
									key={item}
									className="border-b border-hairline pb-5 text-base leading-[1.7] text-ink-secondary"
								>
									{item}
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{project.debateMap?.length ? (
				<section className="editorial-section border-b border-hairline">
					<div className="shell grid gap-10 lg:grid-cols-12">
						<header className="lg:col-span-4">
							<p className="editorial-label">Bản đồ tranh luận</p>
						</header>
						<ul className="space-y-5 lg:col-span-7 lg:col-start-6">
							{project.debateMap.map((item) => (
								<li
									key={item}
									className="border-b border-hairline pb-5 text-base leading-[1.7] text-ink"
								>
									{item}
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{project.sources?.length || project.openQuestions?.length ? (
				<section className="editorial-section border-b border-hairline bg-paper">
					<div className="shell grid gap-12 md:grid-cols-2">
						{project.sources?.length ? (
							<div>
								<p className="editorial-label">Những nguồn và khái niệm chính</p>
								<ul className="mt-6 space-y-4">
									{project.sources.map((item) => (
										<li
											key={item}
											className="border-b border-hairline pb-4 text-base text-ink-secondary"
										>
											{item}
										</li>
									))}
								</ul>
							</div>
						) : null}
						{project.openQuestions?.length ? (
							<div>
								<p className="editorial-label">Những điểm chưa rõ</p>
								<ul className="mt-6 space-y-4">
									{project.openQuestions.map((item) => (
										<li
											key={item}
											className="border-b border-hairline pb-4 text-base text-ink-secondary"
										>
											{item}
										</li>
									))}
								</ul>
								{project.lastUpdated ? (
									<p className="mt-8 text-sm text-ink-secondary">
										Cập nhật gần nhất: {project.lastUpdated}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</section>
			) : null}
		</>
	);
}

function InClassroom({ project }: { project: Project }) {
	if (!project.inClassroom) return null;
	return (
		<section className="editorial-section border-b border-hairline bg-paper">
			<div className="shell grid gap-10 lg:grid-cols-12">
				<div className="lg:col-span-4">
					<p className="editorial-label">Trong lớp học</p>
				</div>
				<p className="max-w-2xl text-lg leading-[1.75] text-ink-secondary lg:col-span-7 lg:col-start-6">
					{project.inClassroom}
				</p>
			</div>
		</section>
	);
}

function WhatChanged({ project }: { project: Project }) {
	const observedLabel = project.template === 'inquiry' ? 'Điều tôi đang tạm thời kết luận' : 'Quan sát hiện có';
	return (
		<section className="editorial-section border-b border-hairline">
			<div className="shell grid gap-12 md:grid-cols-2 md:gap-16">
				<div>
					<p className="editorial-label">{observedLabel}</p>
					<ul className="mt-6 space-y-4">
						{project.observed.map((item) => (
							<li
								key={item}
								className="border-b border-hairline pb-4 text-base leading-[1.7] text-ink-secondary"
							>
								{item}
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="editorial-label">Điều chưa thể kết luận</p>
					<ul className="mt-6 space-y-4">
						{project.notYetConcluded.map((item) => (
							<li
								key={item}
								className="border-b border-hairline pb-4 text-base leading-[1.7] text-ink-secondary"
							>
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}

function Lessons({ project }: { project: Project }) {
	return (
		<section className="editorial-section border-b border-hairline bg-paper">
			<div className="shell grid gap-10 lg:grid-cols-12">
				<div className="lg:col-span-4">
					<p className="editorial-label">Điều tôi học được</p>
				</div>
				<p className="font-display text-2xl leading-[1.45] text-ink md:text-3xl lg:col-span-7 lg:col-start-6">
					{project.lessonsLearned}
				</p>
			</div>
		</section>
	);
}

function NextVersion({ project }: { project: Project }) {
	if (!project.nextVersion.length) return null;
	return (
		<section className="editorial-section border-b border-hairline">
			<div className="shell">
				<p className="editorial-label">Phiên bản tiếp theo</p>
				<ul className="mt-8 grid gap-6 border-t border-hairline pt-8 md:grid-cols-3">
					{project.nextVersion.map((item, index) => (
						<li key={item}>
							<span className="font-mono text-xs text-accent">0{index + 1}</span>
							<p className="mt-3 text-base leading-[1.7] text-ink-secondary">{item}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
	const { slug } = await params;
	const project = getProject(slug);
	if (!project) notFound();

	const related = project.relatedProjects
		.map(getProject)
		.filter((item): item is NonNullable<typeof item> => Boolean(item))
		.slice(0, 2);

	return (
		<main className="bg-canvas">
			<CaseStudyViewTracker slug={project.slug} />
			<Opening project={project} />
			<OpeningQuestion project={project} />
			<IntendedChange project={project} />
			<DesignJourney project={project} />
			<ArtifactGallery artefacts={project.artefacts} gallery={project.gallery} />
			<InquirySections project={project} />
			<InClassroom project={project} />
			<WhatChanged project={project} />
			<Lessons project={project} />
			<NextVersion project={project} />

			{related.length > 0 ? (
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
									<p className="editorial-label">{item.category}</p>
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
			) : null}

			<section className="editorial-section bg-ink text-center text-canvas">
				<div className="shell mx-auto max-w-3xl">
					<p className="editorial-label !text-sunlight">Tiếp theo</p>
					<h2 className="editorial-heading mx-auto mt-5 max-w-3xl text-balance text-canvas">
						Bạn đang suy nghĩ về một lớp học, chương trình hoặc câu hỏi tương tự?
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
						{project.cta.label} <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>
		</main>
	);
}
