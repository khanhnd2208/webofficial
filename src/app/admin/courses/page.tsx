import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { courseService } from '@/features/courses';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Khóa học Chương–Bài | Admin',
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
			<AdminPageHeader
				eyebrow="Giảng dạy"
				title="Khóa học Chương–Bài"
				description="Cấu trúc chương trình theo Chương → Bài học. Khác với My Class (studio học viên)."
				actions={
					<Link
						href={`${routes.admin.courses}/new`}
						className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
					>
						Tạo khóa học
					</Link>
				}
			/>

			<div className="mt-8">
				{courses.length === 0 ? (
					<AdminEmptyState
						title="Chưa có khóa học"
						description="Tạo khóa đầu tiên để bắt đầu cấu trúc Chương → Bài học."
						action={{ href: `${routes.admin.courses}/new`, label: 'Tạo khóa học' }}
					/>
				) : (
					<div className="divide-y divide-border border border-border">
						{courses.map((course) => (
							<Link
								key={course.id}
								href={`${routes.admin.courses}/${course.id}`}
								className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-hover"
							>
								<div className="min-w-0">
									<p className="text-sm font-bold text-foreground">{course.title}</p>
									<p className="mt-0.5 text-xs text-muted">
										/{course.slug} · {course.moduleCount} chương · {course.lessonCount} bài ·{' '}
										{course.enrollmentCount} học viên
									</p>
								</div>
								<span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-muted">
									{STATUS_LABEL[course.status] ?? course.status}
								</span>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
