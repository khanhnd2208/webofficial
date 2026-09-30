import { getAdminCourse, listAdminCohortTable } from '@/features/my-class';
import { currentTableParams, parsePublishStatus } from '@/features/my-class/domain/listQuery';
import Link from 'next/link';
import { routes } from '@/config/routes';
import {
	StudioFilterBar,
	StudioFilterSelect,
	StudioPageHeader,
} from '@/components/myclass/admin/studio';
import CohortsTable from '@/components/myclass/admin/tables/CohortsTable';

export const dynamic = 'force-dynamic';

export default async function StudentsPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{
		q?: string;
		status?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const { id } = await params;
	const query = await searchParams;
	const status = parsePublishStatus(query.status);
	const current = currentTableParams({ ...query, courseId: id }, [
		'q',
		'status',
		'courseId',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [course, cohorts] = await Promise.all([
		getAdminCourse(id),
		listAdminCohortTable({
			courseId: id,
			q: query.q,
			status,
			page: query.page ? Number(query.page) : undefined,
			pageSize: query.pageSize ? Number(query.pageSize) : undefined,
			sortBy: query.sortBy,
			sortDir: query.sortDir === 'asc' || query.sortDir === 'desc' ? query.sortDir : undefined,
		}),
	]);
	const pathname = routes.admin.myClassCourseStudents(id);
	return (
		<div>
			<StudioPageHeader
				eyebrow={course.title}
				title="Học viên"
				description="Danh sách nhóm học thuộc khóa này."
				actions={
					<Link
						href={`${routes.admin.myClassCohortNew}?courseId=${id}`}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo Cohort
					</Link>
				}
			/>
			<StudioFilterBar
				action={pathname}
				q={query.q}
				qLabel="Tìm nhóm học"
				qPlaceholder="Tìm tên nhóm hoặc kỳ học…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Mọi trạng thái</option>
					<option value="DRAFT">Bản nháp</option>
					<option value="PUBLISHED">Đang hoạt động</option>
					<option value="ARCHIVED">Đã lưu trữ</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<CohortsTable data={cohorts} pathname={pathname} current={current} />
		</div>
	);
}
