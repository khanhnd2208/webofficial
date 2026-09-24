import type { Metadata } from 'next';
import Link from 'next/link';

import LearnAppBar from '@/components/learn/LearnAppBar';
import LearnCatalogBrowser from '@/components/learn/LearnCatalogBrowser';
import { LearnCourseCover, LearnIcon, LearnProgressRing } from '@/components/learn/LearnIcon';
import NewCourseButton from '@/components/learn/NewCourseButton';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { courseHue, courseStatus, percentOf } from '@/features/learn/progress';
import { listLearnCourses } from '@/features/learn/service';
import { auth } from '@/lib/auth';

import { learnViewerFrom } from './viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khóa học',
	description: 'Bài đọc và bài kiểm tra tự học, đi theo từng bài một.',
	robots: { index: false },
};

export default async function LearnCatalogPage() {
	const session = await auth();
	const viewer = learnViewerFrom(session);
	const courses = await listLearnCourses(viewer);
	const firstName = session?.user?.name?.trim().split(/\s+/).at(-1);

	const statuses = courses.map((course) => courseStatus(course.completedCount, course.sectionCount));
	const inProgress = statuses.filter((status) => status === 'in-progress').length;
	const completed = statuses.filter((status) => status === 'completed').length;
	const sectionsDone = courses.reduce((sum, course) => sum + course.completedCount, 0);
	const minutesDone = courses.reduce(
		(sum, course) =>
			sum + (course.sectionCount ? Math.round((course.totalMinutes * course.completedCount) / course.sectionCount) : 0),
		0,
	);

	// Most recently touched course that still has something left to do.
	const resume = courses
		.filter((course) => course.lastActivityAt && course.nextSectionId)
		.sort((a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? ''))[0];
	const resumePercent = resume ? percentOf(resume.completedCount, resume.sectionCount) : 0;

	return (
		<>
			<LearnAppBar actions={viewer.isAdmin ? <NewCourseButton /> : null} />
			<main className="ln-page">
				<div className="ln-container">
					<header className="ln-welcome">
						<div>
							<p className="ln-eyebrow">Không gian tự học</p>
							<h1 className="ln-page__title">{firstName ? `Chào ${firstName}, hôm nay học gì?` : 'Khóa học của bạn'}</h1>
							<p className="ln-page__lead">
								Đọc từng mục, dừng lại ở câu hỏi nhanh, rồi làm bài kiểm tra cuối bài. Tiến độ và ghi chú được lưu theo
								tài khoản của bạn.
							</p>
						</div>
						<dl className="ln-stats">
							<div className="ln-stat">
								<dt>Đang học</dt>
								<dd className="tabular-nums">{inProgress}</dd>
							</div>
							<div className="ln-stat">
								<dt>Đã hoàn thành</dt>
								<dd className="tabular-nums">{completed}</dd>
							</div>
							<div className="ln-stat">
								<dt>Mục đã học</dt>
								<dd className="tabular-nums">{sectionsDone}</dd>
							</div>
							<div className="ln-stat">
								<dt>Thời gian học</dt>
								<dd className="tabular-nums">{formatMinutes(minutesDone)}</dd>
							</div>
						</dl>
					</header>

					{resume ? (
						<section className="ln-resume" aria-label="Tiếp tục học">
							<LearnCourseCover hue={courseHue(resume.slug)} title={resume.title} className="ln-resume__cover" />
							<div className="ln-resume__body">
								<p className="ln-eyebrow">Tiếp tục nơi bạn dừng lại</p>
								<h2 className="ln-resume__title">
									<Link href={routes.learnCourse(resume.slug)}>{resume.title}</Link>
								</h2>
								<div className="ln-resume__progress">
									<div className="ln-bar" aria-hidden="true">
										<span style={{ width: `${resumePercent}%` }} />
									</div>
									<span className="tabular-nums">
										{resume.completedCount}/{resume.sectionCount} mục · {resumePercent}%
									</span>
								</div>
							</div>
							<div className="ln-resume__actions">
								<LearnProgressRing percent={resumePercent} size={56} stroke={5} />
								<Link href={routes.learnCourse(resume.slug, resume.nextSectionId)} className="ln-btn ln-btn--primary ln-btn--lg">
									<LearnIcon name="play" size={14} /> Học tiếp
								</Link>
							</div>
						</section>
					) : null}

					{courses.length ? (
						<LearnCatalogBrowser courses={courses} />
					) : (
						<div className="ln-empty ln-empty--page">
							<LearnIcon name="book" size={32} />
							<p className="font-medium">Chưa có khóa học nào</p>
							<p className="text-sm text-ink-secondary">
								{viewer.isAdmin
									? 'Tạo khóa học đầu tiên để bắt đầu soạn.'
									: 'Khi có khóa học được mở, chúng sẽ xuất hiện ở đây.'}
							</p>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
