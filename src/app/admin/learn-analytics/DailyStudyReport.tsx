import type { getLearnStudyReport } from '@/features/learn';
import { formatDay, formatDuration } from './reportPresentation';

type Daily = Awaited<ReturnType<typeof getLearnStudyReport>>['daily'];

export function DailyStudyReport({ daily }: { daily: Daily }) {
	const peak = daily.reduce<Daily[number] | null>(
		(best, day) => (day.seconds > (best?.seconds ?? 0) ? day : best),
		null,
	);
	const activeDays = daily.filter((day) => day.seconds > 0).length;
	const totalSeconds = daily.reduce((sum, day) => sum + day.seconds, 0);
	return (
		<section className="mt-9" aria-labelledby="daily-study-title">
			<h2 id="daily-study-title" className="text-sm font-bold uppercase tracking-widest text-muted">
				Thời lượng học theo ngày
			</h2>
			<p className="mt-2 text-sm text-muted">
				{activeDays} ngày có học · TB / ngày trong khoảng đã chọn:{' '}
				{formatDuration(daily.length ? Math.round(totalSeconds / daily.length) : 0)}.
				{peak
					? ` Ngày học nhiều nhất: ${formatDay(peak.day)} (${formatDuration(peak.seconds)}).`
					: ''}
			</p>
			<p className="mt-1 text-xs text-muted">
				Số 0 nghĩa là chưa ghi nhận thời lượng. Ngày trước khi bắt đầu theo dõi không cho biết học
				viên có học hay không.
			</p>
			{!peak ? (
				<p className="mt-3 rounded-xl border border-border p-5 text-sm text-muted">
					Chưa có thời gian học trong khoảng đã chọn.
				</p>
			) : null}
			<details className="mt-3" open={daily.length <= 31}>
				<summary className="cursor-pointer text-sm font-semibold text-foreground">
					Chi tiết {daily.length} ngày (giờ Việt Nam)
				</summary>
				<div className="mt-3 overflow-x-auto rounded-xl border border-border">
					<table className="w-full min-w-[42rem] text-left text-sm">
						<caption className="sr-only">
							Thời lượng và số người học mỗi ngày, bao gồm ngày chưa ghi nhận thời lượng
						</caption>
						<thead className="bg-surface text-xs uppercase tracking-wide text-muted">
							<tr>
								<th scope="col" className="px-4 py-3">
									Ngày
								</th>
								<th scope="col" className="px-4 py-3 text-right">
									Người học
								</th>
								<th scope="col" className="px-4 py-3 text-right">
									Phiên có học
								</th>
								<th scope="col" className="px-4 py-3">
									Thời lượng
								</th>
								<th scope="col" className="px-4 py-3 text-right">
									TB / người học
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{[...daily].reverse().map((day) => (
								<tr key={day.day}>
									<th scope="row" className="px-4 py-3 font-medium">
										<time dateTime={day.day}>{formatDay(day.day)}</time>
									</th>
									<td className="px-4 py-3 text-right tabular-nums">{day.learners}</td>
									<td className="px-4 py-3 text-right tabular-nums">{day.sessions}</td>
									<td className="min-w-48 px-4 py-3">
										<span className="tabular-nums">{formatDuration(day.seconds)}</span>
										<div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-surface">
											<div
												className="h-full rounded-full bg-foreground"
												style={{ width: `${peak ? (day.seconds / peak.seconds) * 100 : 0}%` }}
											/>
										</div>
									</td>
									<td className="px-4 py-3 text-right tabular-nums">
										{day.learners ? formatDuration(day.averageSeconds) : '—'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</section>
	);
}
