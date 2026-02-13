import Link from 'next/link';

import type { AdminLessonListItemDTO } from '@/types/lesson';
import CourseRowActions from '@/app/admin/courses/CourseRowActions';
import CreateCourseInline from '@/app/admin/learning/CreateCourseInline';
import UnitManager from '@/app/admin/learning/UnitManager';
import { listCourseUnits } from '@/services/courseUnitService';
import { listCoursesWithStats } from '@/services/courseService';
import { listLessons } from '@/services/lessonService';

export const dynamic = 'force-dynamic';

type SearchParams = { courseId?: string; unitId?: string };

function buildQuery(params: { courseId?: string; unitId?: string }) {
	const sp = new URLSearchParams();
	if (params.courseId) sp.set('courseId', params.courseId);
	if (params.unitId) sp.set('unitId', params.unitId);
	const q = sp.toString();
	return q ? `?${q}` : '';
}

export default async function AdminLearningPage({
	searchParams,
}: {
	searchParams?: Promise<SearchParams>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const requestedCourseId = typeof sp?.courseId === 'string' ? sp.courseId.trim() : '';
	const requestedUnitId = typeof sp?.unitId === 'string' ? sp.unitId.trim() : '';

	const courses = await listCoursesWithStats();
	const selectedCourseId = requestedCourseId || (courses[0]?.id ?? '');
	const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

	const courseUnits = selectedCourseId ? await listCourseUnits({ courseId: selectedCourseId }) : [];
	
	// Collect all unit IDs in this course
	const unitIdsInCourse = new Set(courseUnits.map((cu) => cu.unitId));
	
	// Load ALL lessons (we'll filter client-side by unitId since API doesn't support filtering by multiple units)
	const allLessonsResponse = await listLessons({ page: 1, limit: 500 });
	
	// Group lessons by unitId, but ONLY include lessons belonging to units in this course
	const lessonsByUnitId = new Map<string, AdminLessonListItemDTO[]>();
	for (const lesson of allLessonsResponse.items) {
		if (!lesson.unitId || !unitIdsInCourse.has(lesson.unitId)) continue;
		const existing = lessonsByUnitId.get(lesson.unitId) ?? [];
		existing.push(lesson);
		lessonsByUnitId.set(lesson.unitId, existing);
	}
	
	const unitById = new Map(courseUnits.map((cu) => [cu.unit.id, cu.unit] as const));
	const requestedUnit = requestedUnitId ? unitById.get(requestedUnitId) ?? null : null;
	const selectedUnitId = requestedUnit?.id || (courseUnits[0]?.unit.id ?? '');

	return (
		<main>
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">Learning</h2>
					<p className="mt-2 text-sm text-foreground/70">Course → Units → Lessons → Vocabulary</p>
				</div>
				<nav className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/admin">
						← Admin
					</Link>
				</nav>
			</header>

			<section className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
				<aside className="rounded-xl border border-foreground/10 p-4">
					<div className="flex items-center justify-between gap-2">
						<div className="text-sm font-medium">Courses</div>
						<span className="text-xs text-foreground/60">Tạo course mới tại đây.</span>
					</div>
					<div className="mt-3">
						<CreateCourseInline />
					</div>

					{courses.length === 0 ? (
						<p className="mt-4 text-sm text-foreground/70">Chưa có course nào.</p>
					) : (
						<nav className="mt-4 space-y-1">
							{courses.map((c) => {
								const active = c.id === selectedCourseId;
								return (
									<div key={c.id} className="rounded-lg">
										<Link
											className={`block rounded-lg border px-3 py-2 transition-colors ${
												active ? 'border-foreground/25 bg-foreground/5' : 'border-foreground/10 hover:bg-foreground/5'
											}`}
											href={`/admin/learning${buildQuery({ courseId: c.id })}`}
										>
											<div className="truncate text-sm font-medium">{c.name}</div>
											<div className="mt-1 text-xs text-foreground/60">
												Lessons: <span className="font-mono">{c.lessonCount}</span>
												<span className="mx-2 text-foreground/30">•</span>
												Vocab: <span className="font-mono">{c.vocabularyCount}</span>
											</div>
										</Link>
									</div>
							);
						})}
						</nav>
					)}
				</aside>

				<section className="rounded-xl border border-foreground/10 p-4">
					{!selectedCourse ? (
						<div>
							<div className="text-sm font-medium">Chưa chọn course</div>
							<p className="mt-2 text-sm text-foreground/70">Tạo course trước để quản lý lessons theo cây thư mục.</p>
						</div>
					) : (
						<>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<div className="text-sm font-medium">Selected course</div>
									<h3 className="mt-1 text-lg font-semibold tracking-tight">{selectedCourse.name}</h3>
									{selectedCourse.description ? (
										<p className="mt-1 text-xs text-foreground/60">{selectedCourse.description}</p>
									) : null}
									<div className="mt-2 text-xs text-foreground/60">
										Lessons: <span className="font-mono">{selectedCourse.lessonCount}</span>
										<span className="mx-2 text-foreground/30">•</span>
										Vocab: <span className="font-mono">{selectedCourse.vocabularyCount}</span>
									</div>
								</div>
								<CourseRowActions course={selectedCourse} />
							</div>

							<div className="mt-6">
								<UnitManager 
									courseId={selectedCourseId} 
									courseUnits={courseUnits} 
									selectedUnitId={selectedUnitId}
									lessonsByUnitId={lessonsByUnitId}
								/>
							</div>
						</>
					)}
				</section>
			</section>
		</main>
	);
}
