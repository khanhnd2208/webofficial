import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingCta, SectionHeading } from '@/components/marketing';
import { getPublishedServices } from '@/content';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Đồng hành cùng Khánh',
	description:
		'Tổng quan mentoring, cố vấn doanh nghiệp, đào tạo/workshop và AI ứng dụng — chọn theo nhu cầu, không theo bảng giá.',
	alternates: { canonical: absoluteUrl(routes.accompany) },
};

export default function AccompanyHubPage() {
	const services = getPublishedServices();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">Đồng hành</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">Đồng hành cùng Khánh</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Router theo nhu cầu — cá nhân hoặc tổ chức. Chi phí chỉ được đề xuất sau khi làm rõ đầu ra và phạm vi.
					</p>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<SectionHeading title="Bạn cần gì?" />
					<ul className="mt-10 divide-y divide-hairline border-y border-hairline">
						{services.map((service) => (
							<li key={service.slug}>
								<Link
									href={`${routes.accompany}/${service.slug}`}
									className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between"
								>
									<span>
										<span className="font-display text-2xl font-medium text-ink group-hover:text-vermilion">
											{service.title}
										</span>
										<span className="mt-2 block max-w-xl text-sm text-ink-secondary">{service.summary}</span>
									</span>
									<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-vermilion">
										Xem chi tiết →
									</span>
								</Link>
							</li>
						))}
					</ul>
					<div className="mt-10">
						<MarketingCta href={`${routes.contact}?type=unsure`}>Chưa chắc — trao đổi với Khánh</MarketingCta>
					</div>
				</div>
			</section>
		</main>
	);
}
