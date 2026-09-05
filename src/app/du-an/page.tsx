import type { Metadata } from 'next';
import Link from 'next/link';

import SectionReveal from '@/components/motion/SectionReveal';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { projectsPage } from '@/content/publicMarketing';
import { ProjectList, projects } from '@/features/portfolio';

export const metadata: Metadata = {
	title: 'Dự án',
	description: projectsPage.lead,
	alternates: { canonical: absoluteUrl(routes.projects) },
};

export default function ProjectsPage() {
	return (
		<main className="personal-book bg-canvas">
			<header className="shell flex items-end justify-between pb-8 pt-10 md:pb-10 md:pt-14">
				<SectionReveal>
					<div>
						<h1 className="book-page-title">{projectsPage.title}</h1>
						<p className="mt-4 max-w-[var(--measure)] text-base leading-[1.75] text-ink-secondary md:text-lg">
							{projectsPage.lead}
						</p>
					</div>
				</SectionReveal>
			</header>

			<section aria-label="Danh sách dự án">
				<ProjectList projects={projects} />
			</section>
			<div className="shell book-page-end">
				<Link href={routes.toc}>← Mục lục</Link>
				<Link href={routes.contact}>Gửi lời nhắn ↗</Link>
			</div>
		</main>
	);
}
