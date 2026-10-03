import Link from 'next/link';
import { routes } from '@/config/routes';
import type {
	RecallReport,
	RecallReportFilters,
} from '@/features/active-recall/analytics/contracts';
import { RECALL_REPORT_PAGE_SIZE } from '@/features/active-recall/analytics/contracts';
import { TeachingAppHeader } from './TeachingAppHeader';

export function recallReportHref(
	filters: RecallReportFilters,
	overrides: Partial<RecallReportFilters> = {},
) {
	const values = { ...filters, ...overrides };
	const query = new URLSearchParams(
		Object.entries(values)
			.filter(([, value]) => value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
	return `${routes.mySpaceTeachingRecallAnalytics}?${query}`;
}
function duration(seconds: number) {
	if (seconds < 60) return `${seconds} giây`;
	const minutes = Math.floor(seconds / 60);
	return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}
function date(value: string) {
	return new Date(value).toLocaleString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
		dateStyle: 'short',
		timeStyle: 'short',
	});
}
function label(id: string) {
	return `Khách ${id.slice(0, 8)}`;
}
function Chart({
	report,
	metric,
	title,
}: {
	report: RecallReport;
	metric: 'learners' | 'sessions' | 'seconds';
	title: string;
}) {
	const values = report.daily.map((row) => (metric === 'seconds' ? row.seconds / 60 : row[metric]));
	const max = Math.max(1, ...values);
	const points = values
		.map(
			(value, i) =>
				`${values.length === 1 ? 240 : (i * 480) / (values.length - 1)},${100 - (value * 90) / max}`,
		)
		.join(' ');
	return (
		<figure className="rounded-xl border border-border bg-surface p-4">
			<figcaption className="mb-3 text-sm font-semibold">{title}</figcaption>
			<svg
				viewBox="0 0 480 110"
				role="img"
				aria-label={`${title} từ ${report.filters.start} đến ${report.filters.end}. Số liệu chi tiết ở bảng theo ngày.`}
				className="h-28 w-full text-ink"
			>
				<path d="M0 100H480" fill="none" stroke="currentColor" opacity="0.15" />
				<polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
				{values.length === 1 ? (
					<circle cx="240" cy={100 - (values[0] * 90) / max} r="3" fill="currentColor" />
				) : null}
			</svg>
			<div className="flex justify-between text-xs text-ink-secondary">
				<span>{report.filters.start}</span>
				<span>{report.filters.end}</span>
			</div>
		</figure>
	);
}
function Pagination({
	report,
	count,
	history = false,
}: {
	report: RecallReport;
	count: number;
	history?: boolean;
}) {
	const current = history ? report.filters.historyPage : report.filters.page;
	const pages = Math.max(1, Math.ceil(count / RECALL_REPORT_PAGE_SIZE));
	const key = history ? 'historyPage' : 'page';
	return (
		<nav
			aria-label={history ? 'Phân trang lịch sử' : 'Phân trang khách'}
			className="mt-4 flex items-center gap-4 text-sm"
		>
			{current > 1 ? (
				<Link className="underline" href={recallReportHref(report.filters, { [key]: current - 1 })}>
					← Trước
				</Link>
			) : null}
			<span>
				Trang {current} / {pages} · {count} {history ? 'phiên' : 'khách'}
			</span>
			{current < pages ? (
				<Link className="underline" href={recallReportHref(report.filters, { [key]: current + 1 })}>
					Tiếp →
				</Link>
			) : null}
		</nav>
	);
}
const tableClass =
	'w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-border [&_th]:p-3 [&_td]:border-b [&_td]:border-border [&_td]:p-3';
export function RecallAnalyticsReport({ report }: { report: RecallReport }) {
	const { filters, totals, options } = report;
	return (
		<div className="mx-auto max-w-6xl space-y-6 py-6 sm:py-8">
			<TeachingAppHeader
				backHref={routes.mySpaceTeaching}
				backLabel="Quản lý giảng dạy"
				eyebrow="Active Recall"
				title="Thống kê Active Recall"
				description="Theo dõi lượt học và tần suất quay lại của khách ẩn danh."
			/>
			<form
				method="get"
				className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3"
			>
				{(
					[
						['course', 'Môn học', options.courses],
						[
							'class',
							'Nguồn lớp',
							[{ id: 'direct', name: 'Không qua link lớp' }, ...options.classes],
						],
						['deck', 'Bộ thẻ', options.decks],
					] as const
				).map(([name, title, items]) => (
					<label key={name} className="grid gap-1 text-sm">
						{title}
						<select
							name={name}
							defaultValue={filters[name]}
							className="min-h-11 min-w-0 rounded-lg border border-border bg-canvas px-3"
						>
							<option value="">Tất cả</option>
							{items.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>
					</label>
				))}
				<label className="grid gap-1 text-sm">
					Từ ngày
					<input
						required
						type="date"
						name="start"
						defaultValue={filters.start}
						className="min-h-11 rounded-lg border border-border bg-canvas px-3"
					/>
				</label>
				<label className="grid gap-1 text-sm">
					Đến ngày
					<input
						required
						type="date"
						name="end"
						defaultValue={filters.end}
						className="min-h-11 rounded-lg border border-border bg-canvas px-3"
					/>
				</label>
				<div className="flex items-end">
					<button type="submit" className="min-h-11 rounded-lg bg-ink px-5 text-paper">
						Xem thống kê
					</button>
				</div>
				{filters.visitor ? <input type="hidden" name="visitor" value={filters.visitor} /> : null}
			</form>
			<nav aria-label="Khoảng ngày nhanh" className="flex flex-wrap gap-2">
				{[7, 30, 90, 365].map((days) => {
					const end = report.today;
					const start = new Date(Date.parse(end) - (days - 1) * 86_400_000)
						.toISOString()
						.slice(0, 10);
					return (
						<Link
							key={days}
							href={recallReportHref(filters, { start, end, page: 1, historyPage: 1 })}
							className="rounded-lg border border-border px-3 py-2 text-sm"
						>
							{days} ngày
						</Link>
					);
				})}
			</nav>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{[
					['Khách truy cập', totals.visitors],
					['Khách đã học', totals.learners],
					['Phiên đã học', totals.sessions],
					['Thời gian học ghi nhận', duration(totals.seconds)],
					['Khách quay lại', totals.returning],
					[
						'Phiên / khách đã học',
						totals.sessionsPerLearner.toLocaleString('vi-VN', { maximumFractionDigits: 1 }),
					],
				].map(([title, value]) => (
					<div key={title} className="rounded-xl border border-border bg-surface p-5">
						<p className="text-sm text-ink-secondary">{title}</p>
						<p className="mt-2 text-3xl font-bold">{value}</p>
					</div>
				))}
			</div>
			{totals.visitors === 0 ? (
				<p role="status" className="rounded-xl border border-border p-5">
					Chưa có lượt sử dụng trong khoảng ngày và bộ lọc đã chọn. Dữ liệu bắt đầu được ghi nhận từ
					khi tính năng được triển khai.
				</p>
			) : null}
			<div className="grid gap-3 md:grid-cols-3">
				<Chart report={report} metric="learners" title="Khách đã học theo ngày" />
				<Chart report={report} metric="sessions" title="Phiên học theo ngày" />
				<Chart report={report} metric="seconds" title="Thời gian học theo ngày (phút)" />
			</div>
			<p className="text-sm text-ink-secondary">
				Ngày tính theo giờ Việt Nam. Một phiên có thao tác học ở nhiều ngày được tính ở mỗi ngày
				tương ứng; tổng theo ngày có thể lớn hơn số phiên duy nhất của cả khoảng.
			</p>
			<details className="rounded-xl border border-border bg-surface p-4">
				<summary className="cursor-pointer font-semibold">Số liệu chi tiết theo ngày</summary>
				<div className="mt-3 overflow-x-auto">
					<table className={tableClass}>
						<caption className="sr-only">Số liệu Active Recall theo ngày</caption>
						<thead>
							<tr>
								<th>Ngày</th>
								<th>Lượt mở</th>
								<th>Khách đã học</th>
								<th>Phiên đã học</th>
								<th>Thời gian</th>
							</tr>
						</thead>
						<tbody>
							{report.daily.map((row) => (
								<tr key={row.day}>
									<td>{row.day}</td>
									<td>{row.opens}</td>
									<td>{row.learners}</td>
									<td>{row.sessions}</td>
									<td>{duration(row.seconds)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
			<section aria-labelledby="recall-deck-stats">
				<h2 id="recall-deck-stats" className="text-xl font-bold">
					Sử dụng theo bộ thẻ
				</h2>
				<div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
					<table className={tableClass}>
						<caption className="sr-only">Thống kê bộ thẻ</caption>
						<thead>
							<tr>
								<th>Bộ thẻ</th>
								<th>Lượt mở</th>
								<th>Khách đã học</th>
								<th>Phiên đã học</th>
								<th>Thời gian</th>
								<th>Mở đáp án</th>
							</tr>
						</thead>
						<tbody>
							{report.decks.map((row) => (
								<tr key={row.deckId}>
									<td>
										<p className="font-semibold">{row.title}</p>
										<p className="text-xs text-ink-secondary">{row.courseName}</p>
									</td>
									<td>{row.opens}</td>
									<td>{row.learners}</td>
									<td>{row.sessions}</td>
									<td>{duration(row.seconds)}</td>
									<td>{row.reveals}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
			<section aria-labelledby="recall-visitor-stats">
				<h2 id="recall-visitor-stats" className="text-xl font-bold">
					Khách ẩn danh
				</h2>
				<div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
					<table className={tableClass}>
						<caption className="sr-only">Tần suất học của từng khách</caption>
						<thead>
							<tr>
								<th>Khách</th>
								<th>Lần đầu truy cập</th>
								<th>Lần cuối truy cập</th>
								<th>Ngày học</th>
								<th>Phiên đã học</th>
								<th>Thời gian</th>
							</tr>
						</thead>
						<tbody>
							{report.visitors.map((row) => (
								<tr key={row.publicId}>
									<td>
										<Link
											className="font-semibold underline"
											href={recallReportHref(filters, { visitor: row.publicId, historyPage: 1 })}
										>
											{label(row.publicId)}
										</Link>
									</td>
									<td>{date(row.firstSeenAt)}</td>
									<td>{date(row.lastSeenAt)}</td>
									<td>{row.days}</td>
									<td>{row.sessions}</td>
									<td>{duration(row.seconds)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<Pagination report={report} count={report.visitorCount} />
			</section>
			{filters.visitor ? (
				<section aria-labelledby="recall-history">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 id="recall-history" className="text-xl font-bold">
							Lịch sử {label(filters.visitor)}
						</h2>
						<Link
							href={recallReportHref(filters, { visitor: '', historyPage: 1 })}
							className="text-sm underline"
						>
							Đóng lịch sử
						</Link>
					</div>
					{!report.history.length ? (
						<p className="mt-3 text-sm">Không có phiên phù hợp với bộ lọc đang chọn.</p>
					) : null}
					<div className="mt-3 space-y-3">
						{report.history.map((row) => (
							<article
								key={row.sessionId}
								className="rounded-xl border border-border bg-surface p-4"
							>
								<p className="font-semibold">
									{date(row.startedAt)} → {date(row.lastActivityAt)}
								</p>
								<p className="mt-1 text-sm">
									{row.engaged ? 'Đã học' : 'Chỉ mở xem'} · {duration(row.seconds)}
								</p>
								<p className="mt-2 text-sm">Bộ thẻ: {row.decks.join(' · ')}</p>
								<p className="text-sm text-ink-secondary">Nguồn: {row.classes.join(' · ')}</p>
							</article>
						))}
					</div>
					<Pagination report={report} count={report.historyCount} history />
				</section>
			) : null}
			<p className="text-sm text-ink-secondary">
				Mã khách đại diện cho một trình duyệt. Đổi thiết bị, dùng chế độ ẩn danh hoặc xóa cookie có
				thể tạo mã mới. Nguồn lớp phản ánh đường dẫn truy cập, không xác nhận thành viên lớp. Thời
				gian là ước lượng hoạt động; mất mạng hoặc đóng trang đột ngột có thể làm thiếu dữ liệu.
				Khách quay lại là khách đã học trước khoảng ngày đang xem, với cùng bộ lọc.
			</p>
		</div>
	);
}
