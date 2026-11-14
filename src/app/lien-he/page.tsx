import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';

import { ContactFormFromUrl } from '@/components/contact/ContactForm';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { aboutCollaboration, aboutHero } from '@/content/about';
import { contactChannels, contactPage } from '@/content/publicMarketing';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';

export const metadata: Metadata = {
	title: 'Về tôi',
	description:
		'Nguyễn Duy Khánh, giảng viên Quản trị tại Trường Đại học Hà Nội. Cách liên hệ, những việc có thể làm cùng nhau, và một ô để gửi lời nhắn.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

/** One band of the page: a small label and heading on the left, content on the right. */
function Band({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
	const headingId = `${id}-title`;
	return (
		<section id={id} aria-labelledby={headingId} className="scroll-mt-24 border-b border-hairline">
			<div className="shell grid gap-8 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
				<h2
					id={headingId}
					className="font-display text-2xl leading-tight text-ink lg:col-span-4 md:text-3xl"
				>
					{title}
				</h2>
				<div className="lg:col-span-8">{children}</div>
			</div>
		</section>
	);
}

export default function ContactPage() {
	const availability = getInquiryAvailability();

	return (
		<main className="bg-canvas" data-testid="about-page">
			<section className="border-b border-hairline">
				<div className="shell grid items-end gap-10 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
					<header className="lg:col-span-7">
						<h1 className="premium-display text-ink">{aboutHero.fullName}</h1>
						<p className="mt-4 text-base text-ink-secondary md:text-lg">
							{aboutHero.role} · {aboutHero.organisation}
						</p>
						<p className="mt-8 border-l border-accent pl-5 font-display text-xl italic leading-[1.45] text-ink md:text-2xl">
							{aboutHero.manifesto}
						</p>
						<div className="mt-8 max-w-[62ch] space-y-4 text-base leading-[1.75] text-ink-secondary md:text-lg">
							{contactPage.intro.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
						</div>
					</header>
					<div className="mx-auto w-full max-w-[16rem] sm:max-w-xs lg:col-span-5 lg:max-w-sm">
						<Image
							src="/brand/hero-journey-cutout-v1.webp"
							alt="Minh họa Duy Khánh trên hành trình"
							width={720}
							height={900}
							sizes="(min-width: 1024px) 24rem, 16rem"
							className="h-auto w-full"
							preload
						/>
					</div>
				</div>
			</section>

			<Band id="kenh-lien-he" title={contactPage.channelsTitle}>
				<ul className="border-t border-hairline" aria-label="Kênh liên hệ">
					{contactChannels.map((channel) => {
						const external = channel.href.startsWith('http');
						return (
							<li key={channel.id} className="border-b border-hairline">
								<a
									href={channel.href}
									data-testid={`contact-${channel.id}`}
									className="group grid gap-1 py-5 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-6"
									{...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
								>
									<span className="editorial-label">{channel.label}</span>
									<span>
										<span className="block break-all font-display text-xl text-ink group-hover:text-accent md:text-2xl">
											{channel.value}
										</span>
										<span className="mt-1 block text-footnote leading-relaxed text-ink-secondary">
											{channel.description}
											{'note' in channel ? ` ${channel.note}` : null}
										</span>
									</span>
									<span
										aria-hidden="true"
										className="hidden text-xl text-ink-secondary group-hover:text-accent sm:block"
									>
										{external ? '↗' : '→'}
									</span>
								</a>
							</li>
						);
					})}
				</ul>
			</Band>

			<Band id={aboutCollaboration.id} title={contactPage.collaborationTitle}>
				<dl className="border-t border-hairline">
					{aboutCollaboration.items.map((item) => (
						<div
							key={item.id}
							className="grid gap-1 border-b border-hairline py-5 sm:grid-cols-[14rem_1fr] sm:gap-6"
						>
							<dt className="font-display text-lg text-ink md:text-xl">{item.title}</dt>
							<dd className="text-base leading-relaxed text-ink-secondary">{item.description}</dd>
						</div>
					))}
				</dl>
			</Band>

			<Band id="contact-form" title={contactPage.formTitle}>
				<p className="max-w-[56ch] text-base leading-relaxed text-ink-secondary">
					{contactPage.formLead}
				</p>
				<div className="mt-8 border border-hairline bg-paper p-5 sm:p-8">
					<Suspense
						fallback={
							<div className="h-80 animate-pulse bg-canvas" aria-label="Đang chuẩn bị biểu mẫu" />
						}
					>
						<ContactFormFromUrl
							formEnabled={availability.enabled}
							disabledReason={availability.disabledReason}
						/>
					</Suspense>
				</div>
			</Band>
		</main>
	);
}
