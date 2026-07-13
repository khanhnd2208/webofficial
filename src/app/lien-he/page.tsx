import type { Metadata } from 'next';
import { Suspense } from 'react';

import ContactForm from '@/components/contact/ContactForm';
import { isPrivacyPolicyPublished } from '@/content/policies';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Liên hệ',
	description: 'Trao đổi cùng Khánh về mentoring, cố vấn, đào tạo hoặc AI ứng dụng.',
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
			? 'Email nhận thông báo inquiry chưa được cấu hình trên máy chủ (INQUIRY_NOTIFY_EMAIL + RESEND_API_KEY).'
			: undefined;

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">Liên hệ</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">Trao đổi cùng Khánh</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Chọn loại nhu cầu và mô tả ngắn bối cảnh. Chi phí chỉ được đề xuất sau khi làm rõ đầu ra và phạm vi —
						không báo giá tức thì trên form.
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
