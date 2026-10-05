import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { TrackedLink } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { aboutCollaboration, aboutProjects } from '@/content/about';
import { serviceOffers } from '@/content/services';
import StoryList from '@/features/experiences/StoryList';
import { getProject } from '@/features/portfolio';
import ProjectCover from '@/features/portfolio/components/ProjectCover';
import { AboutServiceOffer } from '@/features/services/components/AboutServiceOffer';

export const metadata: Metadata = {
	title: 'Trải nghiệm — Duy Khánh',
	description:
		'Những dự án, thử nghiệm, chuyến đi và câu chuyện trên hành trình học và làm của Duy Khánh.',
	alternates: { canonical: absoluteUrl(routes.experiences) },
};

export default async function ExperiencesPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const params = await searchParams;
	const requestedPage = Number(params.page);
	const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
	const projects = [
		...aboutProjects.items,
		{
			slug: aboutProjects.research.slug,
			title: 'AI trong tuyển dụng',
			summary: 'Nghiên cứu cách AI tham gia vào tuyển dụng và những vấn đề cần cân nhắc.',
		},
	];
	return (
		<main className="personal-book book-experiences" data-testid="experience-page">
			<div className="experience-shell">
				<header className="experience-heading">
					<p className="book-caption">Một góc của Khánh</p>
					<h1 className="book-page-title">Trải nghiệm của tôi.</h1>
					<p>Những dự án, điều tôi đang thử, những chuyến đi và câu chuyện muốn giữ lại.</p>
				</header>

				<section
					id="du-an"
					className="experience-section"
					aria-labelledby="experience-projects-title"
				>
					<h2 id="experience-projects-title">Những việc tôi đang làm</h2>
					<ul className="about-project-grid">
						{projects.map((item) => {
							const project = getProject(item.slug);
							if (!project) return null;
							return (
								<li key={item.slug}>
									<TrackedLink
										href={routes.project(item.slug)}
										event="case_study_view"
										payload={{ slug: item.slug, sourcePage: routes.experiences }}
										className="about-project-card"
										data-testid={`experience-project-${item.slug}`}
									>
										<ProjectCover project={project} compact />
										<div className="about-project-copy">
											<p className="book-caption about-project-status">{project.status}</p>
											<h3>{item.title}</h3>
											<p className="about-project-summary">{item.summary}</p>
											<span className="about-project-read">
												Xem dự án <span aria-hidden="true">↗</span>
											</span>
										</div>
									</TrackedLink>
								</li>
							);
						})}
					</ul>
				</section>

				<section
					id="cau-chuyen"
					className="experience-section"
					aria-labelledby="experience-stories-title"
				>
					<h2 id="experience-stories-title">Chuyện kể và những chuyến đi</h2>
					<Suspense
						fallback={
							<p className="experience-quiet" role="status">
								Đang mở những câu chuyện…
							</p>
						}
					>
						<StoryList page={page} />
					</Suspense>
				</section>

				<section
					id="thu-nghiem"
					className="experience-section"
					aria-labelledby="experience-experiments-title"
				>
					<h2 id="experience-experiments-title">Học và thử thêm</h2>
					<p className="experience-quiet">
						AI, thiết kế học tập và tiếng Anh cũng là những phần trong công việc của tôi.
					</p>
					<div className="about-offers">
						{aboutCollaboration.items.map((item) => {
							const offer = serviceOffers.find((offer) => offer.id === item.id);
							return offer ? (
								<AboutServiceOffer
									key={item.id}
									offer={offer}
									title={item.title}
									description={item.description}
									sourcePage={routes.experiences}
								/>
							) : null;
						})}
					</div>
				</section>
				<footer className="experience-footer">
					<Link href={routes.about} className="about-text-link">
						← Về tôi
					</Link>
					<Link href={routes.mySpace} className="about-text-link">
						Góc học tập · Không gian của tôi <span aria-hidden="true">↗</span>
					</Link>
				</footer>
			</div>
		</main>
	);
}
