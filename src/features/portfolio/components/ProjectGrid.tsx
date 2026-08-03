'use client';

import Link from 'next/link';
import Image from 'next/image';

import { routes } from '@/config/routes';
import { trackEvent } from '@/lib/analytics';
import type { Project } from '../data/projects';

export default function ProjectGrid({ projects }: { projects: Project[] }) {
	return (
		<div className="mt-16 grid gap-x-10 gap-y-24 md:grid-cols-2">
			{projects.map((project, index) => (
				<Link
					key={project.slug}
					href={routes.project(project.slug)}
					onClick={() =>
						trackEvent('case_study_view', { slug: project.slug, sourcePage: routes.projects })
					}
					className={`group block ${index % 2 === 1 ? 'md:mt-24' : ''}`}
				>
					<div className={`premium-media ${index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
						<Image
							src={project.coverImage}
							alt=""
							fill
							sizes="(max-width: 767px) calc(100vw - 48px), 44vw"
							className={`object-cover grayscale-[20%] transition duration-1000 group-hover:scale-[1.025] group-hover:grayscale-0 ${project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
						/>
					</div>
					<div className="mt-6 border-t border-hairline pt-5">
						<div className="flex items-center justify-between gap-4">
							<p className="editorial-label">
								{project.kicker} · {project.year}
							</p>
							<span
								className="text-accent transition-transform group-hover:translate-x-1"
								aria-hidden
							>
								→
							</span>
						</div>
						<h2 className="type-h3 mt-4 transition-colors group-hover:text-accent">
							{project.title}
						</h2>
						<p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-secondary">
							{project.problem}
						</p>
						<dl className="mt-5 grid gap-3 border-l border-accent pl-4 text-xs leading-[1.7] text-ink-secondary sm:grid-cols-2">
							<div>
								<dt className="font-semibold text-ink">Vai trò</dt>
								<dd>{project.role}</dd>
							</div>
							<div>
								<dt className="font-semibold text-ink">Đối tượng</dt>
								<dd>{project.audience}</dd>
							</div>
							<div>
								<dt className="font-semibold text-ink">Đầu ra nổi bật</dt>
								<dd>{project.deliverables[0]}</dd>
							</div>
							<div>
								<dt className="font-semibold text-ink">Trạng thái</dt>
								<dd>{project.status}</dd>
							</div>
						</dl>
						<span className="editorial-text-link mt-6">
							Xem cách dự án được thực hiện <span aria-hidden>→</span>
						</span>
					</div>
				</Link>
			))}
		</div>
	);
}
