'use client';

import { useEffect, useMemo, useState } from 'react';
import { routes } from '@/config/routes';
import type { MyClassCourseCard, MyClassProgressCourseSummary } from '@/features/my-class/types';
import { McCourseRow } from '@/components/myclass/ui';

export default function MyClassHomeCards({ courses }: { courses: MyClassCourseCard[] }) {
	const [rows, setRows] = useState<MyClassProgressCourseSummary[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		void fetch('/api/my-class/progress')
			.then(async (response) => {
				if (!response.ok) throw new Error('Không tải được tiến độ');
				const json = (await response.json()) as {
					data: { courses: MyClassProgressCourseSummary[] };
				};
				if (!cancelled) setRows(json.data.courses);
			})
			.catch(() => {
				if (!cancelled) setRows([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const bySlug = useMemo(() => new Map((rows ?? []).map((row) => [row.courseSlug, row])), [rows]);

	return (
		<section aria-labelledby="course-catalog-title" className="mt-8">
			<p id="course-catalog-title" className="mc-meta">
				<span className="mc-num">{courses.length}</span> khóa học
			</p>
			<div className="mc-course-grid mt-4">
				{courses.map((course) => {
					const row = bySlug.get(course.slug);
					const href =
						row?.resumeItem?.href ??
						row?.currentItem?.href ??
						course.firstUnitHref ??
						routes.myClassCourse(course.slug);
					return (
						<McCourseRow
							key={course.id}
							course={course}
							href={href}
							percent={row?.percent ?? 0}
							progressLoading={rows === null}
						/>
					);
				})}
			</div>
		</section>
	);
}
