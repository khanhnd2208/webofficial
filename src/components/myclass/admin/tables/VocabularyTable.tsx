'use client';

import { StudioAdminTable, StudioStatus, type StudioColumn } from '@/components/myclass/admin/studio';
import { routes } from '@/config/routes';
import { ensureListPage } from '@/features/my-class/domain/listQuery';
import type { AdminVocabTableRow, ListPage } from '@/features/my-class';
import { formatDate } from '@/utils/formatDate';

const columns: StudioColumn<AdminVocabTableRow>[] = [
	{
		id: 'title',
		header: 'Bộ từ',
		sortable: true,
		cell: (row) => (
			<div className="min-w-0">
				<p className="truncate font-semibold">{row.title}</p>
				<p className="mc-meta mt-0.5 truncate">
					{row.courses.length ? row.courses.map((course) => course.title).join(' · ') : 'Chưa gắn vào khóa nào'}
					{row.isCourseOnly ? ' · chỉ khóa học' : ''}
				</p>
			</div>
		),
	},
	{
		id: 'status',
		header: 'Trạng thái',
		cell: (row) => <StudioStatus status={row.isArchived ? 'ARCHIVED' : 'ACTIVE'} />,
	},
	{
		id: 'wordCount',
		header: 'Từ',
		numeric: true,
		cell: (row) => row.wordCount,
	},
	{
		id: 'assignments',
		header: 'Chỗ gắn',
		numeric: true,
		sortable: true,
		hideBelow: 'md',
		cell: (row) => row.assignmentCount,
	},
	{
		id: 'library',
		header: 'Đã lưu',
		numeric: true,
		sortable: true,
		hideBelow: 'lg',
		cell: (row) => row.libraryCount,
	},
	{
		id: 'updatedAt',
		header: 'Cập nhật',
		sortable: true,
		hideBelow: 'sm',
		cell: (row) => formatDate(row.updatedAt),
	},
];

export default function VocabularyTable({
	data,
	pathname,
	current,
}: {
	data: AdminVocabTableRow[] | ListPage<AdminVocabTableRow>;
	pathname: string;
	current: Record<string, string | undefined>;
}) {
	const page = ensureListPage(data);
	return (
		<StudioAdminTable
			tableId="vocabulary"
			caption="Thư viện từ vựng"
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
			rowHref={(row) => routes.admin.myClassVocabularyEdit(row.id)}
			emptyTitle="Không có bộ từ phù hợp"
		/>
	);
}
