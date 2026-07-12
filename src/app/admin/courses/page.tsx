import Link from 'next/link';

import { courseService } from '@/features/courses';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Khóa học | Admin',
};

const STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Lưu trữ',
};

export default async function AdminCoursesPage() {
	const courses = await courseService.listAdminCourses();

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Giảng dạy</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Khóa học</h1>
				</div>
				<Link
					href={`${routes.admin.courses}/new`}
					className="inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background"
				>
					Tạo khóa học
				</Link>
			</div>

			{courses.length === 0 ? (
				<div className="mt-10 border border-dashed border-border px-6 py-14 text-center">
					<p className="text-sm font-bold text-foreground">Chưa có khóa học</p>
					<p className="mt-2 text-sm text-muted">Tạo khóa đầu tiên để bắt đầu cấu trúc Chương → Bài học.</p>
				</div>
			) : (
				<div className="mt-8 divide-y divide-border border border-border">
					{courses.map((course) => (
						<Link
							key={course.id}
							href={`${routes.admin.courses}/${course.id}`}
							className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-hover"
						>
							<div className="min-w-0">
								<p className="text-sm font-bold text-foreground">{course.title}</p>
								<p className="mt-0.5 text-xs text-muted">
									/{course.slug} · {course.moduleCount} chương · {course.lessonCount} bài · {course.enrollmentCount} học viên
								</p>
							</div>
							<span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
								{STATUS_LABEL[course.status] ?? course.status}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
