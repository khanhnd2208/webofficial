import Link from 'next/link';
import type { getLearnStudyLearnerReport } from '@/features/learn';
import { formatDate, formatDay, formatDuration, reportHref } from './reportPresentation';

type Props = {
	report: Awaited<ReturnType<typeof getLearnStudyLearnerReport>>;
	course: string;
	days: number;
	page: number;
};

export function LearnerStudyReport({ report, course, days, page }: Props) {
	return (
		<section
			className="mt-9 rounded-xl border border-border bg-surface p-5"
			aria-labelledby="learner-study-title"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<h2 id="learner-study-title" className="font-bold text-foreground">
					Chi tiết học viên{report ? `: ${report.name}` : ''}
				</h2>
				<Link
					className="text-sm underline underline-offset-4"
					href={reportHref(course, days, page)}
				>
					Đóng chi tiết
				</Link>
			</div>
			{!report ? (
				<p className="mt-3 text-sm text-muted">
					Không có phiên truy cập của học viên trong khóa học và khoảng thời gian này.
				</p>
			) : (
				<>
					<p className="mt-1 text-sm text-muted">{report.email || report.userId}</p>
					<dl className="mt-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
						{[
							['Thời lượng học', formatDuration(report.totalSeconds)],
							['Ngày có học', String(report.activeDays)],
							['TB / ngày có học', formatDuration(report.averageSecondsPerActiveDay)],
							['Phiên truy cập', String(report.sessionCount)],
						].map(([label, value]) => (
							<div key={label}>
								<dt className="text-muted">{label}</dt>
								<dd className="mt-1 font-bold tabular-nums">{value}</dd>
							</div>
						))}
					</dl>
					<h3 className="mt-6 font-semibold text-foreground">Ngày học và nội dung đã tương tác</h3>
					<p className="mt-1 text-xs text-muted">
						Ngày không có thời lượng học được ghi nhận được tính là 0. Mở khóa học nhưng chưa học
						mục nào chỉ tính là lượt truy cập.
					</p>
					<div className="mt-3 overflow-x-auto">
						<table className="w-full min-w-[34rem] text-left text-sm">
							<thead className="text-xs uppercase text-muted">
								<tr>
									<th scope="col" className="py-3 pr-4">
										Ngày
									</th>
									<th scope="col" className="px-4 py-3 text-right">
										Thời lượng
									</th>
									<th scope="col" className="px-4 py-3 text-right">
										Phiên có học
									</th>
									<th scope="col" className="px-4 py-3">
										Mục học
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{[...report.daily].reverse().map((day) => (
									<tr key={day.day}>
										<th scope="row" className="py-3 pr-4 font-medium">
											<time dateTime={day.day}>{formatDay(day.day)}</time>
										</th>
										<td className="px-4 py-3 text-right tabular-nums">
											{formatDuration(day.seconds)}
										</td>
										<td className="px-4 py-3 text-right tabular-nums">{day.sessions}</td>
										<td className="px-4 py-3">
											{day.sections.length ? (
												<details>
													<summary className="cursor-pointer">
														{day.sectionCount} mục đã tương tác
													</summary>
													<ul className="mt-2 space-y-1 text-muted">
														{day.sections.map((section) => (
															<li key={section.sectionId}>
																{section.title} · {formatDuration(section.seconds)}
															</li>
														))}
													</ul>
												</details>
											) : (
												'—'
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<h3 className="mt-6 font-semibold text-foreground">
						Thời điểm truy cập · trang {report.page}/{report.totalPages}
					</h3>
					<p className="mt-1 text-xs leading-relaxed text-muted">
						Giờ Việt Nam. Bắt đầu và hoạt động cuối là mốc của cả phiên truy cập; khoảng giữa hai
						mốc có thể có lúc nghỉ. Thời lượng chỉ cộng phần học trong {days} ngày đã chọn. Dữ liệu
						hiện có chưa cho biết thời lượng học theo từng giờ.
					</p>
					<div className="mt-3 overflow-x-auto">
						<table className="w-full min-w-[34rem] text-left text-sm">
							<thead className="text-xs uppercase text-muted">
								<tr>
									<th scope="col" className="py-3 pr-4">
										Bắt đầu truy cập
									</th>
									<th scope="col" className="px-4 py-3">
										Hoạt động cuối của phiên
									</th>
									<th scope="col" className="px-4 py-3 text-right">
										Thời lượng trong khoảng chọn
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{report.sessions.map((session) => (
									<tr key={session.id}>
										<td className="py-3 pr-4">
											<time dateTime={session.startedAt}>{formatDate(session.startedAt)}</time>
										</td>
										<td className="px-4 py-3">
											<time dateTime={session.lastActivityAt}>
												{formatDate(session.lastActivityAt)}
											</time>
										</td>
										<td className="px-4 py-3 text-right tabular-nums">
											{formatDuration(session.seconds)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<nav aria-label="Trang phiên truy cập" className="mt-3 flex gap-4 text-sm">
						{report.page > 1 ? (
							<Link href={reportHref(course, days, page, report.userId, report.page - 1)}>
								← Phiên trước
							</Link>
						) : null}
						{report.page < report.totalPages ? (
							<Link href={reportHref(course, days, page, report.userId, report.page + 1)}>
								Phiên sau →
							</Link>
						) : null}
					</nav>
				</>
			)}
		</section>
	);
}
