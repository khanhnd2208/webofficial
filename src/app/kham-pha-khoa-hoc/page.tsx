import type { Metadata } from 'next';

import DiscoverCourseList from '@/components/learn/DiscoverCourseList';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { listPublishedCoursePreviews } from '@/features/learn/publicCatalog';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Khám phá khóa học',
	description:
		'Xem trước các khóa học của Duy Khánh, nội dung và hành trình học trước khi bắt đầu.',
	alternates: { canonical: absoluteUrl(routes.discoverCourses) },
	openGraph: {
		title: 'Khám phá khóa học cùng Duy Khánh',
		description: 'Xem chương trình trước, chọn điều bạn muốn học, bắt đầu theo nhịp của bạn.',
		url: absoluteUrl(routes.discoverCourses),
	},
	twitter: {
		card: 'summary_large_image',
		images: [absoluteUrl(`${routes.discoverCourses}/opengraph-image`)],
	},
};

export default async function DiscoverCoursesPage() {
	const [courses, session] = await Promise.all([listPublishedCoursePreviews(), auth()]);
	return <DiscoverCourseList courses={courses} signedIn={Boolean(session?.user)} />;
}
