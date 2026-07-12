import Link from 'next/link';

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
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Giảng dạy</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Học viên và ghi danh</h1>
				</div>
				<Link href={routes.admin.courses} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
					← Khóa học
				</Link>
			</div>

			{courses.length === 0 ? (
				<p className="mt-10 text-sm text-muted">Tạo khóa học trước khi ghi danh học viên.</p>
			) : (
				<EnrollmentsClient courses={courses} initialCourseId={selectedCourseId!} />
			)}
		</div>
	);
}
