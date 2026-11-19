import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import RecallTestYourself from '@/components/active-recall/test-yourself/RecallTestYourself';
import { routes } from '@/config/routes';
import { getRecallTestForCourse } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

const getSource = cache(getRecallTestForCourse);
type PageProps = {
	params: Promise<{ courseId: string }>;
	searchParams: Promise<{ deck?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const source = await getSource((await params).courseId);
	return {
		title: source ? `Test yourself · ${source.title}` : 'Test yourself',
		robots: { index: false, follow: false },
	};
}

export default async function CourseRecallTestPage({ params, searchParams }: PageProps) {
	const [{ courseId }, { deck }] = await Promise.all([params, searchParams]);
	const source = await getSource(courseId);
	if (!source) notFound();

	return (
		<RecallTestYourself
			title={source.title}
			decks={source.decks}
			initialDeckSlug={typeof deck === 'string' ? deck : undefined}
			backHref={routes.publicCourseRecall(courseId)}
			backLabel="Các bộ thẻ của môn"
		/>
	);
}
