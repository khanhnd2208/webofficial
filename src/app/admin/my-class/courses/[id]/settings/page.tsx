import { getAdminCourse } from '@/features/my-class';
import CourseSettingsForm from '@/components/myclass/admin/CourseSettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const course = await getAdminCourse(id);
	return <CourseSettingsForm course={course} />;
}
