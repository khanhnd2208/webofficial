import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { courseService } from '@/features/courses';
import { routes } from '@/config/routes';

import EnrollmentsClient from './EnrollmentsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Học viên và ghi danh | Admin',
};

export default async function AdminEnrollmentsPage({
	searchParams,
}: {
	searchParams?: Promise<{ courseId?: string }>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const courses = await courseService.listAdminCourses();
	const selectedCourseId = sp?.courseId && courses.some((c) => c.id === sp.courseId)
		? sp.courseId
		: courses[0]?.id;

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Giảng dạy"
				title="Học viên và ghi danh"
				actions={
					<Link href={routes.admin.courses} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
						← Khóa học Chương–Bài
					</Link>
				}
			/>

			{courses.length === 0 ? (
				<div className="mt-10">
					<AdminEmptyState
						title="Chưa có khóa học"
						description="Tạo khóa học Chương–Bài trước khi ghi danh học viên."
						action={{ href: routes.admin.courses, label: 'Mở khóa học' }}
					/>
				</div>
			) : (
				<EnrollmentsClient courses={courses} initialCourseId={selectedCourseId!} />
			)}
		</div>
	);
}
