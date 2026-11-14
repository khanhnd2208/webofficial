import Link from 'next/link';

import { routes } from '@/config/routes';
import { getGradeSummary } from '@/features/teaching/domain/gradeSummary';
import type { TeachingGradebook } from '@/features/teaching/types';
import { GradeSummaryDownload } from './GradeSummaryDownload';

const formatScore = new Intl.NumberFormat('vi-VN', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function GradeSummaryWorkspace({ gradebook }: { gradebook: TeachingGradebook }) {
	const summary = getGradeSummary(gradebook);
	const classId = gradebook.class.id;

	if (!summary.ready) {
		return (
			<section className="mc-surface space-y-4 p-4 sm:p-5" aria-labelledby="grade-summary-heading">
				<div className="space-y-1">
					<h2 id="grade-summary-heading" className="text-xl font-semibold text-ink">
						Chưa thể xuất bảng tổng kết
					</h2>
					<p className="text-sm text-ink-secondary">
						Bảng tổng kết mở khi điểm danh và CP của tất cả các buổi trong kỳ đã được chốt.
					</p>
				</div>
				{summary.studentCount === 0 ? (
					<p className="text-sm text-ink-secondary">Lớp chưa có sinh viên đang học.</p>
				) : null}
				{summary.unassignedCount > 0 ? (
					<p className="text-sm text-ink-secondary">
						<Link
							href={routes.mySpaceTeachingClassTab(classId, 'students')}
							className="font-medium text-accent underline underline-offset-2"
						>
							{summary.unassignedCount} sinh viên chưa được phân tutorial
						</Link>
					</p>
				) : null}
				{summary.unfinished.length > 0 ? (
					<details className="border-t border-mc-rule pt-3" open>
						<summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-ink">
							{summary.unfinished.length} buổi cần hoàn tất
						</summary>
						<ul className="max-h-72 divide-y divide-mc-rule overflow-y-auto text-sm">
							{summary.unfinished.map((session) => (
								<li
									key={`${session.tutorialId}:${session.week}`}
									className="flex flex-wrap items-center justify-between gap-x-4 px-1 py-1"
								>
									<span className="font-medium text-ink">
										{session.tutorial} · Tuần {session.week}
									</span>
									<div className="flex flex-wrap gap-x-4">
										{session.missingSession ? (
											<span className="py-2 text-ink-secondary">Chưa có buổi học</span>
										) : null}
										{!session.missingSession && session.attendance ? (
											<Link
												href={routes.mySpaceTeachingClassTab(
													classId,
													'attendance',
													session.week,
													session.tutorialId,
												)}
												className="content-center py-2 text-accent underline underline-offset-2"
											>
												Chốt điểm danh
											</Link>
										) : null}
										{!session.missingSession && session.contribution ? (
											<Link
												href={routes.mySpaceTeachingClassTab(
													classId,
													'cp',
													session.week,
													session.tutorialId,
												)}
												className="content-center py-2 text-accent underline underline-offset-2"
											>
												Chốt CP
											</Link>
										) : null}
									</div>
								</li>
							))}
						</ul>
					</details>
				) : null}
			</section>
		);
	}

	return (
		<section className="space-y-4 pb-5" aria-labelledby="grade-summary-heading">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 id="grade-summary-heading" className="text-xl font-semibold text-ink">
						Bảng tổng kết
					</h2>
					<p className="mt-1 text-sm text-ink-secondary">
						{summary.rows.length} sinh viên · Thang điểm 10
					</p>
				</div>
				<GradeSummaryDownload classId={classId} />
			</div>
			<div
				className="mc-grid-wrap"
				role="region"
				tabIndex={0}
				aria-label="Bảng điểm tổng kết của lớp"
			>
				<table className="mc-grid text-center">
					<thead>
						<tr>
							{summary.headers.map((header, column) => (
								<th key={header} scope="col" className={column === 2 ? 'text-left' : undefined}>
									<span className="normal-case">{header}</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{summary.rows.map((row) => (
							<tr key={row[1]}>
								{row.map((value, column) => (
									<td
										key={summary.headers[column]}
										className={column === 2 ? 'text-left font-medium' : 'tabular-nums'}
									>
										{column === 5 ? (
											<span
												className={
													value === 'Yes' ? 'font-semibold text-accent' : 'font-semibold text-error'
												}
											>
												{value}
											</span>
										) : column === 8 ? (
											<strong>{formatScore.format(Number(value))}</strong>
										) : typeof value === 'number' && column >= 6 ? (
											formatScore.format(value)
										) : (
											value
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
