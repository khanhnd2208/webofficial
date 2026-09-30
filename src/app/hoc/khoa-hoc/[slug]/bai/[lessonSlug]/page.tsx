import Link from 'next/link';
import { redirect } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

import { routes } from '@/config/routes';
import * as learningService from '@/features/progress/services/learningService';
import type { LearnerLessonDetail } from '@/features/progress/services/learningService';
import { AppError } from '@/lib/appError';
import { auth } from '@/lib/auth';

import CompleteLessonButton from './CompleteLessonButton';
import LessonBottomBar from './LessonBottomBar';
import LessonChapterRail from './LessonChapterRail';

export const dynamic = 'force-dynamic';

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function LearnerLessonPage({
	params,
}: {
	params: Promise<{ slug: string; lessonSlug: string }>;
}) {
	const session = await auth();
	const { slug, lessonSlug } = await params;
	if (!session?.user?.id) {
		redirect(`${routes.login}?from=${routes.lesson(slug, lessonSlug)}`);
	}

	let lesson: LearnerLessonDetail;
	try {
		lesson = await learningService.getLearnerLesson(session.user.id, slug, lessonSlug);
	} catch (error) {
		if (error instanceof AppError && error.status === 403) {
			return (
				<main className="shell py-16 text-center">
					<h1 className="font-display text-2xl font-medium text-ink">Không có quyền truy cập</h1>
					<p className="mt-3 text-sm text-ink-secondary">
						Bạn chưa được ghi danh vào khóa học này.
					</p>
					<Link
						href={routes.accountLearning}
						className="mt-6 inline-flex text-xs font-semibold uppercase tracking-widest text-vermilion hover:underline"
					>
						← Về khu học của tôi
					</Link>
				</main>
			);
		}
		redirect(routes.course(slug));
	}

	const safeHtml = lesson.contentHtml
		? DOMPurify.sanitize(lesson.contentHtml, { USE_PROFILES: { html: true } })
		: '';

	return (
		<main className="min-h-screen pb-24 lg:pb-16">
			<section className="border-b border-hairline">
				<div className="shell max-w-6xl py-5 sm:py-7">
					<Link
						href={routes.course(slug)}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← {lesson.course.title}
					</Link>
					<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						{lesson.module.title}
					</p>
					<h1 className="mt-2 max-w-3xl font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
						{lesson.title}
					</h1>
				</div>
			</section>

			<div className="shell max-w-6xl py-8 sm:py-10">
				<div className="lg:grid lg:grid-cols-[220px_minmax(0,720px)] lg:gap-12 xl:grid-cols-[240px_minmax(0,720px)]">
					<LessonChapterRail
						moduleTitle={lesson.module.title}
						currentSlug={lesson.slug}
						lessons={lesson.moduleLessons}
					/>

					<article className="min-w-0 max-w-[720px]">
						{lesson.videoUrl ? (
							<div className="mb-10 overflow-hidden rounded-[18px] bg-[#0c0b09]">
								<div className="aspect-video">
									<iframe
										src={lesson.videoUrl}
										title={lesson.title}
										className="h-full w-full"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
								</div>
							</div>
						) : null}

						{safeHtml ? (
							<div
								className="prose prose-lg dark:prose-invert max-w-[68ch] prose-headings:font-display prose-headings:font-medium"
								dangerouslySetInnerHTML={{ __html: safeHtml }}
							/>
						) : !lesson.videoUrl ? (
							<p className="text-sm text-ink-secondary">Bài học chưa có nội dung.</p>
						) : null}

						{lesson.attachments.length > 0 ? (
							<section className="mt-10 border-t border-hairline pt-8">
								<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
									Tệp đính kèm
								</p>
								<ul className="mt-4 space-y-2">
									{lesson.attachments.map((attachment) => (
										<li key={attachment.id}>
											<a
												href={`/api/learning/lessons/${lesson.id}/attachments/${attachment.id}`}
												className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-vermilion hover:underline"
											>
												<span aria-hidden>↓</span>
												<span>{attachment.fileName}</span>
												<span className="text-xs font-normal text-ink-secondary">
													({formatFileSize(attachment.size)})
												</span>
											</a>
										</li>
									))}
								</ul>
							</section>
						) : null}

						<div className="mt-12 hidden border-t border-hairline pt-8 lg:block">
							<CompleteLessonButton lessonId={lesson.id} initiallyCompleted={lesson.completed} />
						</div>

						<nav className="mt-10 hidden flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6 text-sm lg:flex">
							{lesson.prev ? (
								<Link
									href={routes.lesson(slug, lesson.prev.slug)}
									className="text-ink-secondary transition-colors hover:text-ink"
								>
									← {lesson.prev.title}
								</Link>
							) : (
								<span />
							)}
							{lesson.next ? (
								<Link
									href={routes.lesson(slug, lesson.next.slug)}
									className="group inline-flex items-center gap-2 font-semibold text-ink"
								>
									<span className="border-b border-vermilion pb-0.5">{lesson.next.title}</span>
									<span aria-hidden>→</span>
								</Link>
							) : (
								<Link
									href={routes.course(slug)}
									className="font-semibold text-vermilion hover:underline"
								>
									Về khóa học →
								</Link>
							)}
						</nav>
					</article>
				</div>
			</div>

			<LessonBottomBar
				courseSlug={slug}
				lessonId={lesson.id}
				completed={lesson.completed}
				next={lesson.next}
			/>
		</main>
	);
}
