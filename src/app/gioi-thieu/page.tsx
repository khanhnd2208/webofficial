import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { StructuredData } from '@/components/marketing';
import SectionReveal from '@/components/motion/SectionReveal';
import { routes } from '@/config/routes';
import { absoluteUrl, siteProfile, BRAND_PLACEHOLDER_IMAGE } from '@/config/site';
import {
	aboutBackground,
	aboutClosing,
	aboutHero,
	aboutPrograms,
	aboutProjects,
} from '@/content/about';
import { serviceOffers } from '@/content/services';
import { getProject } from '@/features/portfolio';

export const metadata: Metadata = {
	title: `Giới thiệu — ${aboutHero.fullName}`,
	description: `${aboutHero.fullName} — ${aboutHero.role}, ${aboutHero.organisation}. ${aboutHero.promise}`,
	alternates: { canonical: absoluteUrl(routes.about) },
};

const featuredProjects = aboutProjects.featuredSlugs
	.map((slug) => getProject(slug))
	.filter((project) => project !== undefined);

export default function AboutPage() {
	return (
		<main className="personal-book book-about">
			<StructuredData
				data={{
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: aboutHero.fullName,
					url: absoluteUrl(routes.about),
					jobTitle: 'Lecturer and Learning Experience Designer',
					worksFor: { '@type': 'Organization', name: aboutHero.organisation },
					description: aboutHero.promise,
				}}
			/>
			<article className="book-shell">
				<section className="book-profile">
					<figure className="book-portrait">
						<div>
							<Image
								src={siteProfile.portraitSrc ?? BRAND_PLACEHOLDER_IMAGE}
								alt={`Chân dung minh họa ${aboutHero.fullName}`}
								fill
								loading="eager"
								sizes="(max-width: 767px) 200px, 360px"
							/>
						</div>
					</figure>
					<div>
						<p className="book-about-pillars">{aboutHero.pillars.join(' · ')}</p>
						<h1>{aboutHero.fullName}</h1>
						<p className="book-about-role">
							{aboutHero.role} · {aboutHero.organisation}
						</p>
						<p className="book-profile-intro">{aboutHero.promise}</p>
						<div className="book-about-actions">
							<a href={`#${aboutPrograms.id}`} className="book-button">
								{aboutHero.ctas.programs}
							</a>
							<Link href={routes.contact} className="book-link">
								{aboutHero.ctas.contact} <span aria-hidden="true">→</span>
							</Link>
						</div>
					</div>
				</section>

				<SectionReveal as="section" className="book-chapter">
					<header id={aboutPrograms.id}>
						<h2>{aboutPrograms.title}</h2>
					</header>
					<div>
						<p className="book-lead">{aboutPrograms.lead}</p>
						<ul className="book-about-rows">
							{serviceOffers.map((offer) => (
								<li key={offer.id}>
									<span className="book-caption">{offer.number}</span>
									<div>
										<h3>{offer.title}</h3>
										<p>{offer.outcome}</p>
										<p className="book-caption">{offer.audience}</p>
									</div>
								</li>
							))}
						</ul>
						<Link href={routes.services} className="book-link">
							{aboutPrograms.cta} <span aria-hidden="true">→</span>
						</Link>
					</div>
				</SectionReveal>

				<SectionReveal as="section" className="book-chapter">
					<header>
						<h2>{aboutProjects.title}</h2>
					</header>
					<div>
						<ul className="book-about-rows">
							{featuredProjects.map((project) => (
								<li key={project.slug}>
									<span className="book-caption">{project.year}</span>
									<Link href={routes.project(project.slug)} className="book-about-project">
										<h3>
											{project.title} <span aria-hidden="true">↗</span>
										</h3>
										<p>{project.summary}</p>
										<p className="book-caption">{project.status}</p>
									</Link>
								</li>
							))}
						</ul>
						<Link href={routes.projects} className="book-link">
							{aboutProjects.cta} <span aria-hidden="true">→</span>
						</Link>
					</div>
				</SectionReveal>

				<SectionReveal as="section" className="book-chapter">
					<header>
						<h2>{aboutBackground.title}</h2>
					</header>
					<div>
						<p className="book-lead">{aboutBackground.current}</p>
						<h3 className="book-about-label">{aboutBackground.placesLabel}</h3>
						<ul className="book-schools">
							{aboutBackground.places.map((place) => (
								<li key={place}>{place}</li>
							))}
						</ul>
					</div>
				</SectionReveal>

				<section className="book-closing">
					<blockquote>{aboutClosing.principle}</blockquote>
					<p className="book-about-closing-lead">{aboutClosing.lead}</p>
					<Link href={routes.contact} className="book-button">
						{aboutClosing.cta}
					</Link>
				</section>
				<div className="book-page-end">
					<Link href={routes.toc}>← Mục lục</Link>
					<Link href={routes.services}>Dịch vụ →</Link>
				</div>
			</article>
		</main>
	);
}
