import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StudioDataTable } from './StudioDataTable';

const rows = [
	{ id: '1', title: 'HRM', count: 3 },
	{ id: '2', title: 'AI50', count: 1 },
];

describe('StudioDataTable', () => {
	it('renders headers, empty state and selection', () => {
		const onSort = vi.fn();
		const onSelectionChange = vi.fn();
		const { rerender } = 		render(
			<StudioDataTable<{ id: string; title: string; count: number }>
				tableId="test-empty"
				caption="Bảng kiểm thử"
				columns={[
					{ id: 'title', header: 'Tên', cell: (row) => row.title, sortable: true },
					{ id: 'count', header: 'Số', cell: (row) => row.count, numeric: true },
				]}
				rows={[]}
				rowKey={(row) => row.id}
				emptyTitle="Không có khóa học phù hợp"
			/>,
		);
		expect(screen.getByText('Không có khóa học phù hợp')).toBeInTheDocument();

		rerender(
			<StudioDataTable
				tableId="test-rows"
				caption="Bảng kiểm thử"
				columns={[
					{ id: 'title', header: 'Tên', cell: (row) => row.title, sortable: true },
					{ id: 'count', header: 'Số', cell: (row) => row.count, numeric: true },
				]}
				rows={rows}
				rowKey={(row) => row.id}
				sortBy="title"
				sortDir="asc"
				onSort={onSort}
				selectable
				selectedIds={[]}
				selectLabel={(row) => row.title}
				onSelectionChange={onSelectionChange}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: /Tên/ }));
		expect(onSort).toHaveBeenCalledWith('title');
		fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn: HRM' }));
		expect(onSelectionChange).toHaveBeenCalledWith(['1']);
		expect(screen.getByRole('columnheader', { name: /Tên/ })).toHaveAttribute('aria-sort', 'ascending');
	});

	it('toggles column visibility, pagination and keyboard row activation', () => {
		const onRowClick = vi.fn();
		render(
			<StudioDataTable
				tableId="test-columns"
				caption="Bảng kiểm thử"
				columns={[
					{ id: 'title', header: 'Tên', cell: (row) => row.title, sortable: true },
					{ id: 'count', header: 'Số', cell: (row) => row.count, numeric: true },
				]}
				rows={rows}
				rowKey={(row) => row.id}
				onRowClick={onRowClick}
				page={2}
				pageSize={20}
				total={45}
				totalPages={3}
				prevHref="/admin?page=1"
				nextHref="/admin?page=3"
				pageSizeHref={(size) => `/admin?pageSize=${size}`}
				bulkBar={<div>Đã chọn hàng</div>}
				selectedIds={['1']}
				selectable
				selectLabel={(row) => row.title}
				onSelectionChange={vi.fn()}
			/>,
		);

		expect(screen.getByText('Đã chọn hàng')).toBeInTheDocument();
		expect(screen.getByText('45')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Trước' })).toHaveAttribute('href', '/admin?page=1');
		expect(screen.getByRole('link', { name: 'Tiếp' })).toHaveAttribute('href', '/admin?page=3');

		fireEvent.click(screen.getByRole('button', { name: /Cột/ }));
		fireEvent.click(screen.getByLabelText('Số'));
		expect(screen.queryByRole('columnheader', { name: 'Số' })).not.toBeInTheDocument();

		fireEvent.keyDown(screen.getByText('HRM').closest('tr')!, { key: 'Enter' });
		expect(onRowClick).toHaveBeenCalledWith(rows[0]);
	});
});
