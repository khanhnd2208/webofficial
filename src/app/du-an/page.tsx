import type { Metadata } from 'next';

import { EditorialHero } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { projectsPage } from '@/content/publicMarketing';
import { ProjectGrid, projects } from '@/features/portfolio';

export const metadata: Metadata = {
	title: 'Những điều tôi đang làm',
	description:
		'Các lớp học, chương trình, nghiên cứu và thử nghiệm của Duy Khánh — ghi lại điều đã làm được, điều còn chưa chắc chắn và những gì học được trên đường đi.',
	alternates: { canonical: absoluteUrl(routes.projects) },
};

export default function ProjectsPage() {
	return (
		<main className="bg-canvas">
			<EditorialHero
				eyebrow={projectsPage.eyebrow}
				title={projectsPage.title}
				lead={projectsPage.lead}
			/>
			<section className="editorial-section">
				<div className="shell">
					<ProjectGrid
						projects={projects}
						flagshipSlug="strategic-management-learning-experience"
					/>
				</div>
			</section>
		</main>
	);
}
