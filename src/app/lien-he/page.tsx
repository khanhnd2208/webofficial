import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactFormFromUrl } from '@/components/contact/ContactForm';
import { routes } from '@/config/routes';
import { absoluteUrl, siteProfile } from '@/config/site';
import { contactPage } from '@/content/publicMarketing';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';

export const metadata: Metadata = {
	title: 'Gửi tôi một lời nhắn',
	description:
		'Kể cho Duy Khánh về điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Một vài dòng có bối cảnh là đủ để bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

export default function ContactPage() {
	const availability = getInquiryAvailability();
	const email = siteProfile.contactEmail?.trim();
	const social = siteProfile.socialLinks?.filter((item) => item.href && item.label) ?? [];

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
						{email || social.length > 0 ? (
							<div className="mt-10 border-t border-hairline pt-7">
								<p className="editorial-label">Kênh trực tiếp</p>
								<div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
									{email ? (
										<a href={`mailto:${email}`} className="editorial-text-link">
											{email}
										</a>
									) : null}
									{social.map((item) => (
										<a
											key={item.href}
											href={item.href}
											target="_blank"
											rel="noopener noreferrer"
											className="editorial-text-link"
										>
											{item.label}
										</a>
									))}
								</div>
							</div>
						) : null}
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
