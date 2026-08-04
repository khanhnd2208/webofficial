import type { Metadata } from 'next';
import Image from 'next/image';

import { ClosingNote, NotePreview, StructuredData, TrackedLink, TreasureItem } from '@/components/marketing';
import { SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import {
	closingMessage,
	corePositioning,
	homeClassroomCards,
	homeTrustLine,
	serviceTeasers,
} from '@/content/publicMarketing';
import { areNotesPublic, getPublishedNotes, notesArchive } from '@/content/notes';
import { getPublishableTreasure, isTreasurePublic, treasureSection } from '@/content/treasure';
import { getProject } from '@/features/portfolio';

export const metadata: Metadata = {
	title: { absolute: 'Duy Khánh — Giảng viên và người thiết kế trải nghiệm học tập' },
	description:
		'Trang cá nhân của Nguyễn Duy Khánh, giảng viên tại Hà Nội, chia sẻ các dự án giáo dục, trải nghiệm học tập, quản trị và ứng dụng AI.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: 'Duy Khánh — Giảng viên và người thiết kế trải nghiệm học tập',
		description:
			'Trang cá nhân của Nguyễn Duy Khánh, giảng viên tại Hà Nội, chia sẻ các dự án giáo dục, trải nghiệm học tập, quản trị và ứng dụng AI.',
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [
			{
				url: absoluteUrl('/og-editorial-premium.png'),
				width: 1734,
				height: 907,
				alt: 'Duy Khánh — Tôi làm giáo dục để tiếp tục học.',
			},
		],
	},
	twitter: { card: 'summary_large_image', images: [absoluteUrl('/og-editorial-premium.png')] },
};

export default function HomePage() {
	const classroomCards = homeClassroomCards
		.map((card) => {
			const project = getProject(card.slug);
			if (!project) return null;
			return { ...card, project };
		})
		.filter((card): card is NonNullable<typeof card> => Boolean(card));

	const showNotes = areNotesPublic();
	const latestNotes = showNotes ? getPublishedNotes().slice(0, 3) : [];
	const showTreasure = isTreasurePublic();
	const treasures = showTreasure ? getPublishableTreasure() : [];

	return (
		<main className="overflow-hidden bg-canvas">
			<StructuredData
				data={[
					{
						'@context': 'https://schema.org',
						'@type': 'Person',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						jobTitle: 'Lecturer and Learning Experience Designer',
						description: corePositioning.full,
					},
					{
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						description: corePositioning.full,
						inLanguage: 'vi-VN',
					},
				]}
			/>

			<section
				className="border-b border-hairline pt-[var(--header-height)]"
				aria-labelledby="home-title"
			>
				<div className="shell grid items-center gap-11 py-12 md:grid-cols-12 md:gap-10 md:py-16 lg:py-20">
					<div className="md:col-span-7 md:pr-6 lg:pr-14">
						<p className="editorial-label">{corePositioning.eyebrow}</p>
						<h1 id="home-title" className="premium-display mt-5 max-w-[18ch] text-ink">
							{corePositioning.manifesto}
						</h1>
						<p className="mt-5 max-w-[36rem] text-lg leading-[1.65] text-ink md:text-xl">
							{corePositioning.thesis}
						</p>
						<p className="premium-lead mt-6 max-w-[42rem]">{corePositioning.full}</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
							<TrackedLink
								href="#trong-lop-hoc"
								event="home_primary_cta_click"
								payload={{ sourcePage: routes.home, label: 'explore-work' }}
								className="editorial-button editorial-button-dark"
							>
								Khám phá những điều tôi đang làm <span aria-hidden>↓</span>
							</TrackedLink>
							<TrackedLink
								href={routes.about}
								event="home_secondary_cta_click"
								payload={{ sourcePage: routes.home, label: 'about' }}
								className="editorial-button border-hairline bg-transparent text-ink"
							>
								Tìm hiểu về tôi <span aria-hidden>↗</span>
							</TrackedLink>
						</div>
					</div>
					<div className="md:col-span-5" data-testid="home-hero-artwork">
						<div className="premium-media aspect-[4/5]">
							<Image
								src="/brand/learning-as-becoming-mobile.jpg"
								alt="Minh họa hành trình học hỏi và giảng dạy của Duy Khánh"
								fill
								priority
								sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 42vw, 480px"
								className="object-cover object-[15%_50%] grayscale-[8%] transition duration-1000 hover:scale-[1.02] hover:grayscale-0"
							/>
							<span className="absolute bottom-4 right-4 z-10 bg-canvas/92 px-3 py-2 text-xs tracking-[0.04em] text-ink-secondary backdrop-blur">
								{corePositioning.overlay}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section
				id="trong-lop-hoc"
				className="editorial-section scroll-mt-24 border-b border-hairline"
				aria-labelledby="classroom-title"
			>
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Trong lớp học</p>
						<h2 id="classroom-title" className="editorial-heading mt-5">
							Những chương trình và thử nghiệm giáo dục đang được thực hiện.
						</h2>
					</header>
					<div className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
						{classroomCards.map((card, index) => (
							<SectionReveal key={card.slug} className={index === 1 ? 'md:mt-10 lg:mt-0' : ''}>
								<TrackedLink
									href={routes.project(card.slug)}
									event="home_project_click"
									payload={{ slug: card.slug, sourcePage: routes.home }}
									className="group block"
								>
									<div className="premium-media aspect-[4/3]">
										<Image
											src={card.project.coverImage}
											alt=""
											fill
											sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) 44vw, 360px"
											className={`object-cover grayscale-[18%] transition duration-1000 group-hover:scale-[1.025] group-hover:grayscale-0 ${card.project.coverImage.includes('learning-as-becoming-desktop') ? 'object-left' : 'object-center'}`}
										/>
									</div>
									<div className="mt-6 border-t border-hairline pt-5">
										<p className="editorial-label">
											{card.project.category} · {card.project.status}
										</p>
										<h3 className="type-h3 mt-3 transition-colors group-hover:text-accent">
											{card.title}
										</h3>
										<p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-secondary">
											{card.description}
										</p>
										<span className="editorial-text-link mt-6">
											Xem thêm <span aria-hidden>→</span>
										</span>
									</div>
								</TrackedLink>
							</SectionReveal>
						))}
					</div>
					<TrackedLink
						href={routes.projects}
						event="home_secondary_cta_click"
						payload={{ sourcePage: routes.home, label: 'all-projects' }}
						className="editorial-button mt-14"
					>
						Xem tất cả công việc <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>

			<section className="border-b border-hairline bg-paper" aria-label="Lĩnh vực làm việc">
				<div className="shell py-8 md:py-10">
					<p className="text-center text-sm leading-[1.7] tracking-[0.02em] text-ink-secondary md:text-base">
						{homeTrustLine}
					</p>
				</div>
			</section>

			{showTreasure ? (
				<section className="editorial-section border-b border-hairline" aria-labelledby="treasure-title">
					<div className="shell">
						<header className="max-w-3xl">
							<p className="editorial-label">{treasureSection.eyebrow}</p>
							<h2 id="treasure-title" className="editorial-heading mt-5">
								{treasureSection.title}
							</h2>
							<p className="premium-lead mt-5">{treasureSection.lead}</p>
						</header>
						<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{treasures.map((item) => (
								<TreasureItem key={item.id} item={item} />
							))}
						</div>
					</div>
				</section>
			) : null}

			{showNotes ? (
				<section className="editorial-section border-b border-hairline bg-paper" aria-labelledby="notes-title">
					<div className="shell">
						<header className="max-w-3xl">
							<p className="editorial-label">{notesArchive.eyebrow}</p>
							<h2 id="notes-title" className="editorial-heading mt-5">
								{notesArchive.title}
							</h2>
							<p className="premium-lead mt-5">{notesArchive.subtitle}</p>
						</header>
						<div className="mt-10 max-w-3xl">
							{latestNotes.map((note) => (
								<NotePreview key={note.slug} note={note} />
							))}
						</div>
						<TrackedLink
							href={routes.notes}
							event="home_secondary_cta_click"
							payload={{ sourcePage: routes.home, label: 'notes' }}
							className="editorial-button mt-10"
						>
							Đọc những ghi chép mới <span aria-hidden>→</span>
						</TrackedLink>
					</div>
				</section>
			) : null}

			<section
				className="editorial-section border-b border-hairline"
				aria-labelledby="services-title"
			>
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Đồng hành</p>
						<h2 id="services-title" className="editorial-heading mt-5">
							Tôi có thể đồng hành cùng bạn.
						</h2>
					</header>
					<div className="mt-14 grid gap-0 border-t border-hairline md:grid-cols-3">
						{serviceTeasers.map((item) => (
							<SectionReveal
								as="article"
								key={item.id}
								className="border-b border-hairline py-9 md:border-b-0 md:border-r md:px-8 md:py-12 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
							>
								<h3 className="type-h3">{item.title}</h3>
								<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{item.description}</p>
							</SectionReveal>
						))}
					</div>
					<TrackedLink
						href={routes.services}
						event="service_cta_click"
						payload={{ sourcePage: routes.home, label: 'services-overview' }}
						className="editorial-button mt-12"
					>
						Xem các hình thức cộng tác <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>

			<ClosingNote
				eyebrow="Một lời nhắn"
				title={closingMessage.title}
				body={closingMessage.body}
				primaryCta={{
					href: routes.contact,
					label: closingMessage.cta,
					event: 'contact_open',
					payload: { sourcePage: routes.home, label: 'closing-message' },
				}}
			/>
		</main>
	);
}
