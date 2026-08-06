import Link from 'next/link';

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
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space Tests</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
						Ngân hàng câu hỏi
					</h1>
					<p className="mt-2 text-sm text-muted">{total} câu</p>
				</div>
				<div className="flex gap-2">
					<Link
						href={routes.admin.myspaceQuestionsImport}
						className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider"
					>
						Import
					</Link>
					<Link
						href={routes.admin.myspaceTests}
						className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider"
					>
						← Bài test
					</Link>
				</div>
			</div>

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
