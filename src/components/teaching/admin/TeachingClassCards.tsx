'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { routes } from '@/config/routes';
import type { TeachingClassListItem } from '@/features/teaching/types';

type StatusFilter = 'all' | 'active' | 'archived';

function shareLabel(row: TeachingClassListItem) {
	return row.attendanceVisible ? 'Đang chia sẻ' : 'Riêng tư';
}

function shareTone(row: TeachingClassListItem) {
	return row.attendanceVisible ? 'teaching-status teaching-status-ok' : 'teaching-status';
}

export function TeachingClassCards({ classes }: { classes: TeachingClassListItem[] }) {
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

	const filtered = useMemo(() => {
		const value = query.trim().toLowerCase();
		return classes.filter((row) => {
			const matchesQuery =
				!value ||
				`${row.courseCode} ${row.courseName} ${row.groupNo} ${row.classCode ?? ''} ${row.term}`
					.toLowerCase()
					.includes(value);
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' ? row.status === 'ACTIVE' : row.status === 'ARCHIVED');
			return matchesQuery && matchesStatus;
		});
	}, [classes, query, statusFilter]);

	if (classes.length === 0) {
		return (
			<div
				className="mc-surface rounded-2xl p-8 sm:p-12 text-center"
				data-testid="teaching-empty-all"
			>
				<p className="text-base font-semibold text-ink">Chưa có lớp học</p>
				<p className="mc-meta mt-2 max-w-md mx-auto text-sm text-ink-secondary">
					Tạo lớp mới rồi thêm học viên bằng Excel hoặc nhập thủ công để bắt đầu quản lý.
				</p>
				<div className="mt-6">
					<Link
						href={routes.mySpaceTeachingNew}
						className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-xs font-semibold text-paper transition-colors hover:bg-inverse-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						Tạo lớp đầu tiên
					</Link>
				</div>
			</div>
		);
	}

	return (
		<section className="space-y-6" aria-label="Danh sách lớp học">
			<div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h2 className="text-base font-semibold text-ink">Các lớp đang quản lý</h2>
					<p className="mc-meta mt-0.5 text-xs text-ink-secondary">
						Chọn lớp để vào bảng điểm danh, điểm CP và trao đổi nhóm.
					</p>
				</div>
				<div className="flex items-center gap-2 sm:shrink-0">
					<label className="min-w-0 flex-1 sm:w-64 sm:flex-none">
						<span className="sr-only">Tìm lớp</span>
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm lớp, học phần hoặc học kỳ…"
							className="mc-input w-full min-h-11 text-xs"
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

			{filtered.length === 0 ? (
				<div
					className="mc-surface rounded-2xl p-8 sm:p-12 text-center"
					data-testid="teaching-empty-filtered"
				>
					<p className="text-sm font-semibold text-ink">Không có kết quả phù hợp</p>
					<p className="mc-meta mt-1 text-xs text-ink-secondary">
						Thử thay đổi từ khóa tìm kiếm hoặc đổi bộ lọc trạng thái.
					</p>
					<button
						type="button"
						onClick={() => {
							setQuery('');
							setStatusFilter('active');
						}}
						className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--mc-r-sm)] border border-border px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-hover"
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
						const openHref = routes.mySpaceTeachingClassTab(row.id, 'attendance');
						const warnings = row.atRiskCount + row.bannedCount;
						const isArchived = row.status === 'ARCHIVED';

						return (
							<article key={row.id}>
								<Link
									href={openHref}
									aria-label={`Mở lớp ${row.courseName}`}
									className={`group flex h-full flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none ${
										isArchived
											? 'border-border/60 bg-surface/60 opacity-80'
											: 'border-border/80 bg-surface hover:border-accent/40 hover:bg-surface'
									}`}
									data-testid={`teaching-class-card-${row.id}`}
								>
									<div>
										<p className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
											{row.courseCode} · Lớp {row.classCode ?? row.groupNo}
										</p>

										<h3 className="mt-2 text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
											{row.courseName}
										</h3>
										<p className="mt-1 text-xs text-ink-secondary">{row.term}</p>
										<div className="mt-3 flex flex-wrap items-center gap-1.5">
											<span
												className="teaching-status text-[0.625rem]"
												data-tone={isArchived ? 'muted' : 'ok'}
											>
												{isArchived ? 'Đã lưu trữ' : 'Đang dạy'}
											</span>
											<span className={`${shareTone(row)} text-[0.625rem]`}>{shareLabel(row)}</span>
										</div>

										<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-ink-secondary">
											<div className="flex items-center gap-1">
												<span className="font-semibold text-ink">{row.studentCount}</span>
												<span>học viên</span>
											</div>
											<div className="flex items-center gap-1">
												<span className="font-semibold text-ink">
													{row.sessionsTaken}/{row.sessionCount || row.totalWeeks}
												</span>
												<span>buổi điểm danh</span>
											</div>
											{warnings > 0 ? (
												<span className="rounded-full bg-error/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-error">
													{warnings} cảnh báo
												</span>
											) : null}
										</div>
									</div>

									<div className="mt-5 flex items-center justify-end pt-2">
										<span className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">
											Mở lớp <span aria-hidden="true">→</span>
										</span>
									</div>
								</Link>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}
