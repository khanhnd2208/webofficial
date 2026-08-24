import Link from 'next/link';
import { listAdminCourses } from '@/features/my-class';
import { currentTableParams, parseCourseLevel, parsePublishStatus } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import { StudioFilterBar, StudioFilterSelect, StudioPageHeader } from '@/components/myclass/admin/studio';
import CoursesTable from '@/components/myclass/admin/tables/CoursesTable';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage({
	searchParams,
}: {
	searchParams?: Promise<{
		q?: string;
		status?: string;
		level?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = searchParams ? await searchParams : {};
	const status = parsePublishStatus(params.status);
	const level = parseCourseLevel(params.level);
	const current = currentTableParams(params, ['q', 'status', 'level', 'page', 'pageSize', 'sortBy', 'sortDir']);
	const courses = await listAdminCourses({
		q: params.q,
		status,
		level,
		page: params.page ? Number(params.page) : undefined,
		pageSize: params.pageSize ? Number(params.pageSize) : undefined,
		sortBy: params.sortBy,
		sortDir: params.sortDir === 'asc' || params.sortDir === 'desc' ? params.sortDir : undefined,
	});
	const hasFilters = Boolean(params.q || status || level);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Studio học tập"
				title="Khóa học"
				description="Lọc, mở và xuất bản các khóa học My Class."
				actions={
					<Link
						href={routes.admin.myClassCourseNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo khóa học
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassCourses}
				q={params.q}
				qLabel="Tìm khóa học"
				qPlaceholder="Tìm tên, đường dẫn hoặc chủ đề…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassCourses : undefined}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Mọi trạng thái</option>
					<option value="DRAFT">Bản nháp</option>
					<option value="PUBLISHED">Đã xuất bản</option>
					<option value="ARCHIVED">Đã lưu trữ</option>
				</StudioFilterSelect>
				<StudioFilterSelect name="level" label="Cấp độ" value={level}>
					<option value="">Mọi cấp độ</option>
					<option value="BEGINNER">Cơ bản</option>
					<option value="INTERMEDIATE">Trung cấp</option>
					<option value="ADVANCED">Nâng cao</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<CoursesTable data={courses} pathname={routes.admin.myClassCourses} current={current} />
		</div>
	);
}
