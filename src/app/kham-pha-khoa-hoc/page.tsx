import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import CourseArtwork from '@/components/learn/CourseArtwork';
import courseArt from '../../../public/brand/toc/courses-v1.webp';
import SharedArtwork from '@/components/site/SharedArtwork';
import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { listPublishedCoursePreviews } from '@/features/learn/publicCatalog';
import { auth } from '@/lib/auth';
import { LEARN_LEVEL_LABELS } from '@/features/learn/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khám phá khóa học',
	description:
		'Xem trước các khóa học của Duy Khánh, nội dung và hành trình học trước khi bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.discoverCourses) },
	openGraph: {
		title: 'Khám phá khóa học cùng Duy Khánh',
		description: 'Xem chương trình trước, chọn điều bạn muốn học, bắt đầu theo nhịp của bạn.',
		url: absoluteUrl(routes.discoverCourses),
	},
	twitter: {
		card: 'summary_large_image',
		images: [absoluteUrl(`${routes.discoverCourses}/opengraph-image`)],
	},
};

export default async function DiscoverCoursesPage() {
	const [courses, session] = await Promise.all([listPublishedCoursePreviews(), auth()]);

	return (
		<main className="min-h-svh bg-canvas px-6 pb-24 pt-28 text-ink sm:px-10 sm:pt-36">
			<div className="mx-auto max-w-6xl">
				<header className="grid gap-8 border-b border-hairline pb-12 md:grid-cols-[1fr_auto] md:items-end">
					<div>
						<p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">
							Học theo nhịp của bạn
						</p>
						<h1 className="mt-5 max-w-3xl font-display text-display leading-tight tracking-tight sm:text-6xl">
							Một điều mới bắt đầu từ đây.
						</h1>
						<p className="mt-5 max-w-2xl text-body leading-relaxed text-ink-secondary">
							Xem chương trình trước, chọn điều bạn muốn học. Bạn chỉ cần đăng nhập khi bắt đầu.
						</p>
						{session?.user ? (
							<Link
								href="/my-space/courses"
								className="mt-5 inline-flex min-h-11 items-center text-control font-medium text-accent underline underline-offset-4"
							>
								Khóa học của tôi ↗
							</Link>
						) : null}
					</div>
					<SharedArtwork name="courses" className="hidden md:block">
						<Image src={courseArt} alt="" placeholder="blur" className="h-40 w-40 object-contain" />
					</SharedArtwork>
				</header>

				{courses.length ? (
					<section aria-label="Các khóa học" className="mt-10 grid gap-5 lg:grid-cols-2">
						{courses.map((course, index) => (
							<article
								key={course.slug}
								className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas"
							>
								<CourseArtwork slug={course.slug} />
								<div className="flex flex-1 flex-col p-6 sm:p-8">
									<p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">
										{String(index + 1).padStart(2, '0')} · {course.category || 'Khóa học'} ·{' '}
										{LEARN_LEVEL_LABELS[course.level]}
									</p>
									<h2 className="mt-5 font-display text-heading leading-tight tracking-tight">
										{course.title}
									</h2>
									{course.subtitle ? (
										<p className="mt-2 text-lead text-ink-secondary">{course.subtitle}</p>
									) : null}
									{course.description ? (
										<p className="mt-5 text-body leading-relaxed text-ink-secondary">
											{course.description}
										</p>
									) : null}
									<div className="mt-7 border-t border-hairline pt-5">
										<p className="text-control text-ink-secondary">
											{course.lessonCount} bài học
											{course.totalMinutes ? ` · khoảng ${course.totalMinutes} phút` : ''}
										</p>
										{course.lessonTitles.length ? (
											<details className="group mt-4 text-control">
												<summary className="cursor-pointer font-medium text-ink underline-offset-4 hover:underline">
													Xem chương trình
												</summary>
												<ol className="mt-4 space-y-2 pl-5 leading-relaxed text-ink-secondary">
													{course.lessonTitles.map((title, lessonIndex) => (
														<li key={`${lessonIndex}-${title}`} className="list-decimal">
															{title}
														</li>
													))}
												</ol>
											</details>
										) : null}
									</div>
									<Link
										href={routes.learnCourse(course.slug)}
										className="mt-8 inline-flex min-h-12 w-fit items-center justify-center rounded-xl bg-ink px-6 text-control font-medium text-paper transition duration-150 hover:opacity-85 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
									>
										Bắt đầu học{' '}
										<span aria-hidden="true" className="ml-3">
											↗
										</span>
									</Link>
								</div>
							</article>
						))}
					</section>
				) : (
					<section className="mx-auto max-w-xl py-20 text-center">
						<SpotIllustration variant="empty" size={144} className="mx-auto" />
						<h2 className="mt-7 font-display text-title sm:text-heading">
							Các khóa học đang được chuẩn bị
						</h2>
						<p className="mt-3 text-body leading-relaxed text-ink-secondary">
							Khi một khóa học được mở, bạn sẽ xem được nội dung ở đây.
						</p>
						<Link
							href={routes.toc}
							className="mt-8 inline-flex min-h-11 items-center border-b border-accent text-control font-medium text-ink"
						>
							Trở về mục lục ↗
						</Link>
					</section>
				)}
			</div>
		</main>
	);
}
