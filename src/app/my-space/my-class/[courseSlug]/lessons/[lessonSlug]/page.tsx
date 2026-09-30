import { redirect } from 'next/navigation';
import { getLesson } from '@/features/my-class';
import { routes } from '@/config/routes';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export default async function MyClassLessonRedirectPage({
	params,
}: {
	params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
	const { courseSlug, lessonSlug } = await params;
	try {
		const data = await getLesson(courseSlug, lessonSlug);
		const first = data.lesson.sections.flatMap((section) => section.knowledgeUnits)[0];
		if (first)
			redirect(
				routes.myClassUnit(courseSlug, lessonSlug, first.slug, {
					sectionSlug: data.lesson.sections.find((section) =>
						section.knowledgeUnits.some((unit) => unit.slug === first.slug),
					)?.slug,
				}),
			);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	redirect(routes.myClassCourse(courseSlug));
}
