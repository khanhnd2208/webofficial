import Link from 'next/link';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import * as learningService from '@/features/progress/services/learningService';
import type { LearnerCourseDetail } from '@/features/progress/services/learningService';
import { AppError } from '@/lib/appError';
import { auth } from '@/lib/auth';

import CourseSpine from './CourseSpine';

export const dynamic = 'force-dynamic';

export default async function LearnerCoursePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const session = await auth();
	const { slug } = await params;
	if (!session?.user?.id) {
		redirect(`${routes.login}?from=${routes.course(slug)}`);
	}

	let course: LearnerCourseDetail;
	try {
		course = await learningService.getLearnerCourse(session.user.id, slug);
	} catch (error) {
		if (error instanceof AppError && error.status === 403) {
			return (
				<main className="shell py-16 text-center">
					<h1 className="font-display text-2xl font-medium text-ink">Không có quyền truy cập</h1>
					<p className="mt-3 text-sm text-ink-secondary">Bạn chưa được ghi danh vào khóa học này.</p>
					<Link
						href={routes.learn}
						className="mt-6 inline-flex text-xs font-semibold uppercase tracking-widest text-vermilion hover:underline"
					>
						← Về khu học tập
					</Link>
				</main>
			);
		}
		redirect(routes.learn);
	}

	return (
		<main className="min-h-screen pb-28">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-12">
					<Link
						href={routes.learn}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← Học tập
					</Link>
					<h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl lg:text-5xl">
						{course.title}
					</h1>
					{course.summary ? (
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">{course.summary}</p>
					) : null}

					<div className="mt-8 flex flex-wrap items-end justify-between gap-6">
						<div className="min-w-[220px] max-w-md flex-1">
							<div className="flex items-baseline justify-between text-xs text-ink-secondary">
								<span>
									{course.completedLessons}/{course.totalLessons} bài
								</span>
								<span className="font-mono">{course.progressPercent}%</span>
							</div>
							<div
								className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover"
								role="progressbar"
								aria-valuenow={course.progressPercent}
								aria-valuemin={0}
								aria-valuemax={100}
							>
								<div className="h-full bg-vermilion" style={{ width: `${course.progressPercent}%` }} />
							</div>
						</div>
						{course.nextLesson ? (
							<Link
								href={routes.lesson(course.slug, course.nextLesson.slug)}
								className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper"
							>
								Tiếp: {course.nextLesson.title}
							</Link>
						) : (
							<span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-vermilion">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-vermilion text-[10px] text-paper">
									✓
								</span>
								Hoàn thành khóa
							</span>
						)}
					</div>
				</div>
			</section>

			<div className="shell py-10">
				{course.description ? (
					<div className="prose prose-sm dark:prose-invert mb-12 max-w-none whitespace-pre-wrap text-ink-secondary">
						{course.description}
					</div>
				) : null}

				<CourseSpine courseSlug={course.slug} modules={course.modules} nextLessonSlug={course.nextLesson?.slug} />
			</div>

			{/* Mobile sticky next CTA */}
			{course.nextLesson ? (
				<div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 p-3 backdrop-blur-md sm:hidden">
					<Link
						href={routes.lesson(course.slug, course.nextLesson.slug)}
						className="flex min-h-11 w-full items-center justify-center rounded-[10px] bg-ink text-xs font-semibold uppercase tracking-wider text-paper"
					>
						Bài tiếp theo
					</Link>
				</div>
			) : null}
		</main>
	);
}
