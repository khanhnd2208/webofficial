import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'My Space Tests | Admin',
};

const STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Lưu trữ',
};

export default async function AdminMyspaceTestsPage() {
	const [tests, questions, stats] = await Promise.all([
		myspaceTestsService.listAdminTestsWithCounts(),
		myspaceTestsService.listQuestions({ take: 1 }),
		myspaceTestsService.getAttemptStatsByTest(),
	]);

	const statsById = new Map(stats.map((s) => [s.spaceTestId, s]));
	const totals = stats.reduce(
		(acc, s) => ({
			engaged: acc.engaged + s.engaged,
			completed: acc.completed + s.completed,
		}),
		{ engaged: 0, completed: 0 },
	);

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Công cụ"
				title="Bài kiểm tra My Space"
				description="Import thông minh hoặc CSV để tạo bài test kèm câu hỏi."
				actions={
					<div className="flex flex-wrap gap-2">
						<Link
							href={routes.admin.myspaceTestAnalytics}
							className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-xs font-bold uppercase tracking-wider text-background"
						>
							Thống kê ({totals.completed} nộp)
						</Link>
						<Link
							href={routes.admin.myspaceQuestionsImport}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Import thông minh
						</Link>
						<Link
							href={routes.admin.myspaceSubjects}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Môn học
						</Link>
						<Link
							href={routes.admin.myspaceQuestions}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Ngân hàng ({questions.total})
						</Link>
						<Link
							href={routes.admin.myspaceTestNew}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Tạo thủ công
						</Link>
					</div>
				}
			/>

			{tests.length > 0 ? (
				<section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
					<div className="border border-border bg-surface p-4">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">Đã làm</p>
						<p className="mt-1 text-2xl font-black text-foreground">{totals.engaged}</p>
						<p className="mt-0.5 text-xs text-muted">trả lời ≥ 1 câu</p>
					</div>
					<div className="border border-border bg-surface p-4">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">Hoàn thành</p>
						<p className="mt-1 text-2xl font-black text-foreground">{totals.completed}</p>
						<p className="mt-0.5 text-xs text-muted">đã nộp bài</p>
					</div>
					<div className="border border-border bg-surface p-4 sm:col-span-1 col-span-2">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">Chi tiết</p>
						<Link
							href={routes.admin.myspaceTestAnalytics}
							className="mt-2 inline-block text-sm font-bold text-foreground underline underline-offset-2"
						>
							Xem biểu đồ & lịch sử nộp →
						</Link>
					</div>
				</section>
			) : null}

			{tests.length === 0 ? (
				<div className="mt-10">
					<AdminEmptyState
						title="Chưa có bài test"
						description="Bắt đầu bằng import thông minh để tạo bài kèm câu hỏi."
						action={{ href: routes.admin.myspaceQuestionsImport, label: 'Import thông minh' }}
					/>
				</div>
			) : (
				<div className="mt-8 divide-y divide-border border border-border">
					{tests.map((test) => {
						const s = statsById.get(test.id);
						return (
							<Link
								key={test.id}
								href={routes.admin.myspaceTestEdit(test.id)}
								className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-hover"
							>
								<div className="min-w-0">
									<p className="text-sm font-bold text-foreground">{test.title}</p>
									<p className="mt-0.5 text-xs text-muted">
										{test.subjectName} · {test.questionCount} câu / lần
										{test.attachedQuestionCount > 0
											? ` · ${test.attachedQuestionCount} câu gắn`
											: ''}{' '}
										· /{test.slug}
									</p>
									{s ? (
										<p className="mt-1 text-xs text-muted">
											{s.engaged} đã làm · {s.completed} hoàn thành
											{s.avgScorePercent != null ? ` · TB ${s.avgScorePercent}%` : ''}
										</p>
									) : null}
								</div>
								<span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-muted">
									{STATUS_LABEL[test.status] ?? test.status}
								</span>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
