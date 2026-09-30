import { getAdminCourse, listAdminTestTable } from '@/features/my-class';
import { currentTableParams, parsePublishStatus } from '@/features/my-class/domain/listQuery';
import Link from 'next/link';
import { routes } from '@/config/routes';
import {
	StudioFilterBar,
	StudioFilterSelect,
	StudioPageHeader,
} from '@/components/myclass/admin/studio';
import TestsTable from '@/components/myclass/admin/tables/TestsTable';

export const dynamic = 'force-dynamic';

export default async function PracticePage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{
		q?: string;
		status?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const { id } = await params;
	const query = await searchParams;
	const status = parsePublishStatus(query.status);
	const current = currentTableParams({ ...query, courseId: id }, [
		'q',
		'status',
		'courseId',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [course, tests] = await Promise.all([
		getAdminCourse(id),
		listAdminTestTable({
			courseId: id,
			q: query.q,
			status,
			page: query.page ? Number(query.page) : undefined,
			pageSize: query.pageSize ? Number(query.pageSize) : undefined,
			sortBy: query.sortBy,
			sortDir: query.sortDir === 'asc' || query.sortDir === 'desc' ? query.sortDir : undefined,
		}),
	]);
	const pathname = routes.admin.myClassCoursePractice(id);
	return (
		<div>
			<StudioPageHeader
				eyebrow={course.title}
				title="Luyện tập"
				description="Các bài kiểm tra đã gắn vào khóa này."
				actions={
					<Link
						href={routes.admin.myClassTestNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo Test
					</Link>
				}
			/>
			<StudioFilterBar
				action={pathname}
				q={query.q}
				qLabel="Tìm bài kiểm tra"
				qPlaceholder="Tìm bài kiểm tra…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Mọi trạng thái</option>
					<option value="DRAFT">Bản nháp</option>
					<option value="PUBLISHED">Đã xuất bản</option>
					<option value="ARCHIVED">Đã lưu trữ</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<TestsTable data={tests} pathname={pathname} current={current} />
		</div>
	);
}
