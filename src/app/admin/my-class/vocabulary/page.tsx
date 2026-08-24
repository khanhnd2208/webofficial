import Link from 'next/link';
import { listAdminCourseOptions, unwrapItems } from '@/features/my-class';
import { currentTableParams, parseOptionalBoolean } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import { StudioFilterBar, StudioFilterSelect, StudioPageHeader } from '@/components/myclass/admin/studio';
import VocabularyTable from '@/components/myclass/admin/tables/VocabularyTable';
import { listAdminVocabCatalog } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function AdminVocabularyLibraryPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		courseId?: string;
		archived?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	const archived = parseOptionalBoolean(params.archived);
	const current = currentTableParams(params, [
		'q',
		'courseId',
		'archived',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [sets, courseOptions] = await Promise.all([
		listAdminVocabCatalog({
			q: params.q,
			courseId: params.courseId || undefined,
			archived,
			page: params.page ? Number(params.page) : undefined,
			pageSize: params.pageSize ? Number(params.pageSize) : undefined,
			sortBy: params.sortBy,
			sortDir: params.sortDir === 'asc' || params.sortDir === 'desc' ? params.sortDir : undefined,
		}),
		listAdminCourseOptions(),
	]);
	const courses = unwrapItems(courseOptions);
	const hasFilters = Boolean(params.q || params.courseId || params.archived);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Từ vựng"
				title="Thư viện từ vựng"
				description="Tạo bộ từ, chỉnh danh sách, rồi gắn vào khóa học hoặc bài học."
				actions={
					<Link
						href={routes.admin.myClassVocabularyNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo bộ từ
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassVocabulary}
				q={params.q}
				qLabel="Tìm bộ từ"
				qPlaceholder="Tìm bộ từ…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassVocabulary : undefined}
			>
				<StudioFilterSelect name="courseId" label="Khóa học" value={params.courseId}>
					<option value="">Mọi khóa học</option>
					{courses.map((course) => (
						<option key={course.id} value={course.id}>
							{course.title}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="archived" label="Trạng thái" value={params.archived}>
					<option value="">Mọi trạng thái</option>
					<option value="false">Đang dùng</option>
					<option value="true">Đã lưu trữ</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<VocabularyTable data={sets} pathname={routes.admin.myClassVocabulary} current={current} />
		</div>
	);
}
