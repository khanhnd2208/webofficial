import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingCta, SectionHeading } from '@/components/marketing';
import { routes } from '@/config/routes';
import { EDITORIAL_NAME } from '@/config/site';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: 'Học cùng Khánh',
	description: 'Không gian học có lộ trình — chương trình, journal và trao đổi trực tiếp.',
};

export default async function LearnHubPage() {
	const session = await auth();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">Học</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">Học cùng Khánh</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Học có lộ trình, tiến bộ có dấu vết. Chọn chương trình phù hợp, đọc journal, hoặc trao đổi trực tiếp.
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
				<div className="shell py-14 sm:py-16">
					<SectionHeading title="Khám phá" />
					<ul className="mt-10 divide-y divide-hairline border-y border-hairline">
						<li>
							<Link
								href={routes.learnPrograms}
								className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="font-display text-2xl font-medium text-ink group-hover:text-vermilion">
										Chương trình học
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Danh mục khóa học công khai — xem mô tả và cấu trúc trước khi ghi danh.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-vermilion">
									Xem danh mục →
								</span>
							</Link>
						</li>
						<li>
							<Link
								href={routes.posts}
								className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="font-display text-2xl font-medium text-ink group-hover:text-vermilion">
										{EDITORIAL_NAME} Journal
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Bài viết, góc nhìn và tài liệu đọc thêm — không thay thế lộ trình khóa học.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-vermilion">
									Đọc journal →
								</span>
							</Link>
						</li>
						<li>
							<Link
								href={routes.contact}
								className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span>
									<span className="font-display text-2xl font-medium text-ink group-hover:text-vermilion">
										Trao đổi / ghi danh
									</span>
									<span className="mt-2 block max-w-xl text-sm text-ink-secondary">
										Quan tâm khóa học hoặc cần định hướng — gửi inquiry, không báo giá tức thì.
									</span>
								</span>
								<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-vermilion">
									Liên hệ →
								</span>
							</Link>
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
