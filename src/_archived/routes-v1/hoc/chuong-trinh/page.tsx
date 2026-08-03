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
				<div className="shell py-10 sm:py-12">
					<Link
						href={routes.learn}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← Học cùng Khánh
					</Link>
					<p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
						Chương trình
					</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
						Chương trình học
					</h1>
					<p className="type-lead mt-4 max-w-xl text-ink-secondary">
						Khóa học đang mở trong danh mục công khai. Nội dung bài học chi tiết dành cho học viên
						đã được ghi danh.
					</p>
				</div>
			</section>

			<section className="bg-paper">
				<div className="shell py-10 sm:py-14">
					{teasers.length === 0 ? (
						<div className="border-t border-hairline py-16 text-center">
							<p className="font-display type-section font-medium text-ink">
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
						<ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
							{teasers.map((course, index) => (
								<li key={course.id} className="group border-t border-hairline pt-5">
									<Link href={routes.course(course.slug)} className="group block">
										{course.thumbnailUrl ? (
											<img
												src={course.thumbnailUrl}
												alt=""
												className="mb-5 aspect-[4/3] w-full object-cover grayscale-[15%] transition duration-500 group-hover:grayscale-0 group-hover:opacity-90"
											/>
										) : null}
										<div className="flex gap-4">
											<span className="font-mono text-[10px] tracking-[0.16em] text-accent">
												{String(index + 1).padStart(2, '0')}
											</span>
											<div>
												<h2 className="font-display text-2xl font-medium leading-tight text-ink transition-colors group-hover:text-accent">
													{course.title}
												</h2>
												{course.summary ? (
													<p className="mt-2 text-sm leading-relaxed text-ink-secondary">
														{course.summary}
													</p>
												) : null}
												<span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-accent">
													Xem giới thiệu →
												</span>
											</div>
										</div>
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
