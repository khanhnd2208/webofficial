import { redirect } from 'next/navigation';
import { routes } from '@/config/routes';

export default async function AdminCourseIndexPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	redirect(routes.admin.myClassCourseOverview(id));
}
