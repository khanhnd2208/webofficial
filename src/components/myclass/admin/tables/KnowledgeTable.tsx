'use client';

import { StudioAdminTable, StudioStatus, type StudioColumn } from '@/components/myclass/admin/studio';
import { routes } from '@/config/routes';
import type { AdminKnowledgeTablePage, AdminKnowledgeTableRow } from '@/features/my-class';
import { formatDate } from '@/utils/formatDate';

const columns: StudioColumn<AdminKnowledgeTableRow>[] = [
	{
		id: 'title',
		header: 'Nội dung',
		sortable: true,
		cell: (row) => (
			<div className="min-w-0">
				<p className="truncate font-semibold">{row.title}</p>
				<p className="mc-meta mt-0.5 truncate">
					/{row.slug}
					{row.levelCount ? ` · ${row.levelCount} cấp độ` : ''}
					{row.hasDraft ? ' · có bản nháp' : ''}
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
		id: 'mappings',
		header: 'Vị trí',
		numeric: true,
		sortable: true,
		cell: (row) => row.mappingCount,
	},
	{
		id: 'questions',
		header: 'Câu hỏi',
		numeric: true,
		sortable: true,
		hideBelow: 'md',
		cell: (row) => row.questionCount,
	},
	{
		id: 'updatedAt',
		header: 'Cập nhật',
		sortable: true,
		hideBelow: 'sm',
		cell: (row) => formatDate(row.updatedAt),
	},
];

export default function KnowledgeTable({
	data,
	pathname,
	current,
}: {
	data: AdminKnowledgeTablePage;
	pathname: string;
	current: Record<string, string | undefined>;
}) {
	return (
		<StudioAdminTable
			tableId="knowledge"
			caption="Thư viện nội dung"
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
			rowHref={(row) => routes.admin.myClassKnowledgeEdit(row.id)}
			emptyTitle="Không có nội dung phù hợp"
		/>
	);
}
