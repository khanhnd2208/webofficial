import Link from 'next/link';

import { routes } from '@/config/routes';
import { percentOf } from '@/features/learn/progress';
import type { LearnCourseListItem } from '@/features/learn/types';

/** The course this learner touched last that still has an unfinished section. */
export function pickResumeCourse(courses: LearnCourseListItem[]): LearnCourseListItem | null {
	return (
		courses
			.filter((course) => course.lastActivityAt && course.nextSectionId)
			.sort((a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? ''))[0] ?? null
	);
}

/** "Tiếp tục nơi bạn dừng lại": one course, its progress, and a button straight to the next part. */
export default function CourseResume({ course }: { course: LearnCourseListItem }) {
	const percent = percentOf(course.completedCount, course.sectionCount);
	return (
		<section
			aria-label="Tiếp tục học"
			data-testid="course-resume"
			className="mt-8 flex flex-col gap-4 rounded-2xl border border-hairline bg-paper p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
		>
			<div className="min-w-0">
				<p className="editorial-label">Tiếp tục nơi bạn dừng lại</p>
				<h2 className="mt-2 font-display text-title-3 leading-tight break-words">{course.title}</h2>
				<div className="mt-3 flex items-center gap-3 text-subhead text-ink-secondary">
					<span className="h-1 w-40 overflow-hidden rounded-full bg-hairline" aria-hidden="true">
						<span
							className="block h-full rounded-full bg-accent"
							style={{ width: `${percent}%` }}
						/>
					</span>
					<span className="tabular-nums">
						{course.completedCount}/{course.sectionCount} · {percent}%
					</span>
				</div>
			</div>
			<Link
				href={routes.learnCourse(course.slug, course.nextSectionId)}
				className="editorial-button editorial-button-dark shrink-0"
			>
				Học tiếp
			</Link>
		</section>
	);
}
