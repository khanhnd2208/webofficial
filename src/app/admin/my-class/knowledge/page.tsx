import Link from 'next/link';
import { listAdminCourseOptions, listAdminKnowledgeTable, unwrapItems } from '@/features/my-class';
import { currentTableParams, parsePublishStatus } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import { StudioFilterBar, StudioFilterSelect, StudioPageHeader } from '@/components/myclass/admin/studio';
import KnowledgeTable from '@/components/myclass/admin/tables/KnowledgeTable';

export const dynamic = 'force-dynamic';

export default async function AdminKnowledgePage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		status?: string;
		courseId?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	const status = parsePublishStatus(params.status);
	const current = currentTableParams(params, [
		'q',
		'status',
		'courseId',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [items, courseOptions] = await Promise.all([
		listAdminKnowledgeTable({
			q: params.q,
			status,
			courseId: params.courseId || undefined,
			page: params.page ? Number(params.page) : undefined,
			pageSize: params.pageSize ? Number(params.pageSize) : undefined,
			sortBy: params.sortBy,
			sortDir: params.sortDir === 'asc' || params.sortDir === 'desc' ? params.sortDir : undefined,
		}),
		listAdminCourseOptions(),
	]);
	const courses = unwrapItems(courseOptions);
	const hasFilters = Boolean(params.q || status || params.courseId);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Nội dung"
				title="Thư viện nội dung"
				description="Quản lý nội dung tái sử dụng giữa nhiều khóa học."
				actions={
					<Link
						href={routes.admin.myClassKnowledgeNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo nội dung
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassKnowledge}
				q={params.q}
				qLabel="Tìm nội dung"
				qPlaceholder="Tìm tiêu đề hoặc đường dẫn…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassKnowledge : undefined}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Mọi trạng thái</option>
					<option value="DRAFT">Bản nháp</option>
					<option value="PUBLISHED">Đã xuất bản</option>
					<option value="ARCHIVED">Đã lưu trữ</option>
				</StudioFilterSelect>
				<StudioFilterSelect name="courseId" label="Khóa học" value={params.courseId}>
					<option value="">Mọi khóa học</option>
					{courses.map((course) => (
						<option key={course.id} value={course.id}>
							{course.title}
						</option>
					))}
				</StudioFilterSelect>
			</StudioFilterBar>
			<KnowledgeTable data={items} pathname={routes.admin.myClassKnowledge} current={current} />
		</div>
	);
}
