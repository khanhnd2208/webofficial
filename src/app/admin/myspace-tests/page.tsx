import Link from 'next/link';

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
	const [tests, questions] = await Promise.all([
		myspaceTestsService.listAdminTestsWithCounts(),
		myspaceTestsService.listQuestions({ take: 1 }),
	]);

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Tests</h1>
					<p className="mt-2 text-sm text-muted">
						Import thông minh hoặc CSV để tạo bài test kèm câu hỏi.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						href={routes.admin.myspaceQuestionsImport}
						className="inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background"
					>
						Import thông minh
					</Link>
					<Link
						href={routes.admin.myspaceSubjects}
						className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground"
					>
						Môn học
					</Link>
					<Link
						href={routes.admin.myspaceQuestions}
						className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground"
					>
						Ngân hàng ({questions.total})
					</Link>
					<Link
						href={routes.admin.myspaceTestNew}
						className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground"
					>
						Tạo thủ công
					</Link>
				</div>
			</div>

			{tests.length === 0 ? (
				<div className="mt-10 border border-dashed border-border px-6 py-14 text-center">
					<p className="text-sm font-bold text-foreground">Chưa có bài test</p>
					<p className="mt-2 text-sm text-muted">
						Bắt đầu bằng{' '}
						<Link
							href={routes.admin.myspaceQuestionsImport}
							className="underline underline-offset-2"
						>
							import thông minh
						</Link>
						.
					</p>
				</div>
			) : (
				<div className="mt-8 divide-y divide-border border border-border">
					{tests.map((test) => (
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
							</div>
							<span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
								{STATUS_LABEL[test.status] ?? test.status}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
