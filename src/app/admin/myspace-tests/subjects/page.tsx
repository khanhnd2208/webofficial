import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
			<AdminPageHeader
				eyebrow="My Space Tests"
				title="Môn học"
				description="Tạo, đổi tên hoặc xóa môn. Không xóa được môn đang có bài test."
				actions={
					<Link
						href={routes.admin.myspaceTests}
						className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider"
					>
						← Bài test
					</Link>
				}
			/>

			<SubjectsClient initial={subjects} />
		</div>
	);
}
