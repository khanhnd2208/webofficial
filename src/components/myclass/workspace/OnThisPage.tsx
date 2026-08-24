'use client';

import type { MyClassTestListItem } from '@/features/my-class/types';
import type { StoredTestScore } from '@/features/my-class/client/testScoreStore';
import { formatDuration } from '@/features/my-class/domain/estimateReading';
import { outlineTestKey, testsForOutline } from '@/features/my-class/domain/outlineTests';
import TestEntryCard from '@/components/myclass/TestEntryCard';

export default function OnThisPage({
	courseSlug,
	sectionTests,
	testScores,
	onOpenTest,
	estimatedMinutes,
}: {
	courseSlug: string;
	sectionTests: MyClassTestListItem[];
	testScores?: Record<string, StoredTestScore>;
	onOpenTest: (test: MyClassTestListItem) => void;
	estimatedMinutes?: number | null;
}) {
	const visibleTests = testsForOutline(sectionTests, 'SECTION');
	const hasTests = visibleTests.length > 0;
	const hasTime = estimatedMinutes != null;
	if (!hasTests && !hasTime) return null;

	return (
		<aside data-testid="my-class-on-this-page" className="space-y-4 pt-2">
			{hasTime ? <p className="mc-meta">{formatDuration(estimatedMinutes)}</p> : null}

			{hasTests ? (
				<section>
					<h3 className="mc-eyebrow mb-4 font-bold tracking-wider">Kiểm tra</h3>
					<div className="space-y-3">
						{visibleTests.map((test) => (
							<TestEntryCard
								key={outlineTestKey(test)}
								courseSlug={courseSlug}
								test={test}
								score={testScores?.[test.slug]}
								onOpen={onOpenTest}
							/>
						))}
					</div>
				</section>
			) : null}
		</aside>
	);
}
