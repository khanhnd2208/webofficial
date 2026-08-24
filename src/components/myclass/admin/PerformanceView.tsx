import Link from 'next/link';
import { routes } from '@/config/routes';
import {
	cohortPerformance,
	coursePerformance,
	listAdminCourses,
	studentPerformance,
} from '@/features/my-class';
import { currentTableParams, parseOptionalSortDir } from '@/features/my-class/domain/listQuery';
import { performanceHref } from '@/features/my-class/domain/adminNavigation';
import { StudioFilterBar, StudioPageHeader } from './studio';
import CoursesTable from './tables/CoursesTable';
import PerformanceTable from './PerformanceTable';

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
	return (
		<div className="mc-surface p-4">
			<p className="text-sm font-semibold text-ink-secondary">{label}</p>
			<p className="mc-num mt-2 text-2xl font-bold text-ink">{value}</p>
			{hint ? <p className="mc-meta mt-1">{hint}</p> : null}
		</div>
	);
}

export default async function PerformanceView({
	courseId,
	cohortId,
	userId,
	embedded = false,
	q,
	page,
	pageSize,
	sortBy,
	sortDir,
}: {
	courseId?: string;
	cohortId?: string;
	userId?: string;
	embedded?: boolean;
	q?: string;
	page?: string;
	pageSize?: string;
	sortBy?: string;
	sortDir?: string;
}) {
	const listArgs = {
		q,
		page: page ? Number(page) : undefined,
		pageSize: pageSize ? Number(pageSize) : undefined,
		sortBy,
		sortDir: parseOptionalSortDir(sortDir),
	};
	const current = currentTableParams(
		{ q, page, pageSize, sortBy, sortDir, courseId, cohortId, userId },
		['q', 'page', 'pageSize', 'sortBy', 'sortDir', 'courseId', 'cohortId', 'userId'],
	);

	if (cohortId && userId) {
		const data = await studentPerformance(cohortId, userId, listArgs);
		return (
			<div className="mc-studio-container px-0 py-8">
				<Link
					href={performanceHref(data.cohort.courseId, data.cohort.id)}
					className="inline-flex min-h-10 items-center text-sm font-semibold text-ink-secondary"
				>
					← Nhóm học
				</Link>
				<StudioPageHeader
					className="mt-3"
					eyebrow="Kết quả học viên"
					title={data.student.name || data.student.email || data.student.userId}
					description={data.cohort.name}
				/>
				<div className="mt-6 grid gap-3 sm:grid-cols-3">
					<Stat label="Lượt làm bài" value={data.stats.attempts} />
					<Stat label="Độ chính xác" value={data.stats.accuracy == null ? '—' : `${data.stats.accuracy}%`} />
					<Stat label="Nội dung có bằng chứng" value={data.stats.knowledgeUnits} />
				</div>
				<section className="mt-8">
					<h2 className="text-base font-bold text-ink">Lịch sử làm bài</h2>
					<PerformanceTable
						rows={data.attempts.items.map((attempt) => ({
							id: attempt.id,
							title: attempt.testTitle,
							accuracy: attempt.total ? Math.round((attempt.score / attempt.total) * 100) : null,
							evidence: attempt.total,
							subtitle: new Date(attempt.submittedAt).toLocaleString('vi-VN'),
						}))}
						pathname={routes.admin.myClassPerformance}
						current={current}
						page={data.attempts.page}
						pageSize={data.attempts.pageSize}
						total={data.attempts.total}
						totalPages={data.attempts.totalPages}
					/>
				</section>
				<section className="mt-8">
					<h2 className="text-base font-bold text-ink">Bằng chứng theo nội dung</h2>
					<PerformanceTable
						rows={data.knowledgeUnits.map((row) => ({
							id: row.knowledgeUnitId,
							title: row.title,
							accuracy: row.accuracy,
							evidence: row.evidence,
							subtitle: `${row.attempts} lượt làm`,
						}))}
					/>
				</section>
			</div>
		);
	}
	if (cohortId) {
		const data = await cohortPerformance(cohortId, listArgs);
		return (
			<div className="mc-studio-container px-0 py-8">
				<Link
					href={performanceHref(data.cohort.courseId)}
					className="inline-flex min-h-10 items-center text-sm font-semibold text-ink-secondary"
				>
					← Khóa học
				</Link>
				<StudioPageHeader className="mt-3" eyebrow="Kết quả nhóm học" title={data.cohort.name} />
				<div className="mt-6 grid gap-3 sm:grid-cols-3">
					<Stat label="Học viên" value={data.stats.students} />
					<Stat label="Đã có hoạt động" value={data.stats.withEvidence} />
					<Stat label="Tổng lượt làm" value={data.stats.attempts} />
				</div>
				<StudioFilterBar
					action={routes.admin.myClassPerformance}
					q={q}
					qLabel="Tìm học viên"
					qPlaceholder="Tìm tên hoặc email…"
					hidden={{
						courseId: data.cohort.courseId,
						cohortId: data.cohort.id,
						sortBy: current.sortBy,
						sortDir: current.sortDir,
						pageSize: current.pageSize,
					}}
				/>
				<PerformanceTable
					rows={data.students.items.map((row) => ({
						id: row.userId,
						title: row.title,
						accuracy: row.accuracy,
						evidence: row.evidence,
						subtitle: `${row.attempts} lượt làm`,
						href: performanceHref(data.cohort.courseId, data.cohort.id, row.userId),
					}))}
					pathname={routes.admin.myClassPerformance}
					current={current}
					page={data.students.page}
					pageSize={data.students.pageSize}
					total={data.students.total}
					totalPages={data.students.totalPages}
				/>
			</div>
		);
	}
	if (courseId) {
		const data = await coursePerformance(courseId, listArgs);
		const cohorts = Array.isArray(data.cohorts) ? data.cohorts : (data.cohorts?.items ?? []);
		const stats = data.stats ?? {
			cohorts: Array.isArray(data.cohorts) ? data.cohorts.length : (data.cohorts?.total ?? 0),
			members: 0,
			attempts: 0,
		};
		return (
			<div className={embedded ? '' : 'mc-studio-container px-0 py-8'}>
				{embedded ? null : (
					<>
						<Link
							href={routes.admin.myClassPerformance}
							className="inline-flex min-h-10 items-center text-sm font-semibold text-ink-secondary"
						>
							← Kết quả
						</Link>
						<StudioPageHeader className="mt-3" eyebrow="Kết quả khóa học" title={data.course.title} />
					</>
				)}
				<div className="mt-6 grid gap-3 sm:grid-cols-3">
					<Stat label="Nhóm học" value={stats.cohorts} />
					<Stat label="Học viên" value={stats.members} />
					<Stat label="Lượt làm bài" value={stats.attempts} />
				</div>
				<PerformanceTable
					rows={cohorts.map((cohort) => ({
						id: cohort.id,
						title: cohort.name,
						accuracy: null,
						evidence: cohort.attempts,
						subtitle: `${cohort.members} học viên`,
						href: performanceHref(data.course.id, cohort.id),
					}))}
					pathname={embedded ? `${routes.admin.myClassCourseResults(courseId)}` : routes.admin.myClassPerformance}
					current={current}
					page={Array.isArray(data.cohorts) ? 1 : data.cohorts.page}
					pageSize={Array.isArray(data.cohorts) ? Math.max(cohorts.length, 1) : data.cohorts.pageSize}
					total={Array.isArray(data.cohorts) ? cohorts.length : data.cohorts.total}
					totalPages={Array.isArray(data.cohorts) ? 1 : data.cohorts.totalPages}
				/>
			</div>
		);
	}
	const courses = await listAdminCourses(listArgs);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Phân tích"
				title="Kết quả học tập"
				description="Đi từ khóa học đến nhóm học và từng học viên để xem bằng chứng học tập."
			/>
			<StudioFilterBar
				action={routes.admin.myClassPerformance}
				q={q}
				qLabel="Tìm khóa học"
				qPlaceholder="Tìm khóa học…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
			/>
			<CoursesTable
				data={courses}
				pathname={routes.admin.myClassPerformance}
				current={current}
				performanceLinks
			/>
		</div>
	);
}
