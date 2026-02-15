import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { listLessons } from '@/services/lessonService';

export const dynamic = 'force-dynamic';

type LessonBrief = { id: string; title: string; vocabularyCount: number };

export default async function CourseDetailPage({
	params,
}: {
	params: Promise<{ courseId: string }>;
}) {
	const { courseId } = await params;
	const course = await getCourseById(courseId);
	if (!course) notFound();

	const courseUnits = await listCourseUnits({ courseId: course.id });
	const sortedUnits = [...courseUnits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	// Fetch lessons per unit (parallel, only for this course's units)
	const lessonsByUnit = new Map<string, LessonBrief[]>();
	await Promise.all(
		sortedUnits.map(async (cu) => {
			const res = await listLessons({ unitId: cu.unitId, page: 1, limit: 100 });
			lessonsByUnit.set(
				cu.unitId,
				res.items.map((l) => ({ id: l.id, title: l.title, vocabularyCount: l.vocabularyCount })),
			);
		}),
	);

	const totalLessons = Array.from(lessonsByUnit.values()).reduce((s, a) => s + a.length, 0);
	const totalVocab = Array.from(lessonsByUnit.values())
		.flat()
		.reduce((s, l) => s + (l.vocabularyCount ?? 0), 0);

	return (
		<main className="min-h-screen bg-background-secondary">
			<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
				{/* Breadcrumbs */}
				<nav className="flex items-center gap-2 text-xs font-medium text-muted">
					<Link className="transition-colors hover:text-foreground" href="/courses">
						Khoá học
					</Link>
					<span className="text-border-strong">/</span>
					<span className="text-foreground-secondary">{course.name}</span>
				</nav>

				{/* Header */}
				<header className="mt-6">
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.name}</h1>
					{course.description ? (
						<p className="mt-2 max-w-2xl text-foreground-secondary">{course.description}</p>
					) : null}

					<div className="mt-4 flex flex-wrap gap-2 text-sm">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-medium text-foreground-secondary">
							<svg
								className="h-3.5 w-3.5 text-accent"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								/>
							</svg>
							{sortedUnits.length} chương
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-medium text-foreground-secondary">
							<svg
								className="h-3.5 w-3.5 text-success"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							{totalLessons} bài học
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-medium text-foreground-secondary">
							<svg
								className="h-3.5 w-3.5 text-warning"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
							{totalVocab} từ vựng
						</span>
					</div>
				</header>

				{/* Units */}
				<section className="mt-10 space-y-4">
					{sortedUnits.length === 0 ? (
						<div className="rounded-xl border-2 border-dashed border-border bg-surface p-10 text-center">
							<p className="text-sm text-foreground-secondary">Khoá học này chưa có nội dung.</p>
						</div>
					) : (
						sortedUnits.map((cu, unitIndex) => {
							const lessons = lessonsByUnit.get(cu.unitId) ?? [];
							const firstLessonId = lessons[0]?.id;

							return (
								<div
									key={cu.id}
									className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
								>
									{/* Unit header */}
									<div className="flex items-center gap-4 border-b border-border bg-linear-to-r from-surface-hover/60 to-transparent px-5 py-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
											{unitIndex + 1}
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="truncate text-base font-semibold">{cu.unit.name}</h3>
											<p className="mt-0.5 text-xs text-muted">
												{lessons.length} bài học · {lessons.reduce((s, l) => s + l.vocabularyCount, 0)}{' '}
												từ vựng
											</p>
										</div>
										{firstLessonId ? (
											<Link
												href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(cu.unitId)}/lessons/${encodeURIComponent(firstLessonId)}`}
												className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
											>
												Bắt đầu →
											</Link>
										) : null}
									</div>

									{/* Lessons list */}
									{lessons.length > 0 ? (
										<ul className="divide-y divide-border/60">
											{lessons.map((l, lessonIdx) => (
												<li key={l.id}>
													<Link
														href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(cu.unitId)}/lessons/${encodeURIComponent(l.id)}`}
														className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-hover"
													>
														<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-muted group-hover:bg-accent-subtle group-hover:text-accent">
															{lessonIdx + 1}
														</span>
														<span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-accent">
															{l.title}
														</span>
														{l.vocabularyCount > 0 ? (
															<span className="shrink-0 rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-semibold text-success">
																{l.vocabularyCount} từ
															</span>
														) : null}
														<svg
															className="h-4 w-4 shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth={2}
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M9 5l7 7-7 7"
															/>
														</svg>
													</Link>
												</li>
											))}
										</ul>
									) : (
										<div className="px-5 py-6 text-center text-xs text-muted">
											Chưa có bài học
										</div>
									)}
								</div>
							);
						})
					)}
				</section>
			</div>
		</main>
	);
}
