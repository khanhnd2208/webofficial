import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import LearnStudio from '@/components/learn/studio/LearnStudio';
import { routes } from '@/config/routes';
import { getLearnStudioCourse } from '@/features/learn/service';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Soạn khóa học',
	robots: { index: false },
};

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ s?: string | string[] }>;
};

export default async function LearnStudioPage({ params, searchParams }: Props) {
	const [{ slug }, query, session] = await Promise.all([params, searchParams, auth()]);
	if (session?.user?.role !== 'admin') redirect(routes.learnCourse(slug));

	const course = await getLearnStudioCourse(slug);
	if (!course) notFound();

	return (
		<LearnStudio course={course} initialSectionId={typeof query.s === 'string' ? query.s : null} />
	);
}
