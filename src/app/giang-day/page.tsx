import Link from 'next/link';

import TeachingJourney from './TeachingJourney';
import { routes } from '@/config/routes';
import { siteProfile } from '@/config/site';
import { courseService } from '@/features/courses';
import { auth } from '@/lib/auth';

export const metadata = {
	title: 'Giảng dạy',
	description: 'Học có lộ trình. Tiến bộ có dấu vết. — Duy Khánh.',
};

export const revalidate = 60;

export default async function TeachingIntroPage() {
	const [session, teasers] = await Promise.all([auth(), courseService.listPublicCourseTeasers()]);

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-12 sm:py-20 lg:py-24">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Giảng dạy</p>
					<h1 className="mt-4 max-w-3xl font-display type-page-title font-medium text-ink">
						Học có lộ trình.
						<br />
						Tiến bộ có dấu vết.
					</h1>
					<p className="mt-5 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
						Một không gian giảng dạy được dàn dựng như hành trình — không phải danh sách quyền hạn.
					</p>
					<div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
						{siteProfile.contactEmail ? (
							<a
								href={`mailto:${siteProfile.contactEmail}?subject=${encodeURIComponent('Yêu cầu tham gia khóa học')}`}
								className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-200 hover:bg-ink/90"
							>
								Liên hệ / yêu cầu tham gia
							</a>
						) : null}
						{session?.user ? (
							<Link
								href={routes.learn}
								className="inline-flex min-h-11 items-center rounded-[10px] border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-200 hover:border-ink"
							>
								Vào khu học tập
							</Link>
						) : (
							<Link
								href={`${routes.login}?from=${routes.learn}`}
								className="inline-flex min-h-11 items-center rounded-[10px] border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-200 hover:border-ink"
							>
								Đã được mời? Đăng nhập
							</Link>
						)}
					</div>
				</div>
			</section>

			{teasers.length > 0 ? (
				<section className="border-b border-hairline">
					<div className="shell py-14 sm:py-20">
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Khóa học</p>
						<h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">Đang mở theo lời mời</h2>
						<p className="mt-3 max-w-xl text-sm text-ink-secondary">
							Chỉ xem tên và mô tả — nội dung bài học dành cho học viên đã được ghi danh.
						</p>
						<ul className="mt-10 grid gap-8 sm:grid-cols-2">
							{teasers.map((course) => (
								<li key={course.id} className="border-t border-hairline pt-6">
									{course.thumbnailUrl ? (
										<img
											src={course.thumbnailUrl}
											alt=""
											className="mb-4 aspect-[16/9] w-full object-cover"
										/>
									) : null}
									<h3 className="font-display text-2xl font-medium text-ink">{course.title}</h3>
									{course.summary ? (
										<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{course.summary}</p>
									) : null}
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			<TeachingJourney isLoggedIn={!!session?.user} />
		</main>
	);
}
