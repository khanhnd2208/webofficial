import type { Metadata } from 'next';
import Link from 'next/link';

import LearnAppBar from '@/components/learn/LearnAppBar';
import LearnCatalogBrowser from '@/components/learn/LearnCatalogBrowser';
import LearnCourseAdminList from '@/components/learn/LearnCourseAdminList';
import { LearnIcon } from '@/components/learn/LearnIcon';
import NewCourseButton from '@/components/learn/NewCourseButton';
import { routes } from '@/config/routes';
import { listLearnCoursesForAdmin } from '@/features/learn/adminCatalog';
import { percentOf } from '@/features/learn/progress';
import { listLearnCourses } from '@/features/learn/service';
import { auth } from '@/lib/auth';

import { learnViewerFrom } from './viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khóa học',
	description: 'Bài đọc và bài kiểm tra tự học, đi theo từng bài một.',
	robots: { index: false },
};

export default async function LearnCatalogPage({
	searchParams,
}: {
	searchParams: Promise<{ xem?: string }>;
}) {
	const [session, query] = await Promise.all([auth(), searchParams]);
	const viewer = learnViewerFrom(session);
	const managing = viewer.isAdmin && query.xem === 'quan-ly';
	const courses = managing ? [] : await listLearnCourses(viewer);
	const adminCourses = managing ? await listLearnCoursesForAdmin() : [];
	const firstName = session?.user?.name?.trim().split(/\s+/).at(-1);

	const resume = courses
		.filter((course) => course.lastActivityAt && course.nextSectionId)
		.sort((a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? ''))[0];
	const resumePercent = resume ? percentOf(resume.completedCount, resume.sectionCount) : 0;

	return (
		<>
			<LearnAppBar
				actions={
					viewer.isAdmin ? (
						<>
							<div className="ln-segmented" aria-label="Chế độ">
								<Link href={routes.learnCourses} aria-current={managing ? undefined : 'page'}>
									Học
								</Link>
								<Link
									href={`${routes.learnCourses}?xem=quan-ly`}
									aria-current={managing ? 'page' : undefined}
								>
									Quản lý
								</Link>
							</div>
							<NewCourseButton />
						</>
					) : null
				}
			/>
			<main className="ln-page">
				<div className="ln-container">
					{managing ? (
						<>
							<header className="ln-welcome">
								<p className="ln-eyebrow">Quản lý</p>
								<h1 className="ln-page__title">Khóa học</h1>
							</header>
							<LearnCourseAdminList courses={adminCourses} />
						</>
					) : (
						<>
							<header className="ln-welcome">
								<p className="ln-eyebrow">Không gian tự học</p>
								<h1 className="ln-page__title">
									{firstName ? `Chào ${firstName}, hôm nay học gì?` : 'Khóa học của bạn'}
								</h1>
								<p className="ln-page__lead">
									Đọc từng mục, rồi làm bài kiểm tra. Tiến độ được lưu theo tài khoản của bạn.
								</p>
							</header>

							{resume ? (
								<section className="ln-resume" aria-label="Tiếp tục học">
									<div className="ln-resume__body">
										<p className="ln-eyebrow">Tiếp tục nơi bạn dừng lại</p>
										<h2 className="ln-resume__title">{resume.title}</h2>
										<div className="ln-resume__progress">
											<div className="ln-bar ln-bar--thin" aria-hidden="true">
												<span style={{ width: `${resumePercent}%` }} />
											</div>
											<span className="tabular-nums">
												{resume.completedCount}/{resume.sectionCount} · {resumePercent}%
											</span>
										</div>
									</div>
									<Link
										href={routes.learnCourse(resume.slug, resume.nextSectionId)}
										className="ln-btn ln-btn--primary"
									>
										Học tiếp
									</Link>
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
						</>
					)}
				</div>
			</main>
		</>
	);
}
