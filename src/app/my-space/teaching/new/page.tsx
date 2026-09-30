import { NewTeachingClassWorkspace } from '@/components/teaching/admin/NewTeachingClassWorkspace';
import { listTeachingCourses, listTeachingTerms } from '@/features/teaching';

export const dynamic = 'force-dynamic';

export default async function MySpaceNewTeachingClassPage({
	searchParams,
}: {
	searchParams: Promise<{ courseId?: string }>;
}) {
	const { courseId } = await searchParams;
	const [courses, termSuggestions] = await Promise.all([
		listTeachingCourses(),
		listTeachingTerms(),
	]);
	return (
		<div className="py-6 sm:py-8">
			<NewTeachingClassWorkspace
				courses={courses}
				initialCourseId={courses.some((course) => course.id === courseId) ? courseId : undefined}
				termSuggestions={termSuggestions}
			/>
		</div>
	);
}
