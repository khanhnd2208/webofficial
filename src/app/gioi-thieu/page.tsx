import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

import { StructuredData } from '@/components/marketing';
import SectionScroll from '@/components/marketing/SectionScroll';
import { aboutContent } from '@/content/about';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Giới thiệu',
	description: aboutContent.intro,
	alternates: { canonical: absoluteUrl(routes.about) },
};

export default function AboutPage() {
	const personLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		jobTitle: 'Giảng viên',
		description: aboutContent.intro,
	};

	return (
		<main className="min-h-screen">
			<StructuredData data={personLd} />
			<Suspense fallback={null}>
				<SectionScroll />
			</Suspense>

			<section className="section-space border-b border-hairline">
				<div className="shell max-w-3xl">
					<p className="text-sm font-medium text-accent">{aboutContent.eyebrow}</p>
					<h1 className="mt-4 font-display type-page-title font-medium text-ink">
						{aboutContent.heroHeadline}
					</h1>
					<p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						{aboutContent.intro}
					</p>
				</div>
			</section>

			<section
				id="dich-vu"
				className="section-space scroll-mt-[calc(var(--header-height)+1rem)] border-b border-hairline bg-paper/40"
			>
				<div className="shell">
					<p className="text-sm font-medium text-accent">Công việc</p>
					<h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
						Những công việc tôi đang làm
					</h2>
					<ul className="mt-10 grid gap-8 md:grid-cols-3">
						{aboutContent.journey.map((item) => (
							<li
								key={item.title}
								id={item.anchorId}
								className="scroll-mt-[calc(var(--header-height)+1rem)] border-t border-hairline pt-5"
							>
								<h3 className="font-display text-2xl font-medium text-ink">{item.title}</h3>
								<p className="mt-3 text-base leading-relaxed text-ink-secondary">{item.body}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section-space border-b border-hairline">
				<div className="shell max-w-3xl">
					<p className="text-sm font-medium text-accent">Cách tôi làm việc</p>
					<h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
						Tôi nghĩ về việc dạy và học
					</h2>
					<ul className="mt-8 space-y-0">
						{aboutContent.philosophy.map((line) => (
							<li key={line} className="border-t border-hairline py-5 text-base leading-relaxed text-ink-secondary">
								{line}
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section-space border-b border-hairline bg-paper/40">
				<div className="shell max-w-3xl">
					<h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Ngoài lớp học</h2>
					<p className="mt-5 text-lg leading-relaxed text-ink-secondary">{aboutContent.outsideWork}</p>
				</div>
			</section>

			<section id="dau-moc" className="scroll-mt-[calc(var(--header-height)+1rem)]" aria-label="Dấu mốc">
				<span className="sr-only">Dấu mốc sẽ được bổ sung khi có thông tin phù hợp.</span>
			</section>

			<section className="section-space">
				<div className="shell max-w-3xl">
					<p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
						Nếu bạn muốn đọc thêm hoặc gửi một lời nhắn, có thể bắt đầu từ đây.
					</p>
					<div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
						{aboutContent.ctas.map((cta) => (
							<Link key={cta.href} href={cta.href} className="text-sm font-semibold text-accent hover:underline">
								{cta.label} →
							</Link>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
