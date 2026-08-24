import Link from 'next/link';
import { getAdminOverview } from '@/features/my-class';
import { routes } from '@/config/routes';
import { StudioPageHeader } from '@/components/myclass/admin/studio';

export const dynamic = 'force-dynamic';

export default async function AdminMyClassPage() {
	const stats = await getAdminOverview();
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Studio học tập"
				title="Tổng quan My Class"
				description="Theo dõi trạng thái nội dung, nhóm học và hoạt động gần đây."
				actions={
					<Link
						href={routes.admin.myClassCourseNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo khóa học
					</Link>
				}
			/>

			<section aria-label="Tổng quan vận hành" className="mt-7 grid gap-3 md:grid-cols-3">
				<Link href={routes.admin.myClassKnowledge} className="mc-surface mc-surface-interactive p-5">
					<p className="text-sm font-semibold text-ink-secondary">Nội dung cần xử lý</p>
					<p className="mc-num mt-3 text-3xl font-bold text-ink">{stats.knowledgeUnitsMissingPublished}</p>
					<p className="mc-meta mt-2">Thiếu bản xuất bản</p>
				</Link>
				<Link href={routes.admin.myClassCohorts} className="mc-surface mc-surface-interactive p-5">
					<p className="text-sm font-semibold text-ink-secondary">Nhóm đang hoạt động</p>
					<p className="mc-num mt-3 text-3xl font-bold text-ink">{stats.cohortsActive}</p>
					<p className="mc-meta mt-2">{stats.memberships.active} học viên đang tham gia</p>
				</Link>
				<Link href={routes.admin.myClassPerformance} className="mc-surface mc-surface-interactive p-5">
					<p className="text-sm font-semibold text-ink-secondary">Lượt làm bài</p>
					<p className="mc-num mt-3 text-3xl font-bold text-ink">{stats.attemptsLast7Days}</p>
					<p className="mc-meta mt-2">Trong 7 ngày gần nhất</p>
				</Link>
			</section>

			<section className="mt-8 grid gap-3 sm:grid-cols-2">
				<Link href={routes.admin.myClassCourses} className="mc-surface mc-surface-interactive p-5">
					<p className="text-sm font-semibold text-ink">Khóa học</p>
					<p className="mc-meta mt-2">Mở bảng khóa học để lọc, sửa và xuất bản.</p>
				</Link>
				<Link href={routes.admin.myClassTests} className="mc-surface mc-surface-interactive p-5">
					<p className="text-sm font-semibold text-ink">Bài kiểm tra</p>
					<p className="mc-meta mt-2">Soạn, gắn vào khóa học và xuất bản.</p>
				</Link>
			</section>
		</div>
	);
}
