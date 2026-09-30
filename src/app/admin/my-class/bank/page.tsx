import Link from 'next/link';
import {
	BLOOM_LABELS,
	listAdminQuestionTable,
	listAdminSubjects,
	listAdminTopics,
} from '@/features/my-class';
import { currentTableParams, parseQuestionStatus } from '@/features/my-class/domain/listQuery';
import { routes } from '@/config/routes';
import {
	StudioFilterBar,
	StudioFilterSelect,
	StudioPageHeader,
} from '@/components/myclass/admin/studio';
import BankWorkspace from '@/components/myclass/admin/BankWorkspace';

export const dynamic = 'force-dynamic';

export default async function AdminBankPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		status?: string;
		type?: string;
		bloom?: string;
		subjectId?: string;
		topicId?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	const status = parseQuestionStatus(params.status);
	const type =
		params.type === 'MCQ_SINGLE' || params.type === 'MCQ_MULTI' || params.type === 'FILL_BLANK'
			? params.type
			: undefined;
	const bloom =
		params.bloom && Number(params.bloom) >= 1 && Number(params.bloom) <= 6
			? Number(params.bloom)
			: undefined;
	const current = currentTableParams(params, [
		'q',
		'status',
		'type',
		'bloom',
		'subjectId',
		'topicId',
		'page',
		'pageSize',
		'sortBy',
		'sortDir',
	]);
	const [items, subjects, topics] = await Promise.all([
		listAdminQuestionTable({
			q: params.q,
			status,
			types: type ? [type] : undefined,
			bloom: bloom ? [bloom] : undefined,
			subjectId: params.subjectId || undefined,
			topicId: params.topicId || undefined,
			page: params.page ? Number(params.page) : undefined,
			pageSize: params.pageSize ? Number(params.pageSize) : undefined,
			sortBy: params.sortBy,
			sortDir: params.sortDir === 'asc' || params.sortDir === 'desc' ? params.sortDir : undefined,
		}),
		listAdminSubjects(),
		listAdminTopics(params.subjectId || undefined),
	]);
	const hasFilters = Boolean(
		params.q || status || type || bloom || params.subjectId || params.topicId,
	);
	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Đánh giá"
				title="Ngân hàng câu hỏi"
				description="Lọc theo môn, chủ đề, dạng câu và Bloom rồi gắn vào bài kiểm tra."
				actions={
					<Link
						href={routes.admin.myClassQuestionNew}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Tạo câu hỏi
					</Link>
				}
			/>
			<StudioFilterBar
				action={routes.admin.myClassBank}
				q={params.q}
				qLabel="Tìm câu hỏi"
				qPlaceholder="Tìm câu hỏi…"
				hidden={{ sortBy: current.sortBy, sortDir: current.sortDir, pageSize: current.pageSize }}
				clearHref={hasFilters ? routes.admin.myClassBank : undefined}
			>
				<StudioFilterSelect name="type" label="Dạng câu" value={params.type}>
					<option value="">Mọi dạng</option>
					<option value="MCQ_SINGLE">MCQ 1 đáp án</option>
					<option value="MCQ_MULTI">MCQ nhiều đáp án</option>
					<option value="FILL_BLANK">Điền ô chữ</option>
				</StudioFilterSelect>
				<StudioFilterSelect name="bloom" label="Bloom" value={params.bloom}>
					<option value="">Bloom</option>
					{[1, 2, 3, 4, 5, 6].map((value) => (
						<option key={value} value={value}>
							{value} · {BLOOM_LABELS[value]}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="subjectId" label="Môn" value={params.subjectId}>
					<option value="">Môn</option>
					{subjects.map((subject) => (
						<option key={subject.id} value={subject.id}>
							{subject.name}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="topicId" label="Chủ đề" value={params.topicId}>
					<option value="">Chủ đề</option>
					{topics.map((topic) => (
						<option key={topic.id} value={topic.id}>
							{topic.path}
						</option>
					))}
				</StudioFilterSelect>
				<StudioFilterSelect name="status" label="Trạng thái" value={status}>
					<option value="">Trạng thái</option>
					<option value="ACTIVE">Đang dùng</option>
					<option value="ARCHIVED">Lưu trữ</option>
				</StudioFilterSelect>
			</StudioFilterBar>
			<BankWorkspace
				data={items}
				current={current}
				subjects={subjects.map((item) => ({ id: item.id, name: item.name }))}
				topics={topics.map((item) => ({ id: item.id, path: item.path }))}
			/>
		</div>
	);
}
