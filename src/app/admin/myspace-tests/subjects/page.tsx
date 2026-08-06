import Link from 'next/link';

import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';
import SubjectsClient from './SubjectsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Môn học | My Space Tests',
};

export default async function SubjectsPage() {
	const subjects = await myspaceTestsService.listSubjects();

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space Tests</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Môn học</h1>
					<p className="mt-2 text-sm text-muted">
						Tạo, đổi tên hoặc xóa môn. Không xóa được môn đang có bài test.
					</p>
				</div>
				<Link
					href={routes.admin.myspaceTests}
					className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider"
				>
					← Bài test
				</Link>
			</div>

			<SubjectsClient initial={subjects} />
		</div>
	);
}
