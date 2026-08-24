import Link from 'next/link';
import { listAdminCourseOptions, unwrapItems } from '@/features/my-class';
import { routes } from '@/config/routes';
import NewCohortForm from './NewCohortForm';

export const dynamic = 'force-dynamic';

export default async function NewCohortPage() {
	const courses = unwrapItems(await listAdminCourseOptions());
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link href={routes.admin.myClassCohorts} className="text-xs uppercase tracking-widest text-muted">← Nhóm học</Link>
			<h1 className="mt-6 text-2xl font-black">Tạo nhóm học</h1>
			<NewCohortForm courses={courses.map((item) => ({ id: item.id, title: item.title }))} />
		</div>
	);
}
