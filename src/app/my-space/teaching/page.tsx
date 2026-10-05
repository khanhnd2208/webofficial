import Link from 'next/link';

import { TeachingActiveClasses } from '@/components/teaching/admin/TeachingActiveClasses';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { TeachingCourseCards } from '@/components/teaching/admin/TeachingCourseCards';
import { routes } from '@/config/routes';
import { listTeachingCourses } from '@/features/teaching';

export const dynamic = 'force-dynamic';

export default async function MySpaceTeachingPage() {
	const courses = await listTeachingCourses();

	return (
		<div className="mx-auto max-w-6xl py-6 sm:py-8">
			<TeachingAppHeader
				backHref={routes.mySpace}
				backLabel="My Space"
				eyebrow="Teaching"
				title="Lớp và môn học"
				description="Mở lớp để điểm danh, chấm CP hoặc chia sẻ link cho sinh viên."
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Link
							href={routes.mySpaceTeachingRecallAnalytics}
							className="teaching-icon-button min-h-11 text-xs font-semibold"
						>
							Thống kê Active Recall
						</Link>
						<Link
							href={routes.admin.home}
							className="teaching-icon-button min-h-11 text-xs font-semibold"
						>
							Quản trị
						</Link>
						<Link href={routes.mySpaceTeachingNew} className="teaching-primary-action">
							Tạo lớp
						</Link>
					</div>
				}
			/>
			<div className="mt-6 space-y-8 sm:mt-8">
				<TeachingActiveClasses courses={courses} />
				<TeachingCourseCards courses={courses} />
			</div>
		</div>
	);
}
