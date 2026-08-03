import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactFormFromUrl } from '@/components/contact/ContactForm';
import { ProofNote } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl, siteProfile } from '@/config/site';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';

export const metadata: Metadata = {
	title: 'Chọn nội dung muốn trao đổi',
	description:
		'Chia sẻ bối cảnh nếu bạn muốn học quản trị, đào tạo một đội ngũ, thiết kế chương trình hoặc giải quyết một vấn đề doanh nghiệp cùng Duy Khánh.',
	alternates: { canonical: absoluteUrl(routes.contact) },
};

const steps = [
	['01', 'Bạn chia sẻ', 'Bối cảnh, đối tượng và kết quả mong muốn.'],
	['02', 'Tôi xem xét', 'Mức độ phù hợp, câu hỏi cần làm rõ và cách bắt đầu.'],
	['03', 'Hai bên thống nhất', 'Đầu ra, phạm vi, thời gian và trách nhiệm nếu tiếp tục.'],
] as const;

export default function ContactPage() {
	const availability = getInquiryAvailability();
	const email = siteProfile.contactEmail?.trim();
	const social = siteProfile.socialLinks?.filter((item) => item.href && item.label) ?? [];
	return (
		<main className="bg-canvas">
			<section className="border-b border-hairline">
				<div className="shell grid gap-14 py-14 lg:grid-cols-12 lg:gap-20 lg:py-24">
					<header className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
						<p className="editorial-label">Liên hệ</p>
						<h1 className="premium-display mt-5 max-w-[12ch] text-ink">
							Chọn nội dung muốn trao đổi.
						</h1>
						<p className="premium-lead mt-6">
							Bạn không cần chuẩn bị một đề bài hoàn chỉnh. Hãy cho tôi biết bối cảnh, người liên
							quan và điều bạn muốn thay đổi.
						</p>
						<a href="#contact-form" className="editorial-text-link mt-6 lg:hidden">
							Điền biểu mẫu <span aria-hidden>↓</span>
						</a>
						<div className="mt-9 hidden space-y-5 border-t border-hairline pt-7 lg:block">
							{steps.map(([number, title, body]) => (
								<div key={number} className="grid grid-cols-[2.5rem_1fr] gap-3">
									<span className="font-mono text-xs text-accent">{number}</span>
									<div>
										<p className="text-base font-semibold text-ink">{title}</p>
										<p className="mt-1 text-sm leading-[1.65] text-ink-secondary">{body}</p>
									</div>
								</div>
							))}
						</div>
						<ProofNote>
							Tôi sẽ đọc bối cảnh và phản hồi qua email với câu hỏi hoặc bước tiếp theo phù hợp.
						</ProofNote>
						{email || social.length > 0 ? (
							<div className="mt-9 border-t border-hairline pt-7">
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
						<div className="border border-hairline bg-paper p-5 shadow-[0_12px_40px_rgb(53_43_27_/_0.05)] sm:p-8 lg:p-10">
							<div className="mb-8">
								<p className="editorial-label">Thông tin trao đổi</p>
								<h2 className="type-h3 mt-4">Bối cảnh của bạn là điểm bắt đầu.</h2>
								<p className="mt-3 text-base leading-[1.7] text-ink-secondary">
									Các trường bắt buộc giúp tôi hiểu nhu cầu; thời gian dự kiến có thể để trống.
								</p>
							</div>
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
					</section>
				</div>
			</section>
		</main>
	);
}
