import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { StructuredData } from '@/components/marketing';
import SectionReveal from '@/components/motion/SectionReveal';
import JourneyLine from '@/components/motion/JourneyLine';
import { routes } from '@/config/routes';
import { absoluteUrl, siteProfile, BRAND_PLACEHOLDER_IMAGE } from '@/config/site';
import { aboutHero, aboutJourney, aboutClosing, aboutCredentials } from '@/content/about';
export const metadata: Metadata = {
	title: `Giới thiệu — ${aboutHero.fullName}`,
	description: `${aboutHero.quote} ${aboutHero.manifesto}`,
	alternates: { canonical: absoluteUrl(routes.about) },
};
export default function AboutPage() {
	const { currentWork, classrooms, projects } = aboutJourney;
	return (
		<main className="personal-book book-about">
			<StructuredData
				data={{
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: aboutHero.fullName,
					url: absoluteUrl(routes.about),
					jobTitle: 'Lecturer and Learning Experience Designer',
					worksFor: { '@type': 'Organization', name: 'Trường Đại học Hà Nội' },
					description: aboutHero.manifesto,
				}}
			/>
			<article className="book-shell">
				<section className="book-profile">
					<figure className="book-portrait">
						<div>
							<Image
								src={siteProfile.portraitSrc ?? BRAND_PLACEHOLDER_IMAGE}
								alt="Chân dung minh họa Khánh trên hành trình học hỏi"
								fill
								loading="eager"
								sizes="(max-width: 767px) 280px, 360px"
							/>
						</div>
						<figcaption className="book-caption">{aboutHero.portraitCaption}</figcaption>
					</figure>
					<div>
						<p className="book-greeting">{aboutHero.greeting}</p>
						<h1>{aboutHero.name}</h1>
						<p className="book-profile-intro">Tôi là Nguyễn Duy Khánh, giảng viên tại Hà Nội.</p>
						<blockquote lang="en">{aboutHero.quote}</blockquote>
						<p className="book-caption">{aboutCredentials.closing}</p>
					</div>
				</section>
				<div className="book-journey-heading">
					<JourneyLine variant="process" className="h-9 w-36 text-accent" />
					<h2>{aboutJourney.title}</h2>
				</div>
				<SectionReveal as="section" className="book-chapter">
					<header>
						<span className="book-chapter-number">A</span>
						<h3>{currentWork.title}</h3>
					</header>
					<div>
						<p className="book-lead">
							Tôi dạy quản trị, thiết kế trải nghiệm học tập và khám phá cách AI có thể giúp con
							người học và làm việc tốt hơn.
						</p>
						<div className="book-work-list">
							{currentWork.items.map((item) => (
								<div key={item.id}>
									<h4>{item.title}</h4>
									<p>{item.body}.</p>
								</div>
							))}
						</div>
					</div>
				</SectionReveal>
				<SectionReveal as="section" className="book-chapter">
					<header>
						<span className="book-chapter-number">B</span>
						<h3>{classrooms.title}</h3>
					</header>
					<div>
						<p className="book-lead">{aboutHero.manifesto}</p>
						<ul className="book-schools">
							{classrooms.items.map((school) => (
								<li key={school}>{school}</li>
							))}
						</ul>
					</div>
				</SectionReveal>
				<SectionReveal as="section" className="book-chapter">
					<header>
						<span className="book-chapter-number">C</span>
						<h3>{projects.title}</h3>
					</header>
					<div>
						<p className="book-lead">
							Một vài dự án bên cạnh lớp học — những bối cảnh khác nhau để học và thử.
						</p>
						<ul className="book-personal-projects">
							{projects.items.map((item, index) => (
								<li key={item.id}>
									<span className="book-caption">{String(index + 1).padStart(2, '0')}</span>
									{item.href ? (
										<Link href={item.href}>
											{item.title}
											<span aria-hidden="true">↗</span>
										</Link>
									) : (
										<span>{item.title}</span>
									)}
								</li>
							))}
						</ul>
					</div>
				</SectionReveal>
				<section className="book-closing">
					<blockquote>{aboutClosing.quote}</blockquote>
					<Link href={routes.projects} className="book-link">
						Xem những dự án tôi đang làm <span aria-hidden="true">→</span>
					</Link>
				</section>
				<div className="book-page-end">
					<Link href={routes.toc}>← Mục lục</Link>
					<Link href={routes.contact}>Gửi lời nhắn ↗</Link>
				</div>
			</article>
		</main>
	);
}
