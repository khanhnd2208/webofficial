import Link from 'next/link';
import { getAdminCourse } from '@/features/my-class';
import { routes } from '@/config/routes';
import type { ReactNode } from 'react';
import AdminCourseTabs from '@/components/myclass/admin/AdminCourseTabs';
import { StudioStatus } from '@/components/myclass/admin/studio';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function AdminCourseLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	let course;
	try {
		course = await getAdminCourse(id);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassCourses}
				className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary hover:text-ink"
			>
				← Khóa học
			</Link>
			<div className="mt-3 flex flex-wrap items-end justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="mc-title text-[clamp(1.5rem,2.5vw,2rem)]">{course.title}</h1>
						<StudioStatus status={course.status} />
					</div>
					<p className="mc-meta mt-2">/{course.slug}</p>
				</div>
				<Link
					href={routes.myClassCourse(course.slug)}
					target="_blank"
					rel="noreferrer"
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-4 text-sm font-semibold hover:bg-surface-sunken"
				>
					Xem như học viên ↗
				</Link>
			</div>
			<AdminCourseTabs courseId={course.id} />
			<div className="mt-8">{children}</div>
		</div>
	);
}
