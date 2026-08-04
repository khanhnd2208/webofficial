import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import {
	ClosingNote,
	PrincipleBlock,
	StructuredData,
	TrackedLink,
	TreasureItem,
} from '@/components/marketing';
import { EditorialCover, SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import {
	aboutBeyond,
	aboutClosing,
	aboutCredentials,
	aboutHero,
	aboutPath,
	aboutPrinciples,
	aboutWorkToday,
} from '@/content/about';
import { areNotesPublic } from '@/content/notes';
import { getPublishableTreasure, isTreasurePublic } from '@/content/treasure';

export const metadata: Metadata = {
	title: 'Giới thiệu — Nguyễn Duy Khánh',
	description:
		'Con đường của Nguyễn Duy Khánh từ quản trị, nhân sự, kinh doanh và công nghệ — luôn quay trở lại lớp học và câu hỏi làm thế nào để một điều khó trở nên rõ ràng.',
	alternates: { canonical: absoluteUrl(routes.about) },
};

function workLinkHref(hrefKey: (typeof aboutWorkToday.links)[number]['hrefKey']): string {
	switch (hrefKey) {
		case 'classroom':
			return routes.homeLearningExperiences;
		case 'research':
			return routes.project('ai-in-recruitment-research');
		case 'projects':
		default:
			return routes.projects;
	}
}

export default function AboutPage() {
	const showNotes = areNotesPublic();
	const showTreasure = isTreasurePublic();
	const treasures = showTreasure ? getPublishableTreasure().slice(0, 3) : [];
	const readingItems = aboutBeyond.reading.items;
	const showReading = readingItems.length > 0;
	const showBeyond = showNotes || showReading;

	return (
		<main className="bg-canvas">
			<StructuredData
				data={{
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: 'Nguyễn Duy Khánh',
					alternateName: SITE_NAME,
					url: SITE_ORIGIN,
					jobTitle: 'Lecturer and Learning Experience Designer',
					worksFor: {
						'@type': 'Organization',
						name: 'Trường Đại học Hà Nội',
					},
					description: aboutHero.lead,
				}}
			/>

			<section className="border-b border-hairline">
				<div className="shell grid items-center gap-10 py-12 md:grid-cols-12 md:py-16 lg:py-20">
					<header className="md:col-span-7">
						<p className="editorial-label">{aboutHero.eyebrow}</p>
						<h1 className="premium-display mt-5 max-w-[16ch] text-ink">{aboutHero.title}</h1>
						<p className="premium-lead mt-6 max-w-2xl">{aboutHero.lead}</p>
					</header>
					<div className="md:col-span-5">
						<EditorialCover title="Duy Khánh" kicker="Hà Nội · Lớp học" aspectRatio="4 / 5" />
					</div>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline">
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Câu chuyện</p>
						<h2 className="editorial-heading mt-5">{aboutPath.title}</h2>
					</header>
					<div className="mt-14 space-y-20 md:space-y-28">
						{aboutPath.chapters.map((chapter, index) => (
							<SectionReveal
								key={chapter.id}
								className="grid items-start gap-8 border-t border-hairline pt-12 md:grid-cols-12 md:gap-12"
							>
								<span className="font-mono text-xs text-accent md:col-span-1">
									{String(index + 1).padStart(2, '0')}
								</span>
								<div className={chapter.mediaSrc ? 'md:col-span-6' : 'md:col-span-8'}>
									<h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink md:text-3xl">
										{chapter.title}
									</h3>
									<p className="mt-5 max-w-2xl text-lg leading-[1.75] text-ink-secondary">
										{chapter.body}
									</p>
									<p className="mt-6 max-w-xl border-l border-accent pl-5 text-base leading-[1.7] text-ink">
										{chapter.milestone}
									</p>
								</div>
								{chapter.mediaSrc ? (
									<figure className="md:col-span-5">
										<div className="premium-media relative aspect-[4/5]">
											<Image
												src={chapter.mediaSrc}
												alt={chapter.mediaAlt ?? ''}
												fill
												sizes="(max-width: 767px) calc(100vw - 48px), 36vw"
												className="object-cover"
											/>
										</div>
									</figure>
								) : null}
							</SectionReveal>
						))}
					</div>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell grid gap-10 lg:grid-cols-12 lg:gap-16">
					<header className="lg:col-span-5">
						<p className="editorial-label">{aboutWorkToday.eyebrow}</p>
						<h2 className="editorial-heading mt-5">{aboutWorkToday.title}</h2>
					</header>
					<div className="lg:col-span-6 lg:col-start-7">
						<p className="text-lg leading-[1.75] text-ink-secondary">{aboutWorkToday.body}</p>
						<ul className="mt-10 space-y-0 border-t border-hairline">
							{aboutWorkToday.links.map((link) => (
								<li key={link.id} className="border-b border-hairline">
									<TrackedLink
										href={workLinkHref(link.hrefKey)}
										event="home_secondary_cta_click"
										payload={{ sourcePage: routes.about, label: link.id }}
										className="group flex min-h-14 items-center justify-between py-5 text-base font-semibold text-ink transition-colors hover:text-accent"
									>
										{link.label}
										<span
											className="transition-transform group-hover:translate-x-1"
											aria-hidden
										>
											→
										</span>
									</TrackedLink>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<PrincipleBlock items={aboutPrinciples.items} />

			{showBeyond ? (
				<section className="editorial-section border-b border-hairline">
					<div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
						<header className="lg:col-span-4">
							<p className="editorial-label">Ngoài lớp học</p>
							<h2 className="editorial-heading mt-5">{aboutBeyond.title}</h2>
							<p className="premium-lead mt-5">{aboutBeyond.lead}</p>
						</header>
						<div className="space-y-12 lg:col-span-7 lg:col-start-6">
							{showNotes ? (
								<article className="border-t border-hairline pt-6">
									<h3 className="type-h3">{aboutBeyond.hanoicam.title}</h3>
									<p className="mt-3 text-base leading-[1.7] text-ink-secondary">
										{aboutBeyond.hanoicam.body}
									</p>
									<Link href={routes.notes} className="editorial-text-link mt-5">
										Đọc những ghi chép <span aria-hidden>→</span>
									</Link>
								</article>
							) : null}
							{showReading ? (
								<article className="border-t border-hairline pt-6">
									<h3 className="type-h3">{aboutBeyond.reading.title}</h3>
									{aboutBeyond.reading.question ? (
										<p className="mt-4 font-display text-xl leading-[1.45] text-ink">
											{aboutBeyond.reading.question}
										</p>
									) : null}
									<ul className="mt-6 space-y-4">
										{readingItems.map((item) => (
											<li
												key={item.title}
												className="border-b border-hairline pb-4 text-base text-ink-secondary"
											>
												<span className="font-medium text-ink">{item.title}</span>
												{item.note ? (
													<span className="mt-1 block text-sm">{item.note}</span>
												) : null}
											</li>
										))}
									</ul>
									{aboutBeyond.reading.updatedAt ? (
										<p className="mt-4 text-sm text-ink-secondary">
											Cập nhật: {aboutBeyond.reading.updatedAt}
										</p>
									) : null}
								</article>
							) : null}
						</div>
					</div>
				</section>
			) : null}

			{showTreasure ? (
				<section className="editorial-section border-b border-hairline bg-paper">
					<div className="shell">
						<p className="editorial-label">My Treasure</p>
						<p className="mt-5 max-w-2xl text-base leading-[1.7] text-ink-secondary">
							Những mảnh nhỏ người học để lại — nhắc tôi rằng mối quan hệ trong lớp học có thật.
						</p>
						<div className="mt-10 grid gap-6 sm:grid-cols-3">
							{treasures.map((item) => (
								<TreasureItem key={item.id} item={item} />
							))}
						</div>
					</div>
				</section>
			) : null}

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell grid gap-10 lg:grid-cols-12">
					<header className="lg:col-span-4">
						<p className="editorial-label">{aboutCredentials.title}</p>
					</header>
					<dl className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
						{aboutCredentials.items.map((item) => (
							<div key={item.label} className="border-t border-hairline pt-4">
								<dt className="text-sm text-ink-secondary">{item.label}</dt>
								<dd className="mt-2 text-base font-medium text-ink">{item.value}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			<ClosingNote
				title={showNotes ? aboutClosing.titleWithNotes : aboutClosing.titleWithoutNotes}
				primaryCta={{
					href: routes.projects,
					label: aboutClosing.primaryCta.label,
					event: 'home_secondary_cta_click',
					payload: { sourcePage: routes.about, label: 'projects' },
				}}
				secondaryCta={
					showNotes
						? {
								href: routes.notes,
								label: aboutClosing.notesCta.label,
								event: 'home_secondary_cta_click',
								payload: { sourcePage: routes.about, label: 'notes' },
							}
						: {
								href: routes.contact,
								label: aboutClosing.contactCta.label,
								event: 'contact_open',
								payload: { sourcePage: routes.about, label: 'contact' },
							}
				}
			/>
		</main>
	);
}
