import Link from 'next/link';
import { redirect } from 'next/navigation';

import ContactLink from '@/components/contact/ContactLink';
import { routes } from '@/config/routes';
import { learningService } from '@/features/progress';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Khu học của tôi',
	description: 'Dashboard học tập — tiếp tục bài học của bạn.',
};

export default async function AccountLearningPage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`${routes.login}?from=${routes.accountLearning}`);
	}

	const courses = await learningService.listLearnerCourses(session.user.id);
	const firstName = session.user.name?.split(' ')[0];
	const continueCourse = courses.find((c) => c.nextLesson) ?? courses[0] ?? null;

	return (
		<main className="min-h-screen pb-20">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-14">
					<Link
						href={routes.account}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← Tài khoản
					</Link>
					<p className="mt-4 text-caption font-semibold uppercase tracking-[0.08em] text-accent">
						Học tập
					</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
						Xin chào{firstName ? `, ${firstName}` : ''}
					</h1>
				</div>
			</section>

			<div className="shell space-y-14 pt-10">
				<section>
					{continueCourse?.nextLesson ? (
						<div className="rounded-lg border border-hairline bg-paper p-6 sm:p-10">
							<p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">
								Tiếp tục học
							</p>
							<h2 className="mt-2.5 font-display type-section font-medium text-ink">
								{continueCourse.title}
							</h2>
							<p className="mt-2 text-sm text-ink-secondary">
								Bài tiếp theo: {continueCourse.nextLesson.title}
							</p>
							<div className="mt-6 flex flex-wrap items-end justify-between gap-4">
								<div className="min-w-[200px] flex-1">
									<div className="flex items-baseline justify-between gap-3 text-xs text-ink-secondary">
										<span>
											{continueCourse.completedLessons}/{continueCourse.totalLessons} bài
										</span>
										<span className="tabular-nums">{continueCourse.progressPercent}%</span>
									</div>
									<div
										className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover"
										role="progressbar"
										aria-valuenow={continueCourse.progressPercent}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={`Tiến độ ${continueCourse.progressPercent} phần trăm`}
									>
										<div
											className="h-full bg-vermilion transition-[width] duration-(--dur-3) ease-(--ease-out)"
											style={{ width: `${continueCourse.progressPercent}%` }}
										/>
									</div>
								</div>
								<Link
									href={routes.lesson(continueCourse.slug, continueCourse.nextLesson.slug)}
									className="inline-flex min-h-11 items-center rounded-sm bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-(--dur-1) ease-(--ease-out) hover:bg-ink/90"
								>
									Mở bài tiếp theo
								</Link>
							</div>
						</div>
					) : courses.length > 0 ? (
						<div className="rounded-lg border border-hairline bg-paper p-8 text-center sm:p-12">
							<p className="font-display type-section font-medium text-ink">
								Bạn đã hoàn thành các khóa hiện có
							</p>
							<p className="mt-2 text-sm text-ink-secondary">
								Khóa mới sẽ xuất hiện khi bạn được ghi danh.
							</p>
						</div>
					) : (
						<div className="rounded-lg border border-hairline bg-paper px-8 py-16 text-center">
							<p className="font-display type-section font-medium text-ink">Chưa có khóa học</p>
							<p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
								Khi được ghi danh, lộ trình học sẽ hiện tại đây. Liên hệ để yêu cầu tham gia hoặc
								xem các khóa học tự học.
							</p>
							<div className="mt-8 flex flex-wrap justify-center gap-3">
								<Link
									href={routes.learnCourses}
									className="inline-flex min-h-11 items-center rounded-sm border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-(--dur-1) ease-(--ease-out) hover:border-ink"
								>
									Xem các khóa học
								</Link>
								<ContactLink
									href={`${routes.contact}?type=course`}
									contactContext={{ inquiryType: 'course', sourcePage: routes.accountLearning }}
									className="inline-flex min-h-11 items-center rounded-sm bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-(--dur-1) ease-(--ease-out) hover:bg-ink/90"
								>
									Gửi yêu cầu ghi danh
								</ContactLink>
							</div>
						</div>
					)}
				</section>

				{courses.length > 0 ? (
					<section>
						<p className="eyebrow">Tất cả khóa học</p>
						<ul className="mt-6 divide-y divide-hairline border-y border-hairline">
							{courses.map((course) => (
								<li key={course.id} className="py-6">
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div className="min-w-0">
											<Link
												href={course.href}
												className="font-display text-xl font-medium text-ink hover:text-vermilion"
											>
												{course.title}
											</Link>
											{course.summary ? (
												<p className="mt-1 line-clamp-2 text-sm text-ink-secondary">
													{course.summary}
												</p>
											) : null}
											<p className="mt-2 text-footnote tabular-nums text-ink-secondary">
												{course.completedLessons}/{course.totalLessons} bài ·{' '}
												{course.progressPercent}%
											</p>
											<div
												className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-surface-hover"
												role="progressbar"
												aria-valuenow={course.progressPercent}
												aria-valuemin={0}
												aria-valuemax={100}
											>
												<div
													className="h-full bg-vermilion"
													style={{ width: `${course.progressPercent}%` }}
												/>
											</div>
										</div>
										{course.nextLesson ? (
											<Link
												href={routes.lesson(course.slug, course.nextLesson.slug)}
												className="shrink-0 text-xs font-semibold uppercase tracking-wider text-vermilion hover:underline"
											>
												Tiếp tục →
											</Link>
										) : (
											<span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vermilion">
												<span className="h-1.5 w-1.5 rounded-full bg-vermilion" aria-hidden />
												Hoàn thành
											</span>
										)}
									</div>
								</li>
							))}
						</ul>
					</section>
				) : null}
			</div>
		</main>
	);
}
