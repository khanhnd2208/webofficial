import type { Metadata } from 'next';

import SubjectExplorer from '@/components/myspace/tests/SubjectExplorer';
import { myspaceTestsService } from '@/features/myspace-tests';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Tests | My Space',
	description: 'Practice tests in My Space — pick a subject, choose a test, start.',
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
						Pick a subject, then a test. Answers are checked as you go.
					</p>
				</header>

				<SubjectExplorer groups={groups} />
			</div>
		</main>
	);
}
