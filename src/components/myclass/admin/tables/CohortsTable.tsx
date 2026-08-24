'use client';

import { StudioAdminTable, StudioStatus, type StudioColumn } from '@/components/myclass/admin/studio';
import { routes } from '@/config/routes';
import type { AdminCohortTablePage, AdminCohortTableRow } from '@/features/my-class';
import { formatDate } from '@/utils/formatDate';

const columns: StudioColumn<AdminCohortTableRow>[] = [
	{
		id: 'name',
		header: 'Nhóm học',
		sortable: true,
		cell: (row) => (
			<div className="min-w-0">
				<p className="truncate font-semibold">{row.name}</p>
				<p className="mc-meta mt-0.5 truncate">
					{row.courseTitle}
					{row.term ? ` · ${row.term}` : ''}
				</p>
			</div>
		),
	},
	{
		id: 'status',
		header: 'Trạng thái',
		sortable: true,
		cell: (row) => (
			<StudioStatus status={row.status}>{row.status === 'PUBLISHED' ? 'Đang hoạt động' : undefined}</StudioStatus>
		),
	},
	{
		id: 'members',
		header: 'Thành viên',
		numeric: true,
		sortable: true,
		cell: (row) => row.memberCount,
	},
	{
		id: 'attempts',
		header: 'Lượt làm',
		numeric: true,
		sortable: true,
		hideBelow: 'md',
		cell: (row) => row.attemptCount,
	},
	{
		id: 'createdAt',
		header: 'Tạo lúc',
		sortable: true,
		hideBelow: 'lg',
		cell: (row) => formatDate(row.createdAt),
	},
	{
		id: 'updatedAt',
		header: 'Cập nhật',
		sortable: true,
		hideBelow: 'sm',
		cell: (row) => formatDate(row.updatedAt),
	},
];

export default function CohortsTable({
	data,
	pathname,
	current,
}: {
	data: AdminCohortTablePage;
	pathname: string;
	current: Record<string, string | undefined>;
}) {
	return (
		<StudioAdminTable
			tableId="cohorts"
			caption="Danh sách nhóm học"
			columns={columns}
			rows={data.items}
			rowKey={(row) => row.id}
			pathname={pathname}
			current={current}
			sortBy={current.sortBy ?? 'createdAt'}
			sortDir={current.sortDir === 'asc' ? 'asc' : 'desc'}
			page={data.page}
			pageSize={data.pageSize}
			total={data.total}
			totalPages={data.totalPages}
			rowHref={(row) => routes.admin.myClassCohortEdit(row.id)}
			emptyTitle="Không có nhóm học phù hợp"
		/>
	);
}
