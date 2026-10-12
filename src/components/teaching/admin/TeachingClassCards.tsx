'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { TeachingSectionHeading } from '../ui/TeachingElements';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioSelect,
} from '@/components/myclass/admin/studio';
import { teachingApi, AdminApiError } from '@/components/teaching/admin/api';
import { TeachingQuickMenu } from '@/components/teaching/admin/TeachingQuickMenu';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import { formatDependencySummary } from '@/features/teaching/domain/adminLifecycle';
import { compareTeachingClasses } from '@/features/teaching/domain/displayOrder';
import type { TeachingClassListItem, TeachingClassStatus } from '@/features/teaching/types';

type StatusFilter = 'all' | 'active' | 'archived';

function shareLabel(row: TeachingClassListItem) {
	return row.attendanceVisible ? 'Đang chia sẻ' : 'Riêng tư';
}

function mutationError(reason: unknown, fallback: string) {
	if (reason instanceof AdminApiError) {
		const summary = reason.details
			? formatDependencySummary(reason.details as Record<string, number>)
			: '';
		return summary ? `${reason.message}: ${summary}` : reason.message;
	}
	return reason instanceof Error ? reason.message : fallback;
}

export function TeachingClassCards({
	classes,
	newClassHref = routes.mySpaceTeachingNew,
	termSuggestions = [],
}: {
	classes: TeachingClassListItem[];
	newClassHref?: string;
	termSuggestions?: string[];
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [editClass, setEditClass] = useState<TeachingClassListItem | null>(null);
	const [draft, setDraft] = useState({
		groupNo: '',
		term: '',
		status: 'ACTIVE' as TeachingClassStatus,
	});

	const filtered = useMemo(() => {
		const value = query
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/đ/g, 'd');
		return classes
			.filter((row) => {
				const matchesQuery =
					!value ||
					`${row.courseCode} ${row.courseName} ${row.groupNo} ${row.classCode ?? ''} ${row.term}`
						.toLowerCase()
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.replace(/đ/g, 'd')
						.includes(value);
				const matchesStatus =
					statusFilter === 'all' ||
					(statusFilter === 'active' ? row.status === 'ACTIVE' : row.status === 'ARCHIVED');
				return matchesQuery && matchesStatus;
			})
			.sort(compareTeachingClasses);
	}, [classes, query, statusFilter]);

	async function run(action: () => Promise<void>) {
		setBusy(true);
		setError('');
		try {
			await action();
			router.refresh();
		} catch (reason) {
			setError(mutationError(reason, 'Không thực hiện được thao tác'));
		} finally {
			setBusy(false);
		}
	}

	function openEdit(row: TeachingClassListItem) {
		setError('');
		setEditClass(row);
		setDraft({
			groupNo: row.classCode ?? row.groupNo,
			term: row.term,
			status: row.status,
		});
	}

	async function saveClass() {
		if (!editClass) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/classes/${editClass.id}`, {
				method: 'PATCH',
				body: JSON.stringify(draft),
			});
			setEditClass(null);
		});
	}

	async function setStatus(row: TeachingClassListItem, status: TeachingClassStatus) {
		const ok = await confirm({
			title: status === 'ARCHIVED' ? 'Lưu trữ lớp' : 'Khôi phục lớp',
			description:
				status === 'ARCHIVED'
					? 'Lớp đã lưu trữ sẽ ẩn khỏi danh sách mặc định.'
					: 'Khôi phục lớp này vào danh sách đang dạy.',
			confirmLabel: status === 'ARCHIVED' ? 'Lưu trữ' : 'Khôi phục',
			tone: status === 'ARCHIVED' ? 'danger' : 'default',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/classes/${row.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status }),
			});
		});
	}

	async function deleteClass(row: TeachingClassListItem) {
		if (!row.canDelete) {
			setError(`Chỉ xóa được lớp trống. Hiện còn ${formatDependencySummary(row.deleteBlockers)}`);
			return;
		}
		const ok = await confirm({
			title: 'Xóa lớp',
			description: `Xóa vĩnh viễn lớp ${row.classCode ?? row.groupNo}? Thao tác này không hoàn tác được.`,
			confirmLabel: 'Xóa vĩnh viễn',
			tone: 'danger',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/classes/${row.id}`, { method: 'DELETE' });
		});
	}

	if (classes.length === 0) {
		return (
			<div
				className="mc-surface rounded-2xl p-8 text-center sm:p-12"
				data-testid="teaching-empty-all"
			>
				<p className="text-base font-semibold text-ink">Chưa có lớp học</p>
				<p className="mc-meta mx-auto mt-2 max-w-md text-sm text-ink-secondary">
					Tạo lớp rỗng rồi thêm sinh viên bằng Excel hoặc nhập thủ công.
				</p>
				<div className="mt-6">
					<Link
						href={newClassHref}
						className="inline-flex min-h-11 items-center justify-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-xs font-semibold text-paper"
					>
						Tạo lớp đầu tiên
					</Link>
				</div>
			</div>
		);
	}

	return (
		<section className="space-y-6" aria-label="Danh sách lớp học">
			<div className="teaching-filter-bar">
				<TeachingSectionHeading
					icon="class"
					title="Các lớp theo kỳ"
					description="Chọn lớp để vào điểm danh và sinh viên."
					count={filtered.length}
				/>
				<div className="flex items-center gap-2 sm:shrink-0">
					<label className="min-w-0 flex-1 sm:w-64 sm:flex-none">
						<span className="sr-only">Tìm lớp</span>
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm lớp hoặc học kỳ…"
							className="mc-input min-h-11 w-full text-xs"
							data-testid="teaching-search-input"
						/>
					</label>
					<label>
						<span className="sr-only">Lọc trạng thái lớp</span>
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
							className="mc-input min-h-11 text-xs font-medium"
							data-testid="teaching-status-filter"
						>
							<option value="active">Đang dạy</option>
							<option value="archived">Đã lưu trữ</option>
							<option value="all">Tất cả lớp</option>
						</select>
					</label>
				</div>
			</div>

			{error ? (
				<p role="alert" className="text-sm font-semibold text-error">
					{error}
				</p>
			) : null}

			{filtered.length === 0 ? (
				<div
					className="mc-surface rounded-2xl p-8 text-center"
					data-testid="teaching-empty-filtered"
				>
					<p className="text-sm font-semibold text-ink">Không có kết quả phù hợp</p>
					<button
						type="button"
						onClick={() => {
							setQuery('');
							setStatusFilter('active');
						}}
						className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--mc-r-sm)] border border-border px-3 text-xs font-medium"
					>
						Đặt lại bộ lọc
					</button>
				</div>
			) : (
				<div
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
					data-testid="teaching-class-cards-grid"
				>
					{filtered.map((row) => {
						const warnings = row.atRiskCount + row.bannedCount;
						const isArchived = row.status === 'ARCHIVED';
						const classCode = row.classCode ?? row.groupNo;
						return (
							<article
								key={row.id}
								className={`teaching-class-card relative flex h-full flex-col rounded-2xl border bg-surface ${
									isArchived ? 'border-border/60 opacity-80' : 'border-border/80'
								}`}
							>
								<Link
									href={routes.mySpaceTeachingClassTab(row.id, 'attendance')}
									aria-label={`Mở lớp ${classCode}`}
									className="flex flex-1 flex-col p-5 pr-14 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
									data-testid={`teaching-class-card-${row.id}`}
								>
									<p className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
										Lớp {classCode}
									</p>
									<p className="mt-2 text-sm font-medium text-ink">{row.term}</p>
									<div className="mt-3 flex flex-wrap items-center gap-1.5">
										<span
											className="teaching-status text-xs"
											data-tone={isArchived ? 'muted' : 'ok'}
										>
											{isArchived ? 'Đã lưu trữ' : 'Đang dạy'}
										</span>
										<span
											className={`teaching-status text-xs ${row.attendanceVisible ? 'teaching-status-ok' : ''}`}
										>
											{shareLabel(row)}
										</span>
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-ink-secondary">
										<div>
											<span className="font-semibold text-ink">{row.studentCount}</span> sinh viên
										</div>
										{warnings > 0 ? (
											<span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
												{warnings} cảnh báo
											</span>
										) : null}
									</div>
								</Link>
								<div className="absolute right-2 top-2">
									<TeachingQuickMenu
										label={`Thao tác lớp ${classCode}`}
										disabled={busy}
										items={[
											{ id: 'edit', label: 'Sửa', onSelect: () => openEdit(row) },
											isArchived
												? {
														id: 'restore',
														label: 'Khôi phục',
														onSelect: () => void setStatus(row, 'ACTIVE'),
													}
												: {
														id: 'archive',
														label: 'Lưu trữ',
														onSelect: () => void setStatus(row, 'ARCHIVED'),
													},
											{
												id: 'delete',
												label: 'Xóa vĩnh viễn',
												tone: 'danger',
												disabled: !row.canDelete,
												onSelect: () => void deleteClass(row),
											},
										]}
									/>
								</div>
							</article>
						);
					})}
				</div>
			)}

			<Dialog
				open={Boolean(editClass)}
				onClose={() => {
					if (!busy) setEditClass(null);
				}}
				title="Sửa lớp"
				description="Mã lớp được chuẩn hóa chữ hoa. Học kỳ giữ nguyên cách viết hiện có."
			>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void saveClass();
					}}
				>
					{error ? (
						<p
							role="alert"
							tabIndex={-1}
							ref={(node) => {
								node?.focus();
							}}
							className="rounded-[var(--mc-r-sm)] bg-error/10 px-3 py-2 text-sm font-semibold text-error"
						>
							{error}
						</p>
					) : null}
					<StudioField label="Mã lớp">
						<StudioInput
							required
							value={draft.groupNo}
							onChange={(event) =>
								setDraft((current) => ({ ...current, groupNo: event.target.value }))
							}
							autoFocus
						/>
					</StudioField>
					<StudioField label="Học kỳ">
						<StudioInput
							required
							list="teaching-term-suggestions"
							value={draft.term}
							onChange={(event) =>
								setDraft((current) => ({ ...current, term: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Trạng thái">
						<StudioSelect
							value={draft.status}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									status: event.target.value as TeachingClassStatus,
								}))
							}
						>
							<option value="ACTIVE">Đang dạy</option>
							<option value="ARCHIVED">Đã lưu trữ</option>
						</StudioSelect>
					</StudioField>
					<datalist id="teaching-term-suggestions">
						{termSuggestions.map((term) => (
							<option key={term} value={term} />
						))}
					</datalist>
					<div className="flex justify-end gap-2">
						<StudioButton variant="quiet" onClick={() => setEditClass(null)} disabled={busy}>
							Huỷ
						</StudioButton>
						<StudioButton
							type="submit"
							disabled={busy || !draft.groupNo.trim() || !draft.term.trim()}
						>
							{busy ? 'Đang lưu…' : 'Lưu'}
						</StudioButton>
					</div>
				</form>
			</Dialog>
			{dialog}
		</section>
	);
}
