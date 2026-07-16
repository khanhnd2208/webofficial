import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingCta } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { courseService } from '@/features/courses';

export const metadata: Metadata = {
	title: 'Chương trình học',
	description: 'Danh mục khóa học công khai — xem mô tả và cấu trúc trước khi ghi danh.',
	alternates: { canonical: absoluteUrl(routes.learnPrograms) },
	robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function LearnCatalogPage() {
	let teasers: Awaited<ReturnType<typeof courseService.listPublicCourseTeasers>> = [];
	try {
		teasers = await courseService.listPublicCourseTeasers();
	} catch {
		teasers = [];
	}

	return (
		<main className="min-h-screen pb-20">
			<section className="border-b border-hairline">
				<div className="shell py-12 sm:py-16">
					<Link
						href={routes.learn}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← Học cùng Khánh
					</Link>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
						Chương trình
					</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">
						Chương trình học
					</h1>
					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
						Khóa học đang mở trong danh mục công khai. Nội dung bài học chi tiết dành cho học viên
						đã được ghi danh.
					</p>
				</div>
			</section>

			<section>
				<div className="shell py-12 sm:py-16">
					{teasers.length === 0 ? (
						<div className="rounded-[18px] border border-hairline bg-paper px-8 py-16 text-center">
							<p className="font-display text-2xl font-medium text-ink">
								Chưa có chương trình đang mở
							</p>
							<p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
								Khi có chương trình mới, thông tin sẽ xuất hiện tại đây. Bạn vẫn có thể gửi tôi vài
								dòng nếu muốn tìm một lộ trình học phù hợp.
							</p>
							<div className="mt-8">
								<MarketingCta href={`${routes.contact}?type=course`}>
									Quan tâm khóa học
								</MarketingCta>
							</div>
						</div>
					) : (
						<ul className="grid gap-8 sm:grid-cols-2">
							{teasers.map((course) => (
								<li key={course.id} className="border-t border-hairline pt-6">
									<Link href={routes.course(course.slug)} className="group block">
										{course.thumbnailUrl ? (
											<img
												src={course.thumbnailUrl}
												alt=""
												className="mb-4 aspect-[16/9] w-full object-cover transition duration-200 group-hover:opacity-90"
											/>
										) : null}
										<h2 className="font-display text-2xl font-medium text-ink group-hover:text-vermilion">
											{course.title}
										</h2>
										{course.summary ? (
											<p className="mt-2 text-sm leading-relaxed text-ink-secondary">
												{course.summary}
											</p>
										) : null}
										<span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-vermilion">
											Xem giới thiệu →
										</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
