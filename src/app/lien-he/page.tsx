import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactFormFromUrl } from '@/components/contact/ContactForm';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';

export const metadata: Metadata = {
	title: 'Gửi lời nhắn',
	description:
		'Gửi Duy Khánh một lời nhắn về lớp học, chương trình đào tạo hoặc một điều bạn muốn trao đổi.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

export default function ContactPage() {
	const availability = getInquiryAvailability();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline bg-[#eee8df]">
				<div className="shell py-14 sm:py-20">
					<p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
						Liên hệ với Khánh
					</p>
					<h1 className="mt-4 max-w-3xl font-display type-page-title font-medium text-ink">
						Gửi tôi một lời nhắn
					</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Nếu bạn muốn trao đổi về một lớp học, chương trình đào tạo hoặc một vấn đề mà tôi có thể
						hỗ trợ, hãy để lại vài dòng bên dưới. Tôi sẽ đọc và phản hồi qua email.
					</p>
				</div>
			</section>
			<section>
				<div className="shell max-w-[45rem] py-12 sm:py-16">
					<Suspense fallback={<p className="text-sm text-ink-secondary">Đang tải form…</p>}>
						<ContactFormFromUrl
							formEnabled={availability.enabled}
							disabledReason={availability.disabledReason}
						/>
					</Suspense>
				</div>
			</section>
		</main>
	);
}
