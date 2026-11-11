import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import DiscoverCourseList from '@/components/learn/DiscoverCourseList';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { listPublishedCoursePreviews } from '@/features/learn/publicCatalog';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khóa học',
	description:
		'Xem trước các khóa học của Duy Khánh, nội dung và hành trình học trước khi bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.learnCourses) },
	openGraph: {
		title: 'Khám phá khóa học cùng Duy Khánh',
		description: 'Xem chương trình trước, chọn điều bạn muốn học, bắt đầu theo nhịp của bạn.',
		url: absoluteUrl(routes.learnCourses),
	},
	twitter: {
		card: 'summary_large_image',
		images: [absoluteUrl(`${routes.learnCourses}/opengraph-image`)],
	},
};

/** The one course address: guests browse the catalog, a signed-in visitor goes to their list. */
export default async function CoursesPage() {
	const session = await auth();
	if (session?.user) redirect(routes.myCourses);
	const courses = await listPublishedCoursePreviews();
	return <DiscoverCourseList courses={courses} />;
}
