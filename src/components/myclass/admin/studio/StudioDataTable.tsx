'use client';

import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
	type RowSelectionState,
	type VisibilityState,
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';

import { McIcon } from '@/components/myclass/ui/McIcon';
import type { SortDir } from '@/features/my-class/domain/listQuery';

import { StudioButton } from './StudioButton';
import { StudioPagination } from './StudioPagination';
import { useColumnVisibility } from './useColumnVisibility';

export type StudioColumnAlign = 'left' | 'right';

export type StudioColumn<T> = {
	id: string;
	header: string;
	cell: (row: T) => ReactNode;
	sortable?: boolean;
	align?: StudioColumnAlign;
	numeric?: boolean;
	hideBelow?: 'sm' | 'md' | 'lg';
	defaultHidden?: boolean;
	enableHiding?: boolean;
};

export type StudioDataTableProps<T> = {
	tableId: string;
	columns: StudioColumn<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	sortBy?: string;
	sortDir?: SortDir;
	onSort?: (field: string) => void;
	page?: number;
	pageSize?: number;
	total?: number;
	totalPages?: number;
	prevHref?: string;
	nextHref?: string;
	pageSizeHref?: (size: number) => string;
	emptyTitle?: string;
	emptyDescription?: string;
	selectable?: boolean;
	selectedIds?: string[];
	selectLabel?: (row: T) => string;
	onSelectionChange?: (ids: string[]) => void;
	onRowClick?: (row: T) => void;
	rowHref?: (row: T) => string | undefined;
	rowActions?: (row: T) => ReactNode;
	bulkBar?: ReactNode;
	activeRowId?: string | null;
	testId?: string;
	caption: string;
};

function hideClass(breakpoint?: 'sm' | 'md' | 'lg') {
	if (breakpoint === 'sm') return 'hidden sm:table-cell';
	if (breakpoint === 'md') return 'hidden md:table-cell';
	if (breakpoint === 'lg') return 'hidden lg:table-cell';
	return '';
}

function toColumnDefs<T>(columns: StudioColumn<T>[]): ColumnDef<T>[] {
	return columns.map((column) => ({
		id: column.id,
		enableHiding: column.enableHiding !== false,
		header: column.header,
		cell: ({ row }) => column.cell(row.original),
		meta: column,
	}));
}

export function StudioDataTable<T>({
	tableId,
	columns,
	rows,
	rowKey,
	sortBy,
	sortDir,
	onSort,
	page,
	pageSize,
	total,
	totalPages,
	prevHref,
	nextHref,
	pageSizeHref,
	emptyTitle = 'Không có dữ liệu phù hợp',
	emptyDescription = 'Thử thay đổi từ khóa hoặc bộ lọc.',
	selectable = false,
	selectedIds,
	selectLabel,
	onSelectionChange,
	onRowClick,
	rowHref,
	rowActions,
	bulkBar,
	activeRowId,
	testId,
	caption,
}: StudioDataTableProps<T>) {
	const initialVisibility = useMemo(
		() =>
			Object.fromEntries(columns.filter((column) => column.defaultHidden).map((column) => [column.id, false])),
		[columns],
	);
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(tableId, initialVisibility);
	const [menuOpen, setMenuOpen] = useState(false);
	const rowSelection = useMemo<RowSelectionState>(
		() => Object.fromEntries((selectedIds ?? []).map((id) => [id, true])),
		[selectedIds],
	);

	const columnDefs = useMemo<ColumnDef<T>[]>(() => {
		const defs = toColumnDefs(columns);
		if (selectable) {
			defs.unshift({
				id: 'select',
				enableHiding: false,
				header: ({ table }) => (
					<input
						type="checkbox"
						checked={table.getIsAllPageRowsSelected()}
						onChange={table.getToggleAllPageRowsSelectedHandler()}
						aria-label="Chọn tất cả"
					/>
				),
				cell: ({ row }) => (
					<input
						type="checkbox"
						checked={row.getIsSelected()}
						onChange={row.getToggleSelectedHandler()}
						aria-label={`Chọn: ${(selectLabel?.(row.original) ?? String(row.id)).slice(0, 40)}`}
						onClick={(event) => event.stopPropagation()}
					/>
				),
			});
		}
		if (rowActions) {
			defs.push({
				id: 'actions',
				enableHiding: false,
				header: () => <span className="sr-only">Thao tác</span>,
				cell: ({ row }) => <div onClick={(event) => event.stopPropagation()}>{rowActions(row.original)}</div>,
			});
		}
		return defs;
	}, [columns, rowActions, selectLabel, selectable]);

	// TanStack Table intentionally exposes a stateful API that React Compiler cannot memoize safely.
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: rows ?? [],
		columns: columnDefs,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => rowKey(row),
		manualSorting: true,
		manualPagination: true,
		enableRowSelection: selectable,
		state: {
			columnVisibility: columnVisibility as VisibilityState,
			rowSelection,
		},
		onColumnVisibilityChange: (updater) => {
			setColumnVisibility((current) =>
				typeof updater === 'function' ? updater(current) : updater,
			);
		},
		onRowSelectionChange: (updater) => {
			const next = typeof updater === 'function' ? updater(rowSelection) : updater;
			onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
		},
	});
	const tableRows = table.getRowModel()?.rows ?? [];

	const hideable = (table.getAllLeafColumns?.() ?? []).filter((column) => column.getCanHide());

	function handleRowKey(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		if (rowHref) {
			const href = rowHref(row);
			if (href) window.location.assign(href);
			return;
		}
		onRowClick?.(row);
	}

	return (
		<div className="mt-4" data-testid={testId}>
			{bulkBar && (selectedIds?.length ?? 0) > 0 ? <div className="mb-3">{bulkBar}</div> : null}
			{hideable.length ? (
				<div className="mb-2 flex justify-end">
					<div className="relative">
						<StudioButton
							size="sm"
							variant="quiet"
							aria-expanded={menuOpen}
							aria-haspopup="true"
							onClick={() => setMenuOpen((open) => !open)}
						>
							<McIcon name="view_column" size={16} />
							Cột
						</StudioButton>
						{menuOpen ? (
							<div className="absolute right-0 z-20 mt-1 min-w-48 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-2">
								{hideable.map((column) => (
									<label key={column.id} className="flex min-h-9 items-center gap-2 px-2 text-sm">
										<input
											type="checkbox"
											checked={column.getIsVisible()}
											onChange={column.getToggleVisibilityHandler()}
										/>
										{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
									</label>
								))}
							</div>
						) : null}
					</div>
				</div>
			) : null}
			<div className="mc-surface overflow-hidden">
				<div className="overflow-x-auto">
					<table className="mc-data-table w-full min-w-[36rem] text-sm">
						<caption className="sr-only">{caption}</caption>
						<thead>
							{table.getHeaderGroups().map((group) => (
								<tr key={group.id}>
									{group.headers.map((header) => {
										const meta = header.column.columnDef.meta as StudioColumn<T> | undefined;
										const sortable = Boolean(meta?.sortable && onSort);
										const active = sortBy === header.column.id;
										const ariaSort = !sortable
											? undefined
											: active
												? sortDir === 'asc'
													? 'ascending'
													: 'descending'
												: 'none';
										return (
											<th
												key={header.id}
												scope="col"
												aria-sort={ariaSort}
												className={`${hideClass(meta?.hideBelow)} ${meta?.align === 'right' || meta?.numeric ? 'text-right' : 'text-left'}`}
											>
												{header.isPlaceholder ? null : sortable ? (
													<button
														type="button"
														onClick={() => onSort?.(header.column.id)}
														className="inline-flex items-center gap-1 font-semibold hover:text-ink"
													>
														{flexRender(header.column.columnDef.header, header.getContext())}
														<McIcon
															name={active ? (sortDir === 'asc' ? 'expand_more' : 'unfold_less') : 'unfold_more'}
															size={16}
															className={active ? 'text-ink' : 'text-ink-tertiary'}
														/>
													</button>
												) : (
													flexRender(header.column.columnDef.header, header.getContext())
												)}
											</th>
										);
									})}
								</tr>
							))}
						</thead>
						<tbody>
							{tableRows.length === 0 ? (
								<tr>
									<td colSpan={Math.max(table.getVisibleLeafColumns().length, 1)} className="px-5 py-10 text-center">
										<p className="font-semibold text-ink">{emptyTitle}</p>
										<p className="mc-meta mt-2">{emptyDescription}</p>
									</td>
								</tr>
							) : (
								tableRows.map((row) => {
									const href = rowHref?.(row.original);
									const active = activeRowId === row.id;
									return (
										<tr
											key={row.id}
											data-active={active ? 'true' : undefined}
											tabIndex={href || onRowClick ? 0 : undefined}
											onClick={() => onRowClick?.(row.original)}
											onKeyDown={(event) => handleRowKey(event, row.original)}
											className={href || onRowClick ? 'cursor-pointer' : undefined}
										>
											{row.getVisibleCells().map((cell) => {
												const meta = cell.column.columnDef.meta as StudioColumn<T> | undefined;
												const content = flexRender(cell.column.columnDef.cell, cell.getContext());
												const isPrimary = cell.column.id !== 'select' && cell.column.id !== 'actions' && !meta?.numeric;
												return (
													<td
														key={cell.id}
														className={`${hideClass(meta?.hideBelow)} ${meta?.numeric || meta?.align === 'right' ? 'mc-num text-right' : ''} ${meta?.numeric ? 'tabular-nums' : ''}`}
													>
														{href && isPrimary && cell.column.id === columns[0]?.id ? (
															<Link href={href} className="font-semibold text-ink hover:text-accent">
																{content}
															</Link>
														) : (
															content
														)}
													</td>
												);
											})}
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
			{page && pageSize && total != null && totalPages && pageSizeHref ? (
				<StudioPagination
					page={page}
					pageSize={pageSize}
					total={total}
					totalPages={totalPages}
					prevHref={prevHref}
					nextHref={nextHref}
					pageSizeHref={pageSizeHref}
				/>
			) : null}
		</div>
	);
}
