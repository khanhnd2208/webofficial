'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { routes } from '@/config/routes';
import { formatTeachingScore, ATTENDANCE_MAX_POINTS, CP_MAX_POINTS, TOTAL_MAX_POINTS } from '@/features/teaching/domain/cp';
import type { TeachingClassListItem } from '@/features/teaching/types';

type ShareFilter = 'all' | 'shared' | 'private';
type StatusFilter = 'all' | 'active' | 'archived';

function shareLabel(row: TeachingClassListItem) {
	return row.attendanceVisible ? 'Đang chia sẻ' : 'Riêng tư';
}

function shareTone(row: TeachingClassListItem) {
	return row.attendanceVisible ? 'teaching-status teaching-status-ok' : 'teaching-status';
}

export function TeachingClassesTable({ classes }: { classes: TeachingClassListItem[] }) {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [shareFilter, setShareFilter] = useState<ShareFilter>('all');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
	const filtered = useMemo(() => {
		const value = query.trim().toLowerCase();
		return classes.filter((row) => {
			const matchesQuery =
				!value ||
				`${row.courseCode} ${row.courseName} ${row.groupNo} ${row.term}`
					.toLowerCase()
					.includes(value);
			const matchesShare =
				shareFilter === 'all' ||
				(shareFilter === 'shared' ? row.attendanceVisible : !row.attendanceVisible);
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' ? row.status === 'ACTIVE' : row.status === 'ARCHIVED');
			return matchesQuery && matchesShare && matchesStatus;
		});
	}, [classes, query, shareFilter, statusFilter]);

	return (
		<div className="teaching-class-list mc-surface mt-6 overflow-hidden sm:mt-7">
			<div className="mc-card-head teaching-list-toolbar">
				<div>
					<h2 className="font-semibold text-ink">Các lớp đang quản lý</h2>
					<p className="mc-meta mt-1">Chọn một lớp để điểm danh, chấm CP hoặc chia sẻ.</p>
				</div>
				<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
					<label className="min-w-0 flex-1 sm:flex-none">
						<span className="sr-only">Tìm lớp</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm lớp, học phần hoặc học kỳ…"
							className="mc-input w-full sm:w-72"
						/>
					</label>
					<label>
						<span className="sr-only">Lọc trạng thái chia sẻ</span>
						<select
							value={shareFilter}
							onChange={(event) => setShareFilter(event.target.value as ShareFilter)}
							className="mc-input w-full sm:w-auto"
						>
							<option value="all">Tất cả chia sẻ</option>
							<option value="shared">Đang chia sẻ</option>
							<option value="private">Riêng tư</option>
						</select>
					</label>
					<label>
						<span className="sr-only">Lọc trạng thái lớp</span>
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
							className="mc-input w-full sm:w-auto"
						>
							<option value="all">Tất cả lớp</option>
							<option value="active">Đang hoạt động</option>
							<option value="archived">Đã lưu trữ</option>
						</select>
					</label>
				</div>
			</div>
			<div className="teaching-class-table-wrap overflow-auto">
				<table className="mc-data-table teaching-class-table w-full text-sm">
					<caption className="sr-only">Danh sách lớp học</caption>
					<thead>
						<tr>
							<th>Học phần</th>
							<th>Lớp</th>
							<th>Học kỳ</th>
							<th>Học viên</th>
							<th>Điểm danh</th>
							<th>Attendance TB /{ATTENDANCE_MAX_POINTS}</th>
							<th>CP TB /{CP_MAX_POINTS}</th>
							<th>Tổng TB /{TOTAL_MAX_POINTS}</th>
							<th>Cảnh báo</th>
							<th>Chia sẻ</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((row) => (
							<tr
								key={row.id}
								className="teaching-class-table-row"
								tabIndex={0}
								role="link"
								aria-label={`Mở lớp ${row.courseCode} ${row.courseName}`}
								onClick={() => {
									router.push(routes.mySpaceTeachingClassTab(row.id, 'attendance'));
								}}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										router.push(routes.mySpaceTeachingClassTab(row.id, 'attendance'));
									}
								}}
							>
								<td>
									<Link
										href={routes.mySpaceTeachingClassTab(row.id, 'attendance')}
										tabIndex={-1}
										className="block font-semibold text-ink hover:text-accent hover:underline"
									>
										{row.courseCode}
										<span className="mt-0.5 block text-xs font-normal text-ink-secondary">
											{row.courseName}
										</span>
									</Link>
								</td>
								<td className="mc-num">{row.groupNo}</td>
								<td>{row.term}</td>
								<td className="mc-num">{row.studentCount}</td>
								<td className="mc-num">
									{row.sessionsTaken}/{row.sessionCount || row.totalWeeks}
								</td>
								<td className="mc-num">{row.averageAttendance == null ? '—' : `${formatTeachingScore(row.averageAttendance)} / ${ATTENDANCE_MAX_POINTS}`}</td>
								<td className="mc-num">{row.averageCp == null ? '—' : `${formatTeachingScore(row.averageCp)} / ${CP_MAX_POINTS}`}</td>
								<td className="mc-num">{row.averageTotal == null ? '—' : `${formatTeachingScore(row.averageTotal)} / ${TOTAL_MAX_POINTS}`}</td>
								<td className="mc-num">{row.atRiskCount + row.bannedCount || '—'}</td>
								<td>
									<span className={shareTone(row)}>{shareLabel(row)}</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="teaching-class-cards">
				{filtered.map((row) => (
					<Link
						key={row.id}
						href={routes.mySpaceTeachingClassTab(row.id, 'attendance')}
						className="teaching-class-card"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
									{row.courseCode} · Lớp {row.groupNo}
								</p>
								<h3 className="mt-1 truncate text-base font-semibold text-ink">{row.courseName}</h3>
								<p className="mt-1 text-sm text-ink-secondary">{row.term}</p>
							</div>
							<span className={shareTone(row)}>{shareLabel(row)}</span>
						</div>
						<div className="teaching-class-card-stats">
							<span>
								<b>{row.studentCount}</b>
								<small>học viên</small>
							</span>
							<span>
								<b>
									{row.sessionsTaken}/{row.sessionCount || row.totalWeeks}
								</b>
								<small>điểm danh</small>
							</span>
							<span>
								<b>{row.averageAttendance == null ? '—' : `${formatTeachingScore(row.averageAttendance)} / ${ATTENDANCE_MAX_POINTS}`}</b>
								<small>Attendance TB /{ATTENDANCE_MAX_POINTS}</small>
							</span>
							<span>
								<b>{row.averageCp == null ? '—' : `${formatTeachingScore(row.averageCp)} / ${CP_MAX_POINTS}`}</b>
								<small>CP TB /{CP_MAX_POINTS}</small>
							</span>
							<span>
								<b>{row.averageTotal == null ? '—' : `${formatTeachingScore(row.averageTotal)} / ${TOTAL_MAX_POINTS}`}</b>
								<small>Tổng TB /{TOTAL_MAX_POINTS}</small>
							</span>
							<span>
								<b>{row.atRiskCount + row.bannedCount || '—'}</b>
								<small>cảnh báo</small>
							</span>
						</div>
						<span className="text-sm font-semibold text-accent">
							Mở workspace <span aria-hidden>→</span>
						</span>
					</Link>
				))}
			</div>
			{filtered.length === 0 ? (
				<p className="p-8 text-center text-sm text-ink-secondary">Không tìm thấy lớp phù hợp.</p>
			) : null}
		</div>
	);
}
