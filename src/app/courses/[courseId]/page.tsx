import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { listLessons } from '@/services/lessonService';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
	const { courseId } = await params;
	const course = await getCourseById(courseId);
	if (!course) notFound();

	const courseUnits = await listCourseUnits({ courseId: course.id });
	
	// Get lesson counts per unit
	const unitIdsInCourse = new Set(courseUnits.map((cu) => cu.unitId));
	const allLessonsResponse = await listLessons({ page: 1, limit: 500 });
	const lessonCountByUnitId = new Map<string, number>();
	for (const lesson of allLessonsResponse.items) {
		if (!lesson.unitId || !unitIdsInCourse.has(lesson.unitId)) continue;
		lessonCountByUnitId.set(lesson.unitId, (lessonCountByUnitId.get(lesson.unitId) ?? 0) + 1);
	}

	return (
		<main className="mx-auto max-w-5xl px-6 py-12">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-foreground/60">
				<Link className="hover:text-foreground" href="/courses">Khóa học</Link>
				<span>/</span>
				<span className="text-foreground">{course.name}</span>
			</nav>

			<header className="mt-6 space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
						{course.description ? (
							<p className="mt-2 text-foreground/70">{course.description}</p>
						) : null}
					</div>
				</div>
				
				{/* Course stats */}
				<div className="flex flex-wrap gap-3 text-sm">
					<div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
						<span className="text-lg">📂</span>
						<span className="font-medium">{courseUnits.length}</span>
						<span className="text-foreground/60">chương</span>
					</div>
					<div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
						<span className="text-lg">📝</span>
						<span className="font-medium">{allLessonsResponse.items.filter(l => l.unitId && unitIdsInCourse.has(l.unitId)).length}</span>
						<span className="text-foreground/60">bài học</span>
					</div>
				</div>
			</header>

			<section className="mt-10">
				<h2 className="text-xl font-semibold">📚 Nội dung khóa học</h2>
				{courseUnits.length === 0 ? (
					<div className="mt-6 rounded-xl border-2 border-dashed border-foreground/10 p-8 text-center">
						<div className="text-3xl">📭</div>
						<p className="mt-3 text-sm text-foreground/70">Khóa học này chưa có chương nào.</p>
					</div>
				) : (
					<div className="mt-6 space-y-3">
						{courseUnits
							.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
							.map((cu, index) => {
								const lessonCount = lessonCountByUnitId.get(cu.unitId) ?? 0;
								return (
									<Link
										key={cu.id}
										href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(cu.unitId)}`}
										className="group block rounded-xl border border-foreground/10 bg-gradient-to-r from-foreground/[0.02] to-transparent p-5 transition-all hover:border-foreground/20 hover:shadow-md"
									>
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-4">
												<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-lg font-bold text-blue-600 dark:text-blue-400">
													{index + 1}
												</div>
												<div>
													<h3 className="font-semibold group-hover:text-blue-600 transition-colors">{cu.unit.name}</h3>
													<p className="mt-0.5 text-xs text-foreground/60">
														{lessonCount > 0 ? `${lessonCount} bài học` : 'Chưa có bài học'}
													</p>
												</div>
											</div>
											<div className="text-foreground/40 group-hover:text-foreground/60 transition-colors">
												→
											</div>
										</div>
									</Link>
								);
							})}
					</div>
				)}
			</section>
		</main>
	);
}
