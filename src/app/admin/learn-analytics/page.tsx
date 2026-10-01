import Link from 'next/link';
import { AdminButton, AdminStat } from '@/components/admin/AdminPrimitives';
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
				breadcrumbs={resolveAdminRoute(routes.admin.learnAnalytics).breadcrumbs}
				title="Thống kê học tập"
				description="Thời gian ghi nhận khi mục học đang mở, tab hiển thị và có hoạt động gần đây."
			/>

			<div className={styles.toolbar}>
				<form method="get" className="contents">
					<input type="hidden" name="days" value={String(days)} />
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
					<AdminButton type="submit" icon="filter" disabled={!courses.length}>
						Áp dụng
					</AdminButton>
				</form>
				{courseSlug ? (
					<nav aria-label="Khoảng thời gian" className={styles.chips}>
						{[7, 30, 90, 365].map((value) => (
							<Link
								key={value}
								href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(courseSlug)}&days=${value}`}
								className={styles.chip}
								aria-current={days === value ? 'true' : undefined}
							>
								{value} ngày
							</Link>
						))}
					</nav>
				) : null}
			</div>

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
					{report.totals.visits === 0 ? (
						<div className="mt-6">
							<AdminEmptyState
								icon="analytics"
								title="Chưa có tương tác trong khoảng đã chọn"
								description="Thời gian chỉ được ghi khi một mục học đang mở, tab hiển thị và có hoạt động gần đây."
							/>
							<div className={`${styles.chips} mt-4`}>
								{[90, 365]
									.filter((value) => value > days)
									.map((value) => (
										<Link
											key={value}
											className={styles.chip}
											href={`${routes.admin.learnAnalytics}?course=${encodeURIComponent(report.course.slug)}&days=${value}`}
										>
											Xem {value} ngày
										</Link>
									))}
							</div>
						</div>
					) : (
						<>
							<p className="mt-5 text-sm text-muted">
								{report.course.title} · ghi nhận từ {formatDate(report.trackingSince)} · số liệu
								thời gian tính theo ngày Việt Nam.
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
									<table className={`${styles.table} ${styles.tableMedium}`}>
										<thead>
											<tr>
												<th>Mục</th>
												<th className={styles.numeric}>Người học</th>
												<th className={styles.numeric}>Thời gian</th>
											</tr>
										</thead>
										<tbody>
											{report.sections.length ? (
												report.sections.map((section) => (
													<tr key={section.sectionId}>
														<td className={styles.wrap}>{section.title}</td>
														<td className={styles.numeric}>{section.learners}</td>
														<td className={styles.numeric}>{formatDuration(section.seconds)}</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={3}>Chưa có thời gian học được ghi nhận.</td>
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
									<table className={`${styles.table} ${styles.tableWide}`}>
										<thead>
											<tr>
												<th>Tài khoản</th>
												<th className={styles.numeric}>Phiên</th>
												<th className={styles.numeric}>Thời gian</th>
												<th className={styles.numeric}>Tiến độ hiện tại</th>
												<th className={styles.numeric}>Hoạt động gần nhất</th>
											</tr>
										</thead>
										<tbody>
											{report.learners.length ? (
												report.learners.map((learner) => (
													<tr key={learner.userId}>
														<td className={styles.wrap}>
															<p className="font-semibold">{learner.name}</p>
															<p className={styles.meta}>{learner.email || learner.userId}</p>
														</td>
														<td className={styles.numeric}>{learner.sessions}</td>
														<td className={styles.numeric}>{formatDuration(learner.seconds)}</td>
														<td className={styles.numeric}>
															{learner.completedSections}/{learner.sectionCount}
														</td>
														<td className={styles.numeric}>{formatDate(learner.lastActivityAt)}</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={5}>Chưa có lượt truy cập trong khoảng thời gian này.</td>
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
								Một phiên được tính từ lúc mở khóa học; thời gian học chỉ cộng khi đang ở trong một
								mục học. Thời gian là ước tính: bộ đếm tạm dừng khi chuyển cửa sổ, tab bị ẩn hoặc
								không có thao tác trong 5 phút. Một tài khoản chỉ có một bộ đếm hoạt động; lượt xem
								của admin không được tính. Phiên mới bắt đầu sau 30 phút không hoạt động. Số liệu
								bắt đầu từ ngày triển khai; sự cố mạng hoặc đóng trình duyệt đột ngột có thể làm mất
								lần cập nhật cuối (khoảng 60 giây).
							</p>
						</>
					)}
				</>
			)}
		</div>
	);
}
