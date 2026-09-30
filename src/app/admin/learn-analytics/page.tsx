import Link from 'next/link';
import { AdminButton, AdminLink, AdminStat } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import { redirect } from 'next/navigation';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminForbidden } from '@/components/admin/AdminForbidden';
import { resolveAdminRoute } from '@/config/adminNavigation';
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
		<div className={`${styles.page} ${styles.wide}`}>
			<AdminPageHeader
				eyebrow="Admin Studio"
				breadcrumbs={resolveAdminRoute(routes.admin.learnAnalytics).breadcrumbs}
				title="Thống kê tương tác khóa học"
				description="Thời gian ghi nhận khi mục học đang mở, tab hiển thị và có hoạt động gần đây."
				actions={
					<AdminLink href={routes.admin.home} icon="back">
						Tổng quan
					</AdminLink>
				}
			/>

			<form method="get" className={styles.toolbar}>
				<label className={styles.field}>
					Khóa học
					<select
						name="course"
						disabled={!courses.length}
						defaultValue={courseSlug ?? ''}
						className={styles.control}
					>
						{!courses.length && <option value="">Chưa có khóa học</option>}
						{courses.map((course) => (
							<option key={course.id} value={course.slug}>
								{course.title}
							</option>
						))}
					</select>
				</label>
				<label className={styles.field}>
					Khoảng thời gian
					<select name="days" defaultValue={String(days)} className={styles.control}>
						<option value="7">7 ngày</option>
						<option value="30">30 ngày</option>
						<option value="90">90 ngày</option>
						<option value="365">365 ngày</option>
					</select>
				</label>
				<AdminButton type="submit" icon="filter" disabled={!courses.length}>
					Áp dụng
				</AdminButton>
			</form>

			{!report ? (
				<div className="mt-8">
					<AdminEmptyState
						icon="analytics"
						title="Chưa có khóa học"
						description="Khi có khóa học, thống kê tương tác sẽ xuất hiện tại đây."
					/>
				</div>
			) : (
				<>
					{report.totals.visits === 0 && (
						<div className="mt-6">
							<AdminEmptyState
								icon="analytics"
								title="Chưa có tương tác trong khoảng đã chọn"
								description="Thử chọn khoảng thời gian khác để xem hoạt động học tập."
							/>
						</div>
					)}
					<p className="mt-5 text-sm text-muted">
						{report.course.title} · ghi nhận từ {formatDate(report.trackingSince)} · số liệu thời
						gian tính theo ngày Việt Nam.
					</p>
					<section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
						<AdminStat
							label="Tài khoản đã vào"
							value={report.totals.visitors.toLocaleString('vi-VN')}
							note={`${report.totals.visits.toLocaleString('vi-VN')} phiên trong ${days} ngày`}
						/>
						<AdminStat
							label="Đã tương tác học"
							value={report.totals.activeLearners.toLocaleString('vi-VN')}
							note="Có thời gian tại ít nhất một mục học"
						/>
						<AdminStat
							label="Tổng thời gian"
							value={formatDuration(report.totals.totalSeconds)}
							note="Cộng từ thời gian theo từng mục"
						/>
						<AdminStat
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
						<h2 className={styles.sectionTitle}>Theo mục học</h2>
						<div className={`${styles.tableWrap} mt-3`}>
							<table className={`${styles.table} min-w-[34rem]`}>
								<thead className="bg-surface text-xs uppercase tracking-wide text-muted">
									<tr>
										<th className="px-4 py-3">Mục</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Người học</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Thời gian</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{report.sections.length ? (
										report.sections.map((section) => (
											<tr key={section.sectionId}>
												<td className="px-4 py-3 font-medium text-foreground">{section.title}</td>
												<td className={`px-4 py-3 ${styles.numeric} tabular-nums`}>
													{section.learners}
												</td>
												<td className={`px-4 py-3 ${styles.numeric} tabular-nums`}>
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
						<h2 className={styles.sectionTitle}>
							Học viên · trang {report.page}/{report.totalPages}
						</h2>
						<div className={`${styles.tableWrap} mt-3`}>
							<table className={`${styles.table} min-w-[48rem]`}>
								<thead className="bg-surface text-xs uppercase tracking-wide text-muted">
									<tr>
										<th className="px-4 py-3">Tài khoản</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Phiên</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Thời gian</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Tiến độ hiện tại</th>
										<th className={`px-4 py-3 ${styles.numeric}`}>Hoạt động gần nhất</th>
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
												<td className={`px-4 py-3 ${styles.numeric} tabular-nums`}>
													{learner.sessions}
												</td>
												<td className={`px-4 py-3 ${styles.numeric} tabular-nums`}>
													{formatDuration(learner.seconds)}
												</td>
												<td className={`px-4 py-3 ${styles.numeric} tabular-nums`}>
													{learner.completedSections}/{learner.sectionCount}
												</td>
												<td className={`px-4 py-3 ${styles.numeric} text-muted`}>
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

					<nav aria-label="Trang danh sách học viên" className={styles.pagination}>
						{report.page > 1 ? (
							<Link
								className={`${styles.button} ${styles.secondary}`}
								href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(report.course.slug)}&days=${days}&page=${report.page - 1}`}
							>
								← Trang trước
							</Link>
						) : null}
						{report.page < report.totalPages ? (
							<Link
								className={`${styles.button} ${styles.secondary}`}
								href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(report.course.slug)}&days=${days}&page=${report.page + 1}`}
							>
								Trang sau →
							</Link>
						) : null}
					</nav>
					<section className="mt-9">
						<h2 className={styles.sectionTitle}>Theo ngày</h2>
						<div className={`${styles.list} mt-3`}>
							{report.daily.length ? (
								report.daily.map((day) => (
									<div
										key={day.day}
										className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
									>
										<time className="text-muted">
											{new Date(`${day.day}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
												timeZone: 'Asia/Ho_Chi_Minh',
											})}
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
