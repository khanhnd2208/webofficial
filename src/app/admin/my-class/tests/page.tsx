import Link from 'next/link';
import {
	listAdminCourseOptions,
	listAdminSubjects,
	listAdminTestTable,
	listAdminTopics,
	testTableQueryFromSearch,
	unwrapItems,
} from '@/features/my-class';
import { currentTableParams } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import {
	StudioFilterBar,
	StudioFilterSelect,
	StudioPageHeader,
} from '@/components/myclass/admin/studio';
import TestsTable from '@/components/myclass/admin/tables/TestsTable';

export const dynamic = 'force-dynamic';

export default async function AdminTestsPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		status?: string;
		courseId?: string;
		subjectId?: string;
		topicId?: string;
		unplaced?: string;
		hasAttempts?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	const current = currentTableParams(params, [
		'q',
		'status',
		'courseId',
		'subjectId',
		'topicId',
		'unplaced',
		'hasAttempts',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [tests, courseOptions, subjects, topics] = await Promise.all([
		listAdminTestTable(testTableQueryFromSearch(params)),
		listAdminCourseOptions(),
		listAdminSubjects(),
		listAdminTopics(params.subjectId || undefined),
	]);
	const courses = unwrapItems(courseOptions);
	const hasFilters = Boolean(
		params.q ||
		params.status ||
		params.courseId ||
		params.subjectId ||
		params.topicId ||
		params.unplaced ||
		params.hasAttempts,
	);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Đánh giá"
				title="Thư viện bài kiểm tra"
				description="Tạo bài kiểm tra theo tên, lọc câu hỏi trong ngân hàng, rồi gắn vào nhiều khóa học."
				actions={
					<Link
						href={routes.admin.myClassTestNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo bài kiểm tra
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassTests}
				q={params.q}
				qLabel="Tìm bài kiểm tra"
				qPlaceholder="Tìm bài kiểm tra…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassTests : undefined}
			>
				<StudioFilterSelect name="status" label="Trạng thái" value={params.status}>
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
				<StudioFilterSelect name="subjectId" label="Môn" value={params.subjectId}>
					<option value="">Mọi môn</option>
					{subjects.map((subject) => (
						<option key={subject.id} value={subject.id}>
							{subject.name}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="topicId" label="Chủ đề" value={params.topicId}>
					<option value="">Mọi chủ đề</option>
					{topics.map((topic) => (
						<option key={topic.id} value={topic.id}>
							{topic.path}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="unplaced" label="Chỗ gắn" value={params.unplaced}>
					<option value="">Mọi chỗ gắn</option>
					<option value="true">Chưa gắn khóa</option>
					<option value="false">Đã gắn khóa</option>
				</StudioFilterSelect>
				<StudioFilterSelect name="hasAttempts" label="Lượt làm" value={params.hasAttempts}>
					<option value="">Mọi lượt làm</option>
					<option value="true">Đã có lượt làm</option>
					<option value="false">Chưa có lượt làm</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<TestsTable data={tests} pathname={routes.admin.myClassTests} current={current} />
		</div>
	);
}
