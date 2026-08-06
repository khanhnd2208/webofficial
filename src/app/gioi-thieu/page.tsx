import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StructuredData } from '@/components/marketing';
import JourneyLine from '@/components/motion/JourneyLine';
import SectionReveal from '@/components/motion/SectionReveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import UnderlineDraw from '@/components/motion/UnderlineDraw';
import { routes } from '@/config/routes';
import {
	BRAND_PLACEHOLDER_ALT,
	BRAND_PLACEHOLDER_IMAGE,
	SITE_NAME,
	SITE_ORIGIN,
	absoluteUrl,
	siteProfile,
} from '@/config/site';
import {
	aboutClosing,
	aboutCredentials,
	aboutHero,
	aboutJourney,
	type AboutProjectItem,
	type AboutWorkItem,
} from '@/content/about';

export const metadata: Metadata = {
	title: `Giới thiệu — ${aboutHero.fullName}`,
	description: `${aboutHero.quote} ${aboutHero.manifesto}`,
	alternates: { canonical: absoluteUrl(routes.about) },
};

function QuoteMark({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden
		>
			<path d="M7.17 6C5.42 6 4 7.42 4 9.17c0 1.16.64 2.16 1.57 2.67L4 17h4.5l1.2-4.16A3.18 3.18 0 0 0 10.34 9.17C10.34 7.42 8.92 6 7.17 6Zm9.66 0C14.08 6 12.66 7.42 12.66 9.17c0 1.16.64 2.16 1.57 2.67L12.66 17H17.16l1.2-4.16a3.18 3.18 0 0 0 .47-3.67C18.83 7.42 17.41 6 16.83 6Z" />
		</svg>
	);
}

function PinIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
		</svg>
	);
}

const WORK_ICONS: Record<AboutWorkItem['icon'], ReactNode> = {
	teaching: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M20 17v-1c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v1H2v2h20v-2h-2Zm-2 0H6v-1h12v1ZM12 3 1 9l4 2.18V15c0 2.21 3.58 4 8 4s8-1.79 8-4v-3.82L23 9 12 3Zm6 12c0 .55-2.24 2-6 2s-6-1.45-6-2v-2.09l6 3.27 6-3.27V15Z" />
		</svg>
	),
	design: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 18H6V4h12v16ZM8 6h8v2H8V6Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z" />
		</svg>
	),
	ai: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M12 2a2 2 0 0 0-2 2c0 .74.4 1.38 1 1.72V7H9a4 4 0 0 0-4 4v1H3v2h2v1a4 4 0 0 0 4 4h1v2.28A2 2 0 0 0 10 22h4a2 2 0 0 0 0-4h-1v-2.28A2.01 2.01 0 0 0 14 15h1a4 4 0 0 0 4-4v-1h2v-2h-2v-1a4 4 0 0 0-4-4h-2V5.72c.6-.34 1-.98 1-1.72a2 2 0 0 0-2-2Zm-3 7h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" />
		</svg>
	),
};

const PROJECT_ICONS: Record<AboutProjectItem['icon'], ReactNode> = {
	factory: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M22 10v12H2V10l7-5v4l6-4v5h7ZM4 20h16v-8h-5V8.7l-6 4V9.3L4 13.3V20Z" />
		</svg>
	),
	moon: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M12.1 2.05a1 1 0 0 0-1.05 1.25A8 8 0 1 0 19.7 16a1 1 0 0 0-.1-1.9 6 6 0 0 1-6.15-9.9 1 1 0 0 0-1.35-2.15Z" />
		</svg>
	),
	forum: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M21 6h-2v9H6v2a1 1 0 0 0 1 1h11l4 4V7a1 1 0 0 0-1-1ZM17 12V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14l4-4h10a1 1 0 0 0 1-1Z" />
		</svg>
	),
	camera: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M20 5h-3.2l-1.8-2H9L7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 14H4V7h4.05l1.8-2h4.3l1.8 2H20v12Zm-8-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
		</svg>
	),
	pets: (
		<svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
			<path d="M4.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5-3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5 3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
		</svg>
	),
};

function PartBadge({ label }: { label: string }) {
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-paper font-display text-xl text-accent">
			{label}
		</div>
	);
}

function ProjectTile({ item }: { item: AboutProjectItem }) {
	const body = (
		<>
			<span className="mb-2 text-ink-secondary opacity-70 transition-colors duration-300 group-hover:text-accent group-hover:opacity-100">
				{PROJECT_ICONS[item.icon]}
			</span>
			<span className="text-center text-[0.6875rem] font-semibold uppercase leading-snug tracking-[0.04em] text-ink">
				{item.lines.map((line) => (
					<span key={line} className="block">
						{line}
					</span>
				))}
			</span>
			<span
				className="mt-2 block h-px w-6 origin-center scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
				aria-hidden
			/>
		</>
	);

	const className =
		'group flex h-[120px] w-[120px] flex-col items-center justify-center border border-hairline bg-transparent p-2 text-center transition-colors duration-300 hover:border-ink/30';

	if (item.href) {
		return (
			<Link href={item.href} className={className} aria-label={item.title}>
				{body}
			</Link>
		);
	}

	return (
		<div className={className} aria-label={item.title}>
			{body}
		</div>
	);
}

export default function AboutPage() {
	const portraitSrc = siteProfile.portraitSrc ?? BRAND_PLACEHOLDER_IMAGE;
	const { currentWork, classrooms, projects } = aboutJourney;

	return (
		<main className="bg-canvas selection:bg-accent/20 selection:text-ink">
			<StructuredData
				data={{
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: aboutHero.fullName,
					alternateName: SITE_NAME,
					url: SITE_ORIGIN,
					jobTitle: 'Lecturer and Learning Experience Designer',
					image: absoluteUrl(portraitSrc),
					worksFor: {
						'@type': 'Organization',
						name: 'Trường Đại học Hà Nội',
					},
					description: `${aboutHero.quote} ${aboutCredentials.closing}`,
				}}
			/>

			<article className="shell relative pb-20 pt-20 md:pb-24 md:pt-24 lg:pt-28">
				{/* Section 1: Hero Profile */}
				<SectionReveal
					as="section"
					className="mb-16 grid grid-cols-1 items-center gap-12 pt-4 md:mb-24 md:grid-cols-12 md:gap-8 md:pt-8"
				>
					<div className="relative flex justify-center md:col-span-6 md:justify-start">
						<div
							aria-hidden
							className="about-frame-tilt absolute -top-8 -left-4 z-0 h-full w-full max-w-[340px] rotate-[-3deg] bg-section-tint opacity-40 md:-left-8"
						/>
						<div
							aria-hidden
							className="about-frame-tilt-alt absolute -right-2 -bottom-6 z-0 h-full w-full max-w-[340px] rotate-[2deg] bg-[#E6E2D9] opacity-30"
						/>
						<figure className="relative z-10 w-full max-w-[340px] border border-hairline bg-surface-elevated p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]">
							<div className="relative mb-6 aspect-[3/4] overflow-hidden border border-hairline">
								<Image
									src={portraitSrc}
									alt={BRAND_PLACEHOLDER_ALT}
									fill
									priority
									sizes="(max-width: 767px) min(100vw - 48px, 340px), 340px"
									className="object-cover contrast-125 sepia-[0.1]"
								/>
								<div
									aria-hidden
									className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]"
								/>
							</div>
							<figcaption className="text-center font-mono text-[13px] tracking-widest text-ink-secondary uppercase italic opacity-60">
								{aboutHero.portraitCaption}
							</figcaption>
						</figure>
					</div>

					<div className="flex flex-col justify-center md:col-span-6 md:pl-8">
						<p className="mb-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] italic leading-[1.2] text-ink-secondary opacity-80">
							{aboutHero.greeting}
						</p>
						<h1 className="mb-6 font-display text-[clamp(2.75rem,8vw,4.5rem)] font-semibold leading-[0.9] tracking-tight text-ink">
							{aboutHero.name}
						</h1>
						<UnderlineDraw className="mb-10 w-16" tone="accent" />
						<div className="relative max-w-lg pl-10">
							<QuoteMark className="absolute -top-4 -left-2 z-0 h-16 w-16 select-none text-section-tint" />
							<p className="relative z-10 font-display text-[clamp(1.125rem,2.5vw,1.25rem)] leading-[1.8] text-ink italic">
								{aboutHero.quote}
							</p>
						</div>
					</div>
				</SectionReveal>

				{/* Section 2: Journey Map */}
				<section className="relative mt-16 mb-16 md:mt-24 md:mb-24">
					<SectionReveal className="relative mb-12 flex items-center justify-center gap-4 md:mb-16">
						<div
							aria-hidden
							className="h-px max-w-[120px] flex-grow bg-hairline opacity-50"
						/>
						<div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-section-tint shadow-sm">
							<PinIcon className="h-5 w-5 text-accent" />
						</div>
						<h2 className="max-w-[14rem] text-center font-display text-[clamp(1.5rem,3vw,2rem)] font-medium leading-[1.3] text-ink sm:max-w-none sm:whitespace-nowrap sm:px-4">
							{aboutJourney.title}
						</h2>
						<div
							aria-hidden
							className="h-px max-w-[120px] flex-grow bg-hairline opacity-50"
						/>
					</SectionReveal>

					<div className="mx-auto mb-10 hidden max-w-xs text-accent md:block" aria-hidden>
						<JourneyLine variant="process" className="h-8 w-full" />
					</div>

					<div className="about-journey relative mx-auto max-w-5xl pl-12 md:pl-0">
						{/* Mobile timeline spine */}
						<div aria-hidden className="about-timeline-line z-0 md:hidden" />

						{/* Part A */}
						<SectionReveal className="group relative mb-16 md:mb-20 md:text-center">
							<div aria-hidden className="about-timeline-branch absolute top-6 left-[-24px] w-6 md:hidden" />
							<div className="relative z-10 mb-8 flex items-center gap-4 md:justify-center">
								<PartBadge label={currentWork.label} />
								<h3 className="font-display text-2xl font-medium text-ink">
									{currentWork.title}
								</h3>
							</div>

							<StaggerGroup className="relative z-10 grid grid-cols-1 gap-0 border border-hairline md:grid-cols-3">
								{currentWork.items.map((item, index) => (
									<StaggerItem
										key={item.id}
										className={`group flex flex-col items-center border-hairline bg-transparent p-8 text-center transition-colors duration-500 hover:bg-paper/40 md:p-10 ${
											index < currentWork.items.length - 1
												? 'border-b md:border-r md:border-b-0'
												: ''
										}`}
									>
										<span className="mb-5 text-ink-secondary opacity-55 transition-colors duration-300 group-hover:text-accent group-hover:opacity-100">
											{WORK_ICONS[item.icon]}
										</span>
										<h4 className="mb-3 font-display text-xl text-ink">{item.title}</h4>
										<p className="text-sm leading-relaxed text-ink-secondary">{item.body}</p>
									</StaggerItem>
								))}
							</StaggerGroup>
						</SectionReveal>

						{/* Part B */}
						<SectionReveal className="relative mb-16 md:mb-20 md:text-center">
							<div aria-hidden className="about-timeline-branch absolute top-6 left-[-24px] w-6 md:hidden" />
							<div
								aria-hidden
								className="about-timeline-connector absolute top-[-60px] left-1/2 hidden h-[60px] w-px md:block"
							/>
							<div className="relative z-10 mb-8 flex items-center gap-4 md:justify-center">
								<PartBadge label={classrooms.label} />
								<h3 className="font-display text-2xl font-medium text-ink">
									{classrooms.title}
								</h3>
							</div>
							<div className="relative z-10 border border-hairline bg-transparent p-8 md:p-10">
								<div
									aria-hidden
									className="absolute -top-1.5 left-1/4 h-3 w-3 rounded-full border border-hairline bg-canvas"
								/>
								<div
									aria-hidden
									className="absolute -top-1.5 right-1/4 h-3 w-3 rounded-full border border-hairline bg-canvas"
								/>
								<ul className="flex flex-wrap justify-center gap-x-6 gap-y-4">
									{classrooms.items.map((school) => (
										<li
											key={school}
											className="cursor-default border-b border-hairline px-6 py-2 text-base text-ink-secondary transition-colors duration-300 hover:border-accent hover:text-ink"
										>
											{school}
										</li>
									))}
								</ul>
							</div>
						</SectionReveal>

						{/* Part C */}
						<SectionReveal className="relative md:text-center">
							<div aria-hidden className="about-timeline-branch absolute top-6 left-[-24px] w-6 md:hidden" />
							<div
								aria-hidden
								className="absolute top-6 left-[-24px] z-10 mt-px h-12 w-px bg-canvas md:hidden"
							/>
							<div
								aria-hidden
								className="about-timeline-connector absolute top-[-60px] left-1/2 hidden h-[60px] w-px md:block"
							/>
							<div className="relative z-10 mb-8 flex items-center gap-4 md:justify-center">
								<PartBadge label={projects.label} />
								<h3 className="font-display text-2xl font-medium text-ink">
									{projects.title}
								</h3>
							</div>
							<div className="relative z-10 border border-hairline bg-transparent p-6 md:p-8">
								<div
									aria-hidden
									className="absolute -top-1.5 left-[20%] h-3 w-3 rounded-full border border-hairline bg-canvas"
								/>
								<div
									aria-hidden
									className="absolute -top-1.5 right-[20%] h-3 w-3 rounded-full border border-hairline bg-canvas"
								/>
								<div className="flex flex-wrap justify-center gap-4 md:gap-6">
									{projects.items.map((item) => (
										<ProjectTile key={item.id} item={item} />
									))}
								</div>
							</div>
						</SectionReveal>
					</div>
				</section>

				{/* Section 3: Closing quote */}
				<SectionReveal
					as="section"
					className="relative mx-auto mt-16 mb-8 max-w-3xl px-4 text-center md:mt-24 md:mb-12"
				>
					<QuoteMark className="mx-auto mb-8 block h-14 w-14 text-section-tint" />
					<p className="mx-auto max-w-2xl font-display text-[clamp(1.25rem,3vw,2.25rem)] leading-relaxed text-ink italic">
						{aboutClosing.quote}
					</p>
					<UnderlineDraw className="mx-auto mt-12 w-16 opacity-40" tone="accent" />
					<p className="sr-only">{aboutCredentials.closing}</p>
				</SectionReveal>
			</article>
		</main>
	);
}
