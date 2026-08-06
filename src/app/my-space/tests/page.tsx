import Link from 'next/link';
import type { Metadata } from 'next';

import SubjectExplorer from '@/components/myspace/tests/SubjectExplorer';
import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Tests | My Space',
	description: 'Bài kiểm tra trắc nghiệm trong My Space — chọn môn, chọn bài, làm bài.',
};

export default async function MySpaceTestsPage() {
	const groups = await myspaceTestsService.listPublishedTestsGrouped();

	return (
		<main
			className="min-h-svh bg-canvas pt-20 pb-24 sm:pt-24 sm:pb-28"
			data-testid="myspace-tests"
		>
			<div className="shell">
				<header className="max-w-[42rem] border-t border-hairline pt-6">
					<p className="font-mono text-[0.75rem] tracking-[0.14em] text-ink-secondary uppercase">
						My Space
					</p>
					<h1 className="mt-5 font-display text-[clamp(2rem,5vw,2.75rem)] font-medium tracking-tight text-ink">
						Tests
					</h1>
					<p className="mt-4 text-base leading-[1.7] text-ink-secondary">
						Chọn môn học, rồi chọn bài test. Câu hỏi lấy ngẫu nhiên trong bài. Mỗi câu
						báo đúng/sai ngay — đáp án đã chọn không đổi được.
					</p>
				</header>

				<SubjectExplorer groups={groups} />

				<Link
					href={routes.mySpace}
					className="mt-12 inline-block font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
				>
					← My Space
				</Link>
			</div>
		</main>
	);
}
