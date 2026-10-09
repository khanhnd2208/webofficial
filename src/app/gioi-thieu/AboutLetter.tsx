import Image from 'next/image';
import aboutArt from '../../../public/brand/toc/about-v1.webp';
import SharedArtwork from '@/components/site/SharedArtwork';
import Link from 'next/link';

import { StructuredData, TrackedLink } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { aboutFocus, aboutHero } from '@/content/about';
import { contactHref } from '@/features/services/components/contactHref';

/** The full introduction letter shown at /gioi-thieu. */
export default function AboutLetter() {
	return (
		<main className="personal-book book-about" data-testid="about-page">
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
			<article className="about-letter">
				<header className="about-intro">
					<SharedArtwork name="about" className="about-landscape">
						<Image
							src={aboutArt}
							placeholder="blur"
							alt=""
							fill
							loading="eager"
							sizes="(max-width: 600px) 320px, 500px"
						/>
					</SharedArtwork>
					<div className="about-identity">
						<div className="about-avatar">
							<Image
								src="/brand/portrait-journey.png"
								alt={`Chân dung minh họa ${aboutHero.fullName}`}
								fill
								sizes="(max-width: 600px) 80px, 124px"
								loading="eager"
							/>
						</div>
						<div>
							<p className="about-fullname">{aboutHero.fullName}</p>
							<h1>{aboutFocus.title}</h1>
							<p className="about-role">
								{aboutHero.role}
								<br />
								{aboutHero.organisation}
							</p>
						</div>
					</div>
					<p className="about-teacher-line">{aboutHero.manifesto}</p>
				</header>

				<section id="dich-vu" className="about-paths" aria-label="Học quản trị và cố vấn">
					{aboutFocus.offers.map((offer, index) => (
						<div className="about-path" id={offer.id} key={offer.id}>
							<span className="about-path-number" aria-hidden="true">
								0{index + 1}
							</span>
							<div>
								<h2>{offer.title}</h2>
								<p>{offer.description}</p>
								<TrackedLink
									href={contactHref(offer.inquiryType, routes.about)}
									event="service_cta_click"
									payload={{ type: offer.inquiryType, sourcePage: routes.about }}
									className="about-text-link"
								>
									{offer.cta} <span aria-hidden="true">→</span>
								</TrackedLink>
							</div>
						</div>
					))}
				</section>

				<footer id="du-an" className="about-experience-note">
					<p>{aboutFocus.experienceLead}</p>
					<Link href={routes.experiences} className="about-text-link">
						{aboutFocus.experienceCta} <span aria-hidden="true">↗</span>
					</Link>
				</footer>
			</article>
		</main>
	);
}
