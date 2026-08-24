'use client';

import { StudioAdminTable, StudioStatus, type StudioColumn } from '@/components/myclass/admin/studio';
import { routes } from '@/config/routes';
import type { AdminTestTablePage, AdminTestTableRow } from '@/features/my-class';
import { formatDate } from '@/utils/formatDate';

const columns: StudioColumn<AdminTestTableRow>[] = [
	{
		id: 'title',
		header: 'Bài kiểm tra',
		sortable: true,
		cell: (row) => (
			<div className="min-w-0">
				<p className="truncate font-semibold">{row.title}</p>
				<p className="mc-meta mt-0.5 truncate">
					{row.courseTitles.length ? row.courseTitles.join(' · ') : 'Chưa gắn vào khóa nào'}
				</p>
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
		id: 'subject',
		header: 'Môn',
		hideBelow: 'md',
		cell: (row) => row.subjectName ?? 'Chưa gán môn',
	},
	{
		id: 'questions',
		header: 'Câu',
		numeric: true,
		sortable: true,
		cell: (row) => row.questionCount,
	},
	{
		id: 'placements',
		header: 'Chỗ gắn',
		numeric: true,
		sortable: true,
		hideBelow: 'md',
		cell: (row) => row.placementCount,
	},
	{
		id: 'attempts',
		header: 'Lượt làm',
		numeric: true,
		sortable: true,
		hideBelow: 'lg',
		cell: (row) => row.attemptCount,
	},
	{
		id: 'updatedAt',
		header: 'Cập nhật',
		sortable: true,
		hideBelow: 'sm',
		cell: (row) => formatDate(row.updatedAt),
	},
];

export default function TestsTable({
	data,
	pathname,
	current,
}: {
	data: AdminTestTablePage;
	pathname: string;
	current: Record<string, string | undefined>;
}) {
	return (
		<StudioAdminTable
			tableId="tests"
			caption="Thư viện bài kiểm tra"
			columns={columns}
			rows={data.items}
			rowKey={(row) => row.id}
			pathname={pathname}
			current={current}
			sortBy={current.sortBy ?? 'updatedAt'}
			sortDir={current.sortDir === 'asc' ? 'asc' : 'desc'}
			page={data.page}
			pageSize={data.pageSize}
			total={data.total}
			totalPages={data.totalPages}
			rowHref={(row) => routes.admin.myClassTestEdit(row.id)}
			emptyTitle="Không có bài kiểm tra phù hợp"
		/>
	);
}
