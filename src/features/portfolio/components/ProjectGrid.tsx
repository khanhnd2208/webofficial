'use client';

import { ProjectCard, ProjectFeature } from './ProjectCard';
import type { Project } from '../data/projects';

export default function ProjectGrid({
	projects,
	flagshipSlug,
}: {
	projects: Project[];
	flagshipSlug?: string;
}) {
	const flagship =
		projects.find((project) => project.slug === flagshipSlug) ??
		projects.find((project) => project.flagship);
	const rest = projects.filter((project) => project.slug !== flagship?.slug);

	return (
		<div className="mt-16 space-y-20">
			{flagship ? <ProjectFeature project={flagship} /> : null}
			{rest.length > 0 ? (
				<div className="grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
					{rest.map((project) => (
						<ProjectCard key={project.slug} project={project} />
					))}
				</div>
			) : null}
		</div>
	);
}
