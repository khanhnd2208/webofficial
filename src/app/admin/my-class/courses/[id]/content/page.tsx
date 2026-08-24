import { getAdminCourse } from '@/features/my-class';
import CourseContentWorkspace from '@/components/myclass/admin/CourseContentWorkspace';

export const dynamic = 'force-dynamic';

export default async function ContentPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ node?: string }>;
}) {
	const { id } = await params;
	const { node } = await searchParams;
	const course = await getAdminCourse(id);
	return <CourseContentWorkspace initial={course} node={node ?? null} />;
}
