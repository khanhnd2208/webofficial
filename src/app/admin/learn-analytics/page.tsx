import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminForbidden } from '@/components/admin/AdminForbidden';
import { routes } from '@/config/routes';
import { getLearnStudyReport } from '@/features/learn';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ course?: string; days?: string; page?: string }> };

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	if (hours) return `${hours} giờ ${minutes % 60} phút`;
	if (minutes) return `${minutes} phút`;
	return `${seconds} giây`;
}

function formatDate(value: string | null) {
	if (!value) return '—';
	return new Date(value).toLocaleString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
		dateStyle: 'short',
		timeStyle: 'short',
	});
}

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
	return (
		<div className="rounded-xl border border-border bg-surface p-5">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
			<p className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</p>
			<p className="mt-1 text-xs text-muted">{note}</p>
		</div>
	);
}

export default async function LearnAnalyticsPage({ searchParams }: Props) {
	const session = await auth();
	if (!session?.user)
		redirect(`${routes.login}?from=${encodeURIComponent('/admin/learn-analytics')}`);
	if (session.user.role !== 'admin') return <AdminForbidden />;
	const query = await searchParams;
	const courses = await prisma.learnCourse.findMany({
		select: { id: true, slug: true, title: true },
		orderBy: [{ position: 'asc' }, { title: 'asc' }],
	});
	const defaultCourse = courses.find((course) => course.slug === 'hrm') ?? courses[0];
	const courseSlug = courses.some((course) => course.slug === query.course)
		? query.course!
		: defaultCourse?.slug;
	const parsedDays = Number(query.days ?? 30);
	const days = [7, 30, 90, 365].includes(parsedDays) ? parsedDays : 30;
	const report = courseSlug
		? await getLearnStudyReport(courseSlug, days, Number(query.page ?? 1))
		: null;

	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<AdminPageHeader
				eyebrow="My Space · Học tập"
				title="Thống kê tương tác khóa học"
				description="Thời gian ghi nhận khi mục học đang mở, tab hiển thị và có hoạt động gần đây."
				actions={
					<Link
						href={routes.admin.home}
						className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
					>
						← Tổng quan
					</Link>
				}
			/>

			<form
				method="get"
				className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
			>
				<label className="grid gap-1 text-xs font-semibold text-muted">
					Khóa học
					<select
						name="course"
						defaultValue={courseSlug ?? ''}
						className="min-h-10 min-w-56 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
					>
						{courses.map((course) => (
							<option key={course.id} value={course.slug}>
								{course.title}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1 text-xs font-semibold text-muted">
					Khoảng thời gian
					<select
						name="days"
						defaultValue={String(days)}
						className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
					>
						<option value="7">7 ngày</option>
						<option value="30">30 ngày</option>
						<option value="90">90 ngày</option>
						<option value="365">365 ngày</option>
					</select>
				</label>
				<button
					className="min-h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
					type="submit"
				>
					Lọc
				</button>
			</form>

			{!report ? (
				<div className="mt-8">
					<AdminEmptyState
						title="Chưa có khóa học"
						description="Khi có khóa học, thống kê tương tác sẽ xuất hiện tại đây."
					/>
				</div>
			) : (
				<>
					<p className="mt-5 text-sm text-muted">
						{report.course.title} · ghi nhận từ {formatDate(report.trackingSince)} · số liệu thời
						gian tính theo ngày Việt Nam.
					</p>
					<section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
						<Stat
							label="Tài khoản đã vào"
							value={report.totals.visitors.toLocaleString('vi-VN')}
							note={`${report.totals.visits.toLocaleString('vi-VN')} phiên trong ${days} ngày`}
						/>
						<Stat
							label="Đã tương tác học"
							value={report.totals.activeLearners.toLocaleString('vi-VN')}
							note="Có thời gian tại ít nhất một mục học"
						/>
						<Stat
							label="Tổng thời gian"
							value={formatDuration(report.totals.totalSeconds)}
							note="Cộng từ thời gian theo từng mục"
						/>
						<Stat
							label="TB / người học"
							value={
								report.totals.activeLearners
									? formatDuration(report.totals.averageSecondsPerActiveLearner)
									: '—'
							}
							note="Trung bình trên tài khoản có thời gian học"
						/>
					</section>

					<section className="mt-9">
						<h2 className="text-sm font-bold uppercase tracking-widest text-muted">Theo mục học</h2>
						<div className="mt-3 overflow-x-auto rounded-xl border border-border">
							<table className="w-full min-w-[34rem] text-left text-sm">
								<thead className="bg-surface text-xs uppercase tracking-wide text-muted">
									<tr>
										<th className="px-4 py-3">Mục</th>
										<th className="px-4 py-3 text-right">Người học</th>
										<th className="px-4 py-3 text-right">Thời gian</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{report.sections.length ? (
										report.sections.map((section) => (
											<tr key={section.sectionId}>
												<td className="px-4 py-3 font-medium text-foreground">{section.title}</td>
												<td className="px-4 py-3 text-right tabular-nums">{section.learners}</td>
												<td className="px-4 py-3 text-right tabular-nums">
													{formatDuration(section.seconds)}
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={3} className="px-4 py-8 text-center text-muted">
												Chưa có thời gian học được ghi nhận.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>

					<section className="mt-9">
						<h2 className="text-sm font-bold uppercase tracking-widest text-muted">
							Học viên · trang {report.page}/{report.totalPages}
						</h2>
						<div className="mt-3 overflow-x-auto rounded-xl border border-border">
							<table className="w-full min-w-[48rem] text-left text-sm">
								<thead className="bg-surface text-xs uppercase tracking-wide text-muted">
									<tr>
										<th className="px-4 py-3">Tài khoản</th>
										<th className="px-4 py-3 text-right">Phiên</th>
										<th className="px-4 py-3 text-right">Thời gian</th>
										<th className="px-4 py-3 text-right">Tiến độ hiện tại</th>
										<th className="px-4 py-3 text-right">Hoạt động gần nhất</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{report.learners.length ? (
										report.learners.map((learner) => (
											<tr key={learner.userId}>
												<td className="px-4 py-3">
													<p className="font-semibold text-foreground">{learner.name}</p>
													<p className="text-xs text-muted">{learner.email || learner.userId}</p>
												</td>
												<td className="px-4 py-3 text-right tabular-nums">{learner.sessions}</td>
												<td className="px-4 py-3 text-right tabular-nums">
													{formatDuration(learner.seconds)}
												</td>
												<td className="px-4 py-3 text-right tabular-nums">
													{learner.completedSections}/{learner.sectionCount}
												</td>
												<td className="px-4 py-3 text-right text-muted">
													{formatDate(learner.lastActivityAt)}
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={5} className="px-4 py-8 text-center text-muted">
												Chưa có lượt truy cập trong khoảng thời gian này.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>

					<nav aria-label="Trang danh sách học viên" className="mt-3 flex gap-4 text-sm">
						{report.page > 1 ? (
							<Link
								href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(report.course.slug)}&days=${days}&page=${report.page - 1}`}
							>
								← Trang trước
							</Link>
						) : null}
						{report.page < report.totalPages ? (
							<Link
								href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(report.course.slug)}&days=${days}&page=${report.page + 1}`}
							>
								Trang sau →
							</Link>
						) : null}
					</nav>
					<section className="mt-9">
						<h2 className="text-sm font-bold uppercase tracking-widest text-muted">Theo ngày</h2>
						<div className="mt-3 divide-y divide-border rounded-xl border border-border">
							{report.daily.length ? (
								report.daily.map((day) => (
									<div
										key={day.day}
										className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
									>
										<time className="text-muted">
											{new Date(`${day.day}T12:00:00+07:00`).toLocaleDateString('vi-VN')}
										</time>
										<span className="text-foreground">
											{day.learners} người · {formatDuration(day.seconds)}
										</span>
									</div>
								))
							) : (
								<p className="px-4 py-8 text-center text-sm text-muted">
									Chưa có hoạt động trong khoảng thời gian này.
								</p>
							)}
						</div>
					</section>
					<p className="mt-5 text-xs leading-relaxed text-muted">
						Một phiên được tính từ lúc mở khóa học; thời gian học chỉ cộng khi đang ở trong một mục
						học. Thời gian là ước tính: bộ đếm tạm dừng khi chuyển cửa sổ, tab bị ẩn hoặc không có
						thao tác trong 5 phút. Một tài khoản chỉ có một bộ đếm hoạt động; lượt xem của admin
						không được tính. Phiên mới bắt đầu sau 30 phút không hoạt động. Số liệu bắt đầu từ ngày
						triển khai; sự cố mạng hoặc đóng trình duyệt đột ngột có thể làm mất lần cập nhật cuối
						(khoảng 60 giây).
					</p>
				</>
			)}
		</div>
	);
}
