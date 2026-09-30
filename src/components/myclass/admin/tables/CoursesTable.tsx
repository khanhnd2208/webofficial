'use client';

import CourseListActions from '@/components/myclass/admin/CourseListActions';
import {
	StudioAdminTable,
	StudioStatus,
	type StudioColumn,
} from '@/components/myclass/admin/studio';
import { routes } from '@/config/routes';
import { ensureListPage } from '@/features/my-class/domain/listQuery';
import type { AdminCourseTablePage, AdminCourseTableRow } from '@/features/my-class';
import { formatDate } from '@/utils/formatDate';

const LEVEL_LABEL: Record<string, string> = {
	BEGINNER: 'Cơ bản',
	INTERMEDIATE: 'Trung cấp',
	ADVANCED: 'Nâng cao',
};

const columns: StudioColumn<AdminCourseTableRow>[] = [
	{
		id: 'title',
		header: 'Khóa học',
		sortable: true,
		cell: (row) => (
			<div className="min-w-0">
				<p className="truncate font-semibold">{row.title}</p>
				<p className="mc-meta mt-0.5 truncate">
					/{row.slug}
					{row.tags.length ? ` · ${row.tags.slice(0, 2).join(', ')}` : ''}
					{row.level ? ` · ${LEVEL_LABEL[row.level] ?? row.level}` : ''}
				</p>
				{row.hasUnpublishedDraft ? (
					<p className="mt-0.5 text-xs font-semibold text-warning">Có bản nháp chưa xuất bản</p>
				) : null}
			</div>
		),
	},
	{
		id: 'status',
		header: 'Trạng thái',
		sortable: true,
		cell: (row) => <StudioStatus status={row.status} />,
	},
	{
		id: 'lessons',
		header: 'Bài',
		numeric: true,
		hideBelow: 'md',
		cell: (row) => row.lessonCount,
	},
	{
		id: 'placements',
		header: 'Bài kiểm tra',
		numeric: true,
		hideBelow: 'md',
		cell: (row) => row.placementCount,
	},
	{
		id: 'cohorts',
		header: 'Nhóm',
		numeric: true,
		hideBelow: 'lg',
		cell: (row) => row.cohortCount,
	},
	{
		id: 'members',
		header: 'Học viên',
		numeric: true,
		cell: (row) => row.memberCount,
	},
	{
		id: 'updatedAt',
		header: 'Cập nhật',
		sortable: true,
		hideBelow: 'sm',
		cell: (row) => formatDate(row.updatedAt),
	},
];

export default function CoursesTable({
	data,
	pathname,
	current,
	rowHref,
	performanceLinks = false,
}: {
	data: AdminCourseTablePage | AdminCourseTableRow[];
	pathname: string;
	current: Record<string, string | undefined>;
	rowHref?: (row: AdminCourseTableRow) => string;
	performanceLinks?: boolean;
}) {
	const page = ensureListPage(data);
	return (
		<StudioAdminTable
			tableId="courses"
			caption="Danh sách khóa học"
			columns={columns}
			rows={page.items}
			rowKey={(row) => row.id}
			pathname={pathname}
			current={current}
			sortBy={current.sortBy ?? 'updatedAt'}
			sortDir={current.sortDir === 'asc' ? 'asc' : 'desc'}
			page={page.page}
			pageSize={page.pageSize}
			total={page.total}
			totalPages={page.totalPages}
			rowHref={
				rowHref ??
				((row) =>
					performanceLinks
						? `${routes.admin.myClassPerformance}?courseId=${row.id}`
						: routes.admin.myClassCourseOverview(row.id))
			}
			rowActions={
				performanceLinks || rowHref
					? undefined
					: (row) => <CourseListActions courseId={row.id} courseSlug={row.slug} />
			}
			emptyTitle="Không có khóa học phù hợp"
			emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc."
		/>
	);
}
