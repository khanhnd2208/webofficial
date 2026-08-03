import type { Metadata } from 'next';
import Link from 'next/link';

import ContactLink from '@/components/contact/ContactLink';
import { MarketingCta, SectionHeading } from '@/components/marketing';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME } from '@/config/site';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: 'Học cùng Khánh',
	description: 'Không gian học có lộ trình — gồm chương trình học, bài viết và trao đổi trực tiếp.',
	robots: { index: false, follow: false },
};

export default async function LearnHubPage() {
	const session = await auth();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-12">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">Học</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">Học cùng Khánh</h1>
					<p className="type-lead mt-4 max-w-xl text-ink-secondary">
						Học theo một lộ trình rõ ràng và biết mình đang tiến bộ ở đâu. Bạn có thể chọn một
						chương trình phù hợp, đọc các bài viết hoặc trao đổi trực tiếp với tôi.
					</p>
					{session?.user ? (
						<div className="mt-8">
							<Link
								href={routes.accountLearning}
								className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-200 hover:bg-ink/90"
							>
								Vào khu học của tôi
							</Link>
						</div>
					) : null}
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-12">
					<SectionHeading title="Khám phá" />
					<ul className="mt-6 divide-y divide-hairline border-y border-hairline">
						<li>
							<Link
								href={routes.learnPrograms}
								className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="text-[1.0625rem] font-semibold text-ink group-hover:text-accent">
										Chương trình học
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Danh mục khóa học công khai — xem mô tả và cấu trúc trước khi ghi danh.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-accent">
									Xem danh mục →
								</span>
							</Link>
						</li>
						<li>
							<Link
								href={routes.posts}
								className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="text-[1.0625rem] font-semibold text-ink group-hover:text-accent">
										Góc viết {EDITORIAL_NAME}
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Bài viết, góc nhìn và tài liệu đọc thêm — không thay thế lộ trình khóa học.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-accent">
									Đọc bài viết →
								</span>
							</Link>
						</li>
						<li>
							<ContactLink
								href={routes.contact}
								contactContext={{ inquiryType: 'course', sourcePage: routes.learn }}
								className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="text-[1.0625rem] font-semibold text-ink group-hover:text-accent">
										Trao đổi và đăng ký
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Nếu bạn quan tâm một khóa học hoặc chưa biết nên bắt đầu từ đâu, hãy gửi tôi vài
										dòng để tôi hiểu nhu cầu trước khi phản hồi.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-accent">
									Gửi lời nhắn →
								</span>
							</ContactLink>
						</li>
					</ul>
					<div className="mt-10">
						<MarketingCta href={`${routes.contact}?type=course`}>Quan tâm khóa học</MarketingCta>
					</div>
				</div>
			</section>
		</main>
	);
}
