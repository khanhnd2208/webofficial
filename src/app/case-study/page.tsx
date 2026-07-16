import type { Metadata } from 'next';
import Link from 'next/link';

import { getPublishedCaseStudies } from '@/content';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Câu chuyện hợp tác',
	description:
		'Những dự án và kết quả đã được đối tác cho phép chia sẻ công khai hoặc dưới hình thức ẩn danh.',
	alternates: { canonical: absoluteUrl(routes.caseStudies) },
};

export default function CaseStudyIndexPage() {
	const cases = getPublishedCaseStudies();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
						Kinh nghiệm thực tế
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">
						Câu chuyện hợp tác
					</h1>
					<p className="mt-5 max-w-2xl text-base text-ink-secondary">
						Tôi chỉ chia sẻ những câu chuyện đã được đối tác đồng ý, hoặc đã được ẩn danh để bảo vệ
						thông tin nhạy cảm.
					</p>
				</div>
			</section>
			<section>
				<div className="shell py-12">
					{cases.length === 0 ? (
						<p className="text-sm text-ink-secondary">
							Chưa có câu chuyện nào được phép chia sẻ.{' '}
							<Link href={routes.accompany} className="text-vermilion underline">
								Xem đồng hành
							</Link>
						</p>
					) : (
						<ul className="space-y-8">
							{cases.map((item) => (
								<li key={item.slug} className="border-t border-hairline pt-5">
									<h2 className="font-display text-xl font-medium text-ink">
										<Link
											href={`${routes.caseStudies}/${item.slug}`}
											className="hover:text-vermilion"
										>
											{item.title}
										</Link>
									</h2>
									<p className="mt-2 text-sm text-ink-secondary">{item.context}</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
