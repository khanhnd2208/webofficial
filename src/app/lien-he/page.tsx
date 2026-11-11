import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactFormFromUrl } from '@/components/contact/ContactForm';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { contactChannels, contactPage } from '@/content/publicMarketing';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';

export const metadata: Metadata = {
	title: 'Gửi tôi một lời nhắn',
	description:
		'Kể cho Duy Khánh về điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Một vài dòng có bối cảnh là đủ để bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

export default function ContactPage() {
	const availability = getInquiryAvailability();

	return (
		<main className="bg-canvas">
			<section className="border-b border-hairline">
				<div className="shell grid gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-24">
					<header className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
						<p className="editorial-label">{contactPage.eyebrow}</p>
						<h1 className="premium-display mt-5 max-w-[12ch] text-ink">{contactPage.title}</h1>
						<p className="premium-lead mt-6">{contactPage.lead}</p>
						<p className="mt-8 border-l border-accent pl-5 font-display text-xl italic leading-[1.45] text-ink md:text-2xl">
							{contactPage.aside}
						</p>
						<div className="mt-10 border-t border-hairline pt-7">
							<p className="editorial-label">Kênh trực tiếp</p>
							<ul className="mt-4 space-y-5" aria-label="Kênh liên hệ">
								{contactChannels.map((channel) => {
									const external = channel.href.startsWith('http');
									return (
										<li key={channel.id}>
											<p className="text-footnote text-ink-secondary">{channel.label}</p>
											<a
												href={channel.href}
												className="editorial-text-link"
												data-testid={`contact-${channel.id}`}
												{...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
											>
												{channel.value}
											</a>
											<p className="mt-1 text-footnote leading-relaxed text-ink-secondary">
												{channel.description}
												{'note' in channel ? ` ${channel.note}` : null}
											</p>
										</li>
									);
								})}
							</ul>
						</div>
					</header>

					<section
						id="contact-form"
						className="scroll-mt-24 lg:col-span-6 lg:col-start-7"
						aria-label="Biểu mẫu liên hệ"
					>
						<div className="border border-hairline bg-paper p-5 sm:p-8 lg:p-10">
							<Suspense
								fallback={
									<div
										className="h-80 animate-pulse bg-canvas"
										aria-label="Đang chuẩn bị biểu mẫu"
									/>
								}
							>
								<ContactFormFromUrl
									formEnabled={availability.enabled}
									disabledReason={availability.disabledReason}
								/>
							</Suspense>
						</div>

						<div className="mt-10 border-t border-hairline pt-8">
							<p className="editorial-label">Sau khi bạn gửi</p>
							<p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-secondary">
								{contactPage.afterSubmit}
							</p>
						</div>
					</section>
				</div>
			</section>
		</main>
	);
}
