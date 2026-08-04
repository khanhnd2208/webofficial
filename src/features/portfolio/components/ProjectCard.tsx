'use client';

import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import { trackEvent } from '@/lib/analytics';
import type { Project } from '../data/projects';

export function ProjectFeature({ project }: { project: Project }) {
	return (
		<Link
			href={routes.project(project.slug)}
			onClick={() =>
				trackEvent('case_study_view', { slug: project.slug, sourcePage: routes.projects })
			}
			className="group grid gap-8 border border-hairline bg-paper p-5 transition-colors hover:border-accent/50 sm:p-8 lg:grid-cols-12 lg:gap-12"
		>
			<div className="premium-media relative aspect-[4/3] lg:col-span-7 lg:aspect-[16/10]">
				<Image
					src={project.coverImage}
					alt=""
					fill
					sizes="(max-width: 1023px) calc(100vw - 48px), 55vw"
					className={`object-cover grayscale-[12%] transition duration-1000 group-hover:scale-[1.02] group-hover:grayscale-0 ${project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
					priority
				/>
			</div>
			<div className="flex flex-col justify-center lg:col-span-5">
				<p className="editorial-label">
					{project.category} · {project.status}
				</p>
				<h2 className="type-h3 mt-4 transition-colors group-hover:text-accent md:text-3xl">
					{project.title}
				</h2>
				{project.subtitle ? (
					<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{project.subtitle}</p>
				) : (
					<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{project.summary}</p>
				)}
				<span className="editorial-text-link mt-8">
					Xem dự án{' '}
					<span className="marketing-card-arrow inline-block transition-transform" aria-hidden>
						→
					</span>
				</span>
			</div>
		</Link>
	);
}

export function ProjectCard({ project }: { project: Project }) {
	return (
		<Link
			href={routes.project(project.slug)}
			onClick={() =>
				trackEvent('case_study_view', { slug: project.slug, sourcePage: routes.projects })
			}
			className="group block"
		>
			<div className="premium-media aspect-[4/3]">
				<Image
					src={project.coverImage}
					alt=""
					fill
					sizes="(max-width: 767px) calc(100vw - 48px), 30vw"
					className={`object-cover grayscale-[18%] transition duration-1000 group-hover:scale-[1.025] group-hover:grayscale-0 ${project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
				/>
			</div>
			<div className="mt-6 border-t border-hairline pt-5">
				<p className="editorial-label">
					{project.category} · {project.status}
				</p>
				<h2 className="type-h3 mt-3 transition-colors group-hover:text-accent">{project.title}</h2>
				<p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-secondary">{project.summary}</p>
				<span className="editorial-text-link mt-6">
					Xem dự án{' '}
					<span className="marketing-card-arrow inline-block transition-transform" aria-hidden>
						→
					</span>
				</span>
			</div>
		</Link>
	);
}
