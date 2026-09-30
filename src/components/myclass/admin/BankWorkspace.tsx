'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { BLOOM_LABELS } from '@/features/my-class/domain/bloom';
import { ensureListPage } from '@/features/my-class/domain/listQuery';
import type { AdminQuestionTablePage, AdminQuestionTableRow } from '@/features/my-class';
import { routes } from '@/config/routes';
import { myClassApi } from './api';
import {
	StudioAdminTable,
	StudioButton,
	StudioInspector,
	StudioStatus,
	type StudioColumn,
} from './studio';

const TYPE_LABEL: Record<string, string> = {
	MCQ_SINGLE: 'MCQ 1 đáp án',
	MCQ_MULTI: 'MCQ nhiều đáp án',
	FILL_BLANK: 'Điền ô chữ',
};

const columns: StudioColumn<AdminQuestionTableRow>[] = [
	{
		id: 'stem',
		header: 'Câu hỏi',
		cell: (row) => (
			<div className="min-w-0">
				<p className="line-clamp-2 font-semibold leading-5">{row.stem}</p>
				<p className="mc-meta mt-0.5">
					{TYPE_LABEL[row.type] ?? row.type} · Bloom {row.difficulty}
				</p>
			</div>
		),
	},
	{
		id: 'topic',
		header: 'Chủ đề',
		hideBelow: 'md',
		cell: (row) => row.topicPath ?? row.subjectName ?? 'Chưa gán',
	},
	{
		id: 'difficulty',
		header: 'Bloom',
		sortable: true,
		numeric: true,
		hideBelow: 'lg',
		cell: (row) => row.difficulty,
	},
	{
		id: 'usage',
		header: 'Bài kiểm tra',
		sortable: true,
		numeric: true,
		hideBelow: 'md',
		cell: (row) => row.testCount,
	},
	{
		id: 'status',
		header: 'Trạng thái',
		cell: (row) => <StudioStatus status={row.status} />,
	},
];

export default function BankWorkspace({
	data,
	current,
}: {
	data: AdminQuestionTablePage | AdminQuestionTableRow[];
	current: Record<string, string | undefined>;
	subjects: Array<{ id: string; name: string }>;
	topics: Array<{ id: string; path: string }>;
}) {
	const router = useRouter();
	const page = ensureListPage(data);
	const rows = page.items;
	const [selected, setSelected] = useState<string[]>([]);
	const [inspectorId, setInspectorId] = useState<string | null>(rows[0]?.id ?? null);
	const [tags, setTags] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const inspected = rows.find((item) => item.id === inspectorId) ?? null;

	async function bulk(action: 'archive' | 'restore' | 'add-tags') {
		if (!selected.length) return;
		setBusy(true);
		setError(null);
		try {
			await myClassApi('/api/admin/my-class/bank', {
				method: 'POST',
				body: JSON.stringify({
					ids: selected,
					action,
					tags: tags
						.split(/[|,]/)
						.map((item) => item.trim())
						.filter(Boolean),
				}),
			});
			setSelected([]);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thực hiện được');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<div>
				{error ? <p className="mb-3 text-sm text-error">{error}</p> : null}
				<StudioAdminTable
					tableId="bank"
					testId="bank-table"
					caption="Ngân hàng câu hỏi"
					columns={columns}
					rows={rows}
					rowKey={(row) => row.id}
					pathname={routes.admin.myClassBank}
					current={current}
					sortBy={current.sortBy ?? 'updatedAt'}
					sortDir={current.sortDir === 'asc' ? 'asc' : 'desc'}
					page={page.page}
					pageSize={page.pageSize}
					total={page.total}
					totalPages={page.totalPages}
					selectable
					selectedIds={selected}
					selectLabel={(row) => row.stem}
					onSelectionChange={setSelected}
					onRowClick={(row) => setInspectorId(row.id)}
					activeRowId={inspectorId}
					emptyTitle="Không có câu hỏi phù hợp"
					bulkBar={
						<div className="flex flex-wrap items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-3 text-sm">
							<span className="mc-num font-semibold">{selected.length} đã chọn</span>
							<StudioButton
								size="sm"
								variant="secondary"
								disabled={busy}
								onClick={() => void bulk('archive')}
							>
								Lưu trữ
							</StudioButton>
							<StudioButton
								size="sm"
								variant="secondary"
								disabled={busy}
								onClick={() => void bulk('restore')}
							>
								Khôi phục
							</StudioButton>
							<input
								value={tags}
								onChange={(event) => setTags(event.target.value)}
								placeholder="Tags…"
								className="min-h-9 w-36 rounded-[var(--mc-r-sm)] border border-mc-rule px-2 text-sm"
							/>
							<StudioButton
								size="sm"
								variant="secondary"
								disabled={busy || !tags.trim()}
								onClick={() => void bulk('add-tags')}
							>
								Gắn tag
							</StudioButton>
						</div>
					}
					rowActions={(row) => (
						<Link
							href={routes.admin.myClassQuestionEdit(row.id)}
							className="text-xs font-semibold text-ink-secondary hover:text-ink"
						>
							Sửa
						</Link>
					)}
				/>
			</div>
			<StudioInspector title="Chi tiết" className="h-fit">
				<div data-testid="bank-inspector">
					{inspected ? (
						<div className="space-y-2">
							<p className="font-bold leading-6">{inspected.stem}</p>
							<p className="mc-meta">
								{TYPE_LABEL[inspected.type] ?? inspected.type} ·{' '}
								{BLOOM_LABELS[inspected.difficulty] ?? inspected.difficulty}
							</p>
							<p className="mc-meta">
								{inspected.topicPath ?? inspected.subjectName ?? 'Chưa gán môn/chủ đề'}
							</p>
							<p className="mc-meta">{inspected.tags.join(', ') || 'Không có tag'}</p>
							<Link
								href={routes.admin.myClassQuestionEdit(inspected.id)}
								className="inline-flex min-h-9 items-center font-semibold"
							>
								Mở editor
							</Link>
						</div>
					) : (
						<p className="mc-meta">Chọn một câu để xem.</p>
					)}
					{current.q ? <p className="mc-meta mt-4">Đang lọc “{current.q}”.</p> : null}
				</div>
			</StudioInspector>
		</div>
	);
}
