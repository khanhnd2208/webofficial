import type { Metadata } from 'next';
import { Suspense } from 'react';

import ContactForm from '@/components/contact/ContactForm';
import { isPrivacyPolicyPublished } from '@/content/policies';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Gửi lời nhắn',
	description: 'Gửi Duy Khánh một lời nhắn về lớp học, chương trình đào tạo hoặc một điều bạn muốn trao đổi.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

function isInquiryNotifyConfigured(): boolean {
	return Boolean(process.env.INQUIRY_NOTIFY_EMAIL?.trim() && process.env.RESEND_API_KEY?.trim());
}

export default function ContactPage() {
	const privacyOk = isPrivacyPolicyPublished();
	const emailOk = isInquiryNotifyConfigured();
	// Production requires notify email + Resend; local/dev can submit while email is pending.
	const formEnabled =
		privacyOk && (emailOk || process.env.NODE_ENV !== 'production');
	const disabledReason = !privacyOk
		? 'Chính sách bảo mật chưa sẵn sàng.'
		: !emailOk && process.env.NODE_ENV === 'production'
			? 'Kênh nhận lời nhắn chưa được cấu hình đầy đủ trên máy chủ.'
			: undefined;

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="text-sm font-medium text-accent">Lời nhắn</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">Gửi Khánh một lời nhắn</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Nếu bạn muốn trao đổi về một lớp học, chương trình đào tạo hoặc một vấn đề mà tôi có thể hỗ trợ,
						hãy để lại vài dòng bên dưới. Tôi sẽ đọc và phản hồi qua email.
					</p>
				</div>
			</section>
			<section>
				<div className="shell max-w-2xl py-12 sm:py-14">
					<Suspense fallback={<p className="text-sm text-ink-secondary">Đang tải form…</p>}>
						<ContactForm formEnabled={formEnabled} disabledReason={disabledReason} />
					</Suspense>
				</div>
			</section>
		</main>
	);
}
