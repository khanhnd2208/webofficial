import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

/** The signed-in course list moved to /khoa-hoc; old links and bookmarks land there. */
export default async function LegacyCourseListPage({
	searchParams,
}: {
	searchParams: Promise<{ xem?: string }>;
}) {
	const { xem } = await searchParams;
	redirect(xem === 'quan-ly' ? routes.myCoursesManage : routes.learnCourses);
}
