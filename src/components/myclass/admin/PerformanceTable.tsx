'use client';

import { useMemo } from 'react';

import { comparePerformanceRows } from '@/features/my-class/analytics/sort';
import type { SortDir } from '@/features/my-class/domain/listQuery';
import { StudioAdminTable, StudioDataTable, type StudioColumn } from './studio';

export type PerformanceRow = {
	id?: string;
	title: string;
	accuracy: number | null;
	evidence: number;
	href?: string;
	subtitle?: string;
};

const columns: StudioColumn<PerformanceRow>[] = [
	{
		id: 'title',
		header: 'Tên',
		sortable: true,
		cell: (row) => (
			<div>
				<p className="font-semibold">{row.title}</p>
				{row.subtitle ? <p className="mc-meta mt-0.5">{row.subtitle}</p> : null}
			</div>
		),
	},
	{
		id: 'evidence',
		header: 'Bằng chứng',
		sortable: true,
		numeric: true,
		cell: (row) => row.evidence,
	},
	{
		id: 'accuracy',
		header: 'Độ chính xác',
		sortable: true,
		numeric: true,
		cell: (row) => (row.accuracy === null ? '—' : `${row.accuracy}%`),
	},
];

export default function PerformanceTable({
	rows,
	pathname,
	current,
	page,
	pageSize,
	total,
	totalPages,
}: {
	rows: PerformanceRow[];
	pathname?: string;
	current?: Record<string, string | undefined>;
	page?: number;
	pageSize?: number;
	total?: number;
	totalPages?: number;
}) {
	const sorted = useMemo(() => [...rows].sort(comparePerformanceRows), [rows]);
	const keyed = (pathname ? rows : sorted).map((row, index) => ({
		...row,
		id: row.id ?? `${row.title}-${index}`,
	}));

	if (pathname && current && page && pageSize && total != null && totalPages) {
		return (
			<StudioAdminTable
				tableId="performance"
				testId="performance-table"
				caption="Bảng kết quả"
				columns={columns}
				rows={keyed}
				rowKey={(row) => row.id!}
				pathname={pathname}
				current={current}
				sortBy={current.sortBy ?? 'accuracy'}
				sortDir={(current.sortDir as SortDir) || 'desc'}
				page={page}
				pageSize={pageSize}
				total={total}
				totalPages={totalPages}
				rowHref={(row) => row.href}
				emptyTitle="Chưa có dữ liệu."
			/>
		);
	}

	return (
		<StudioDataTable
			tableId="performance-local"
			testId="performance-table"
			caption="Bảng kết quả"
			columns={columns}
			rows={keyed}
			rowKey={(row) => row.id!}
			rowHref={(row) => row.href}
			emptyTitle="Chưa có dữ liệu."
		/>
	);
}
