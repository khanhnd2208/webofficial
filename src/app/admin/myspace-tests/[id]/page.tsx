import Link from 'next/link';
import { notFound } from 'next/navigation';

import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';
import SpaceTestForm from '../SpaceTestForm';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Sửa bài test | My Space Tests',
};

export default async function EditSpaceTestPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let test;
	try {
		test = await myspaceTestsService.getAdminTest(id);
	} catch {
		notFound();
	}

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space Tests</p>
			<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{test.title}</h1>
			<p className="mt-2 text-sm text-muted">
				{test.attachedQuestionCount} câu hỏi gắn · {test.questionCount} câu mỗi lần làm
			</p>
			{test.status === 'PUBLISHED' ? (
				<p className="mt-1 text-sm text-muted">
					Public:{' '}
					<Link href={routes.mySpaceTestPlay(test.slug)} className="underline underline-offset-2">
						{routes.mySpaceTestPlay(test.slug)}
					</Link>
				</p>
			) : null}
			<SpaceTestForm initial={test} />
		</div>
	);
}
