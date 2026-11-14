import type { Metadata } from 'next';
import Link from 'next/link';

import CourseResume, { pickResumeCourse } from '@/components/learn/CourseResume';
import DiscoverCourseList from '@/components/learn/DiscoverCourseList';
import LearnCatalogBrowser from '@/components/learn/LearnCatalogBrowser';
import LearnCourseAdminList from '@/components/learn/LearnCourseAdminList';
import NewCourseButton from '@/components/learn/NewCourseButton';
import LearningHubHeader from '@/components/site/LearningHubHeader';
import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { listLearnCoursesForAdmin } from '@/features/learn/adminCatalog';
import { listPublishedCoursePreviews } from '@/features/learn/publicCatalog';
import { listLearnCourses } from '@/features/learn/service';
import { auth } from '@/lib/auth';

import { learnViewerFrom } from '../my-space/courses/viewer';

import '../learn.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khóa học',
	description:
		'Xem trước các khóa học của Duy Khánh, nội dung và hành trình học trước khi bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.learnCourses) },
	openGraph: {
		title: 'Khám phá khóa học cùng Duy Khánh',
		description: 'Xem chương trình trước, chọn điều bạn muốn học, bắt đầu theo nhịp của bạn.',
		url: absoluteUrl(routes.learnCourses),
	},
	twitter: {
		card: 'summary_large_image',
		images: [absoluteUrl(`${routes.learnCourses}/opengraph-image`)],
	},
};

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<main className="min-h-svh bg-canvas px-6 pb-16 pt-28 text-ink sm:px-10 sm:pt-36">
			<div className="mx-auto max-w-4xl">{children}</div>
		</main>
	);
}

/**
 * Học tập, tab Khóa học: the one course address. Guests browse previews; a signed-in learner sees
 * the same page with progress; an admin can switch to the management list.
 */
export default async function CoursesPage({
	searchParams,
}: {
	searchParams: Promise<{ xem?: string }>;
}) {
	const [session, query] = await Promise.all([auth(), searchParams]);

	if (!session?.user) {
		const previews = await listPublishedCoursePreviews();
		return (
			<Shell>
				<LearningHubHeader
					active="courses"
					title="Một điều mới bắt đầu từ đây."
					lead="Xem chương trình trước, chọn điều bạn muốn học. Bạn chỉ cần đăng nhập khi bắt đầu."
				/>
				<DiscoverCourseList courses={previews} />
			</Shell>
		);
	}

	const viewer = learnViewerFrom(session);
	const managing = viewer.isAdmin && query.xem === 'quan-ly';
	const firstName = session.user.name?.trim().split(/\s+/).at(-1);
	const modeLink = (current: boolean) =>
		`inline-flex min-h-9 items-center rounded-full px-3 text-footnote font-medium transition-colors ${
			current ? 'bg-canvas text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
		}`;
	const adminActions = viewer.isAdmin ? (
		<div className="ln-kit flex flex-wrap items-center gap-2">
			<nav aria-label="Chế độ" className="flex rounded-full border border-hairline bg-paper p-0.5">
				<Link
					href={routes.learnCourses}
					aria-current={managing ? undefined : 'page'}
					className={modeLink(!managing)}
				>
					Học
				</Link>
				<Link
					href={routes.myCoursesManage}
					aria-current={managing ? 'page' : undefined}
					className={modeLink(managing)}
				>
					Quản lý
				</Link>
			</nav>
			<NewCourseButton />
		</div>
	) : null;

	if (managing) {
		const adminCourses = await listLearnCoursesForAdmin();
		return (
			<Shell>
				<LearningHubHeader active="courses" title="Quản lý khóa học" actions={adminActions} />
				<div className="ln-kit mt-6">
					<LearnCourseAdminList courses={adminCourses} />
				</div>
			</Shell>
		);
	}

	const courses = await listLearnCourses(viewer);
	const resume = pickResumeCourse(courses);
	return (
		<Shell>
			<LearningHubHeader
				active="courses"
				title={firstName ? `Chào ${firstName}, hôm nay học gì?` : 'Khóa học của bạn'}
				lead="Tiến độ được lưu theo tài khoản của bạn."
				actions={adminActions}
			/>
			{resume ? <CourseResume course={resume} /> : null}
			{courses.length ? (
				<div className="ln-kit">
					<LearnCatalogBrowser courses={courses} />
				</div>
			) : (
				<div className="mx-auto max-w-xl py-16 text-center">
					<SpotIllustration variant="empty" size={112} className="mx-auto" />
					<p className="mt-6 font-medium">Chưa có khóa học nào</p>
					<p className="mt-2 text-sm text-ink-secondary">
						{viewer.isAdmin
							? 'Tạo khóa học đầu tiên để bắt đầu soạn.'
							: 'Khi có khóa học được mở, chúng sẽ xuất hiện ở đây.'}
					</p>
				</div>
			)}
		</Shell>
	);
}
