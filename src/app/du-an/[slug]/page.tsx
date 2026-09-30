import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TrackedLink } from '@/components/marketing';
import ReadingProgress from '@/components/motion/ReadingProgress';
import SectionReveal from '@/components/motion/SectionReveal';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { CaseStudyViewTracker, getProject, projects, type Project } from '@/features/portfolio';

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
	return (
		<SectionReveal as="section" className="border-b border-hairline">
			<div className="shell grid items-start gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
				<header className="lg:col-span-7">
					<p className="editorial-label">
						{project.category} · {project.year}
					</p>
					<h1 className="mt-5 font-display text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink text-balance">
						{project.title}
					</h1>
					<p className="mt-6 max-w-2xl text-base leading-[1.75] text-ink-secondary md:text-lg">
						{project.summary}
					</p>
					<dl className="mt-10 grid gap-6 border-t border-hairline pt-8 sm:grid-cols-3">
						<div>
							<dt className="text-xs tracking-[0.04em] text-ink/45">Vai trò</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.role}</dd>
						</div>
						<div>
							<dt className="text-xs tracking-[0.04em] text-ink/45">Thời gian</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.timeframe}</dd>
						</div>
						<div>
							<dt className="text-xs tracking-[0.04em] text-ink/45">Trạng thái</dt>
							<dd className="mt-2 text-sm leading-[1.65] text-ink">{project.status}</dd>
						</div>
					</dl>
				</header>
				<div className="lg:col-span-5">
					<div className="premium-media relative aspect-[4/5] bg-canvas">
						<Image
							src={project.coverImage}
							alt=""
							fill
							priority
							sizes="(max-width: 1023px) calc(100vw - 48px), 40vw"
							className="object-contain object-center"
						/>
					</div>
				</div>
			</div>
		</SectionReveal>
	);
}

function OpeningQuestion({ project }: { project: Project }) {
	const title = project.template === 'inquiry' ? 'Câu hỏi tôi đang theo đuổi' : 'Câu hỏi khởi đầu';
	return (
		<SectionReveal as="section" className="border-b border-hairline py-14 md:py-16">
			<div className="shell grid gap-8 lg:grid-cols-12">
				<div className="lg:col-span-4">
					<p className="editorial-label">{title}</p>
				</div>
				<div className="lg:col-span-7 lg:col-start-6">
					<p className="font-display text-xl leading-[1.5] text-ink md:text-2xl">
						{project.openingQuestion}
					</p>
				</div>
			</div>
		</SectionReveal>
	);
}

function HowIWorked({ project }: { project: Project }) {
	if (project.template === 'inquiry' && project.workingAssumptions?.length) {
		return (
			<SectionReveal as="section" className="border-b border-hairline bg-paper py-14 md:py-16">
				<div className="shell grid gap-8 lg:grid-cols-12">
					<header className="lg:col-span-4">
						<p className="editorial-label">Cách tôi làm</p>
						<h2 className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-ink">
							Giả định làm việc
						</h2>
					</header>
					<ul className="space-y-5 lg:col-span-7 lg:col-start-6">
						{project.workingAssumptions.map((item) => (
							<li
								key={item}
								className="border-b border-hairline pb-5 text-base leading-[1.7] text-ink-secondary last:border-b-0"
							>
								{item}
							</li>
						))}
					</ul>
				</div>
			</SectionReveal>
		);
	}

	if (!project.designJourney?.length) return null;

	return (
		<SectionReveal as="section" className="border-b border-hairline bg-paper py-14 md:py-16">
			<div className="shell grid gap-10 lg:grid-cols-12">
				<header className="lg:col-span-4">
					<p className="editorial-label">Cách tôi làm</p>
					<h2 className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-ink">
						Hành trình
					</h2>
				</header>
				<ol className="border-t border-hairline lg:col-span-7 lg:col-start-6">
					{project.designJourney.map((step, index) => (
						<li
							key={step.label}
							className="grid grid-cols-[3rem_1fr] gap-5 border-b border-hairline py-6"
						>
							<span className="font-mono text-xs text-ink/40">
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
		</SectionReveal>
	);
}

function Observations({ project }: { project: Project }) {
	const observedLabel =
		project.template === 'inquiry' ? 'Điều tôi đang tạm thời kết luận' : 'Quan sát hiện có';

	return (
		<SectionReveal as="section" className="border-b border-hairline py-14 md:py-16">
			<div className="shell max-w-[var(--measure)]">
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
				{project.notYetConcluded.length > 0 ? (
					<div className="mt-10">
						<p className="text-sm font-medium text-ink">Điều chưa rõ</p>
						<p className="mt-3 text-base leading-[1.75] text-ink-secondary">
							{project.notYetConcluded.join(' ')}
						</p>
					</div>
				) : null}
			</div>
		</SectionReveal>
	);
}

function Lessons({ project }: { project: Project }) {
	return (
		<SectionReveal as="section" className="border-b border-hairline bg-paper py-14 md:py-16">
			<div className="shell grid gap-8 lg:grid-cols-12">
				<div className="lg:col-span-4">
					<p className="editorial-label">Điều tôi học được</p>
				</div>
				<p className="font-display text-xl leading-[1.5] text-ink md:text-2xl lg:col-span-7 lg:col-start-6">
					{project.lessonsLearned}
				</p>
			</div>
		</SectionReveal>
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
			<ReadingProgress />
			<CaseStudyViewTracker slug={project.slug} />
			<Opening project={project} />
			<OpeningQuestion project={project} />
			<HowIWorked project={project} />
			<Observations project={project} />
			<Lessons project={project} />

			{related.length > 0 ? (
				<SectionReveal as="section" className="border-b border-hairline py-14 md:py-16">
					<div className="shell">
						<p className="editorial-label">Dự án liên quan</p>
						<ul className="mt-8 space-y-6 border-t border-hairline pt-6">
							{related.map((item) => (
								<li key={item.slug}>
									<Link href={routes.project(item.slug)} className="group inline-flex flex-col">
										<span className="font-display text-lg font-medium text-ink transition-opacity group-hover:opacity-70">
											{item.title}
										</span>
										<span className="editorial-text-link mt-2 w-fit">
											Xem dự án <span aria-hidden>→</span>
										</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</SectionReveal>
			) : null}

			<SectionReveal as="section" className="py-14 md:py-16">
				<div className="shell">
					<TrackedLink
						href={`${routes.contact}?type=${project.cta.inquiryType}&sourcePage=${encodeURIComponent(routes.project(project.slug))}`}
						event="service_cta_click"
						payload={{
							type: project.cta.inquiryType,
							slug: project.slug,
							sourcePage: routes.project(project.slug),
						}}
						className="editorial-text-link"
					>
						Trao đổi với tôi về dự án này <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</SectionReveal>
		</main>
	);
}
