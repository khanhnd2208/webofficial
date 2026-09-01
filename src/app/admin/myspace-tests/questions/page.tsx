import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';
import QuestionsClient from './QuestionsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Ngân hàng câu hỏi | My Space Tests',
};

export default async function QuestionsPage({
	searchParams,
}: {
	searchParams: Promise<{ subjectId?: string; topic?: string; q?: string }>;
}) {
	const sp = await searchParams;
	const [{ items, total }, meta] = await Promise.all([
		myspaceTestsService.listQuestions({
			subjectId: sp.subjectId,
			topic: sp.topic,
			q: sp.q,
			take: 100,
		}),
		myspaceTestsService.getFilterMeta(),
	]);

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<AdminPageHeader
				eyebrow="My Space Tests"
				title="Ngân hàng câu hỏi"
				description={`${total} câu`}
				actions={
					<div className="flex flex-wrap gap-2">
						<Link
							href={routes.admin.myspaceQuestionsImport}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider"
						>
							Import
						</Link>
						<Link
							href={routes.admin.myspaceTests}
							className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider"
						>
							← Bài test
						</Link>
					</div>
				}
			/>

			<QuestionsClient
				initialItems={items}
				subjects={meta.subjects}
				topicsBySubjectId={meta.topicsBySubjectId}
				initialSubjectId={sp.subjectId ?? ''}
				initialTopic={sp.topic ?? ''}
				initialQ={sp.q ?? ''}
			/>
		</div>
	);
}
