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
				title="Môn học"
				description="Thêm môn, tạo lớp rỗng và quản lý Active Recall từ menu ⋯."
			/>
			<div className="mt-6 sm:mt-8">
				<TeachingCourseCards courses={courses} />
			</div>
		</div>
	);
}
