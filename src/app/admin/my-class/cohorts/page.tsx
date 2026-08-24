import Link from 'next/link';
import { listAdminCohortTable, listAdminCourseOptions, unwrapItems } from '@/features/my-class';
import { currentTableParams, parsePublishStatus } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import { StudioFilterBar, StudioFilterSelect, StudioPageHeader } from '@/components/myclass/admin/studio';
import CohortsTable from '@/components/myclass/admin/tables/CohortsTable';

export const dynamic = 'force-dynamic';

export default async function AdminCohortsPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		status?: string;
		courseId?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	const status = parsePublishStatus(params.status);
	const current = currentTableParams(params, [
		'q',
		'status',
		'courseId',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [cohorts, courseOptions] = await Promise.all([
		listAdminCohortTable({
			q: params.q,
			status,
			courseId: params.courseId || undefined,
			page: params.page ? Number(params.page) : undefined,
			pageSize: params.pageSize ? Number(params.pageSize) : undefined,
			sortBy: params.sortBy,
			sortDir: params.sortDir === 'asc' || params.sortDir === 'desc' ? params.sortDir : undefined,
		}),
		listAdminCourseOptions(),
	]);
	const courses = unwrapItems(courseOptions);
	const hasFilters = Boolean(params.q || status || params.courseId);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Học viên"
				title="Nhóm học"
				description="Quản lý kỳ học, thành viên và trạng thái tham gia của từng khóa."
				actions={
					<Link
						href={routes.admin.myClassCohortNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo nhóm học
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassCohorts}
				q={params.q}
				qLabel="Tìm nhóm học"
				qPlaceholder="Tìm tên nhóm hoặc kỳ học…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassCohorts : undefined}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Mọi trạng thái</option>
					<option value="DRAFT">Bản nháp</option>
					<option value="PUBLISHED">Đang hoạt động</option>
					<option value="ARCHIVED">Đã lưu trữ</option>
				</StudioFilterSelect>
				<StudioFilterSelect name="courseId" label="Khóa học" value={params.courseId}>
					<option value="">Mọi khóa học</option>
					{courses.map((course) => (
						<option key={course.id} value={course.id}>
							{course.title}
						</option>
					))}
				</StudioFilterSelect>
			</StudioFilterBar>
			<CohortsTable data={cohorts} pathname={routes.admin.myClassCohorts} current={current} />
		</div>
	);
}
