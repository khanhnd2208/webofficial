import type { Metadata } from 'next';
import Link from 'next/link';

import NewCourseButton from '@/components/learn/NewCourseButton';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { listLearnCourses } from '@/features/learn/service';
import { LEARN_LEVEL_LABELS } from '@/features/learn/types';
import { auth } from '@/lib/auth';

import { learnViewerFrom } from './viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khóa học',
	description: 'Bài đọc và bài kiểm tra tự học, đi theo từng bài một.',
	robots: { index: false },
};

export default async function LearnCatalogPage() {
	const viewer = learnViewerFrom(await auth());
	const courses = await listLearnCourses(viewer);

	return (
		<main className="px-6 pt-24 pb-24 sm:px-8 sm:pt-28">
			<div className="shell max-w-5xl">
				<Link href={routes.mySpace} className="ln-backlink">
					← My Space
				</Link>
				<header className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t border-hairline pt-5">
					<div>
						<h1 className="font-display text-[clamp(2.1rem,5vw,4.5rem)] font-medium tracking-tight text-ink">
							Khóa học
						</h1>
						<p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
							Đọc từng mục, dừng lại ở câu hỏi nhanh, rồi làm bài kiểm tra cuối bài. Tiến độ và ghi
							chú được lưu theo tài khoản của bạn.
						</p>
					</div>
					{viewer.isAdmin ? <NewCourseButton /> : null}
				</header>

				<section className="mt-10 border-t border-hairline" aria-label="Danh sách khóa học">
					{courses.length ? (
						courses.map((course) => {
							const percent = course.sectionCount
								? Math.round((course.completedCount / course.sectionCount) * 100)
								: 0;
							return (
								<Link key={course.id} href={routes.learnCourse(course.slug)} className="ln-course-row group">
									<div className="min-w-0 flex-1">
										<p className="text-sm text-ink-secondary">
											{[course.category, LEARN_LEVEL_LABELS[course.level]].filter(Boolean).join(' · ')}
											{course.status !== 'PUBLISHED' ? <span className="ln-draft-tag">Bản nháp</span> : null}
										</p>
										<h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink transition-colors group-hover:text-bronze">
											{course.title}
										</h2>
										{course.subtitle ? (
											<p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
												{course.subtitle}
											</p>
										) : null}
									</div>
									<div className="ln-course-row__meta">
										<span className="tabular-nums">
											{course.lessonCount} bài · {course.sectionCount} mục
										</span>
										<span className="tabular-nums">{formatMinutes(course.totalMinutes)}</span>
										{course.completedCount ? (
											<span className="ln-meter" aria-label={`Đã học ${percent}%`}>
												<span style={{ width: `${percent}%` }} />
											</span>
										) : null}
									</div>
								</Link>
							);
						})
					) : (
						<p className="py-10 text-ink-secondary">
							{viewer.isAdmin
								? 'Chưa có khóa học nào. Tạo khóa học đầu tiên để bắt đầu soạn.'
								: 'Chưa có khóa học nào được mở.'}
						</p>
					)}
				</section>
			</div>
		</main>
	);
}
