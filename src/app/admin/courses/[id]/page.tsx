import Link from 'next/link';
import { notFound } from 'next/navigation';

import { courseService } from '@/features/courses';
import { routes } from '@/config/routes';

import CourseEditor from './CourseEditor';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	let course;
	try {
		course = await courseService.getAdminCourse(id);
	} catch {
		notFound();
	}

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<Link
				href={routes.admin.courses}
				className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground"
			>
				← Khóa học
			</Link>
			<div className="mt-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-black tracking-tight text-foreground">{course.title}</h1>
					<p className="mt-1 text-xs text-muted">/{course.slug}</p>
				</div>
				<Link
					href={`${routes.admin.enrollments}?courseId=${course.id}`}
					className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
				>
					Ghi danh →
				</Link>
			</div>
			<CourseEditor initial={course} />
		</div>
	);
}
