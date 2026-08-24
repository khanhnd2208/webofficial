import { getAdminCourse, listCourseVocabAssignments } from '@/features/my-class';
import VocabAssignmentManager from '@/components/myclass/admin/VocabAssignmentManager';

export const dynamic = 'force-dynamic';

export default async function VocabularyPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [course, assignments] = await Promise.all([getAdminCourse(id), listCourseVocabAssignments(id)]);
	return (
		<VocabAssignmentManager
			courseId={course.id}
			courseTitle={course.title}
			lessons={course.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }))}
			initial={assignments}
		/>
	);
}
