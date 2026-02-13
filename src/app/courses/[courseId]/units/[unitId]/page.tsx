import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { listLessons } from '@/services/lessonService';

export const dynamic = 'force-dynamic';

export default async function UnitDetailPage({
	params,
}: {
	params: Promise<{ courseId: string; unitId: string }>;
}) {
	const { courseId, unitId } = await params;
	const course = await getCourseById(courseId);
	if (!course) notFound();

	const courseUnits = await listCourseUnits({ courseId: course.id });
	const unitRow = courseUnits.find((cu) => cu.unitId === unitId);
	if (!unitRow) notFound();

	const lessons = await listLessons({ unitId, page: 1, limit: 50 });
	const totalVocab = lessons.items.reduce((sum, l) => sum + (l.vocabularyCount ?? 0), 0);

	return (
		<main className="mx-auto max-w-5xl px-6 py-12">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-foreground/60">
				<Link className="hover:text-foreground" href="/courses">Khóa học</Link>
				<span>/</span>
				<Link className="hover:text-foreground" href={`/courses/${encodeURIComponent(course.id)}`}>
					{course.name}
				</Link>
				<span>/</span>
				<span className="text-foreground">{unitRow.unit.name}</span>
			</nav>

			<header className="mt-6 space-y-4">
				<h1 className="text-3xl font-bold tracking-tight">{unitRow.unit.name}</h1>
				
				{/* Unit stats */}
				<div className="flex flex-wrap gap-3 text-sm">
					<div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
						<span className="text-lg">📝</span>
						<span className="font-medium">{lessons.items.length}</span>
						<span className="text-foreground/60">bài học</span>
					</div>
					<div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
						<span className="text-lg">📖</span>
						<span className="font-medium">{totalVocab}</span>
						<span className="text-foreground/60">từ vựng</span>
					</div>
				</div>
			</header>

			<section className="mt-10">
				<h2 className="text-xl font-semibold">📚 Danh sách bài học</h2>
				{lessons.items.length === 0 ? (
					<div className="mt-6 rounded-xl border-2 border-dashed border-foreground/10 p-8 text-center">
						<div className="text-3xl">📭</div>
						<p className="mt-3 text-sm text-foreground/70">Chương này chưa có bài học nào.</p>
					</div>
				) : (
					<div className="mt-6 space-y-4">
						{lessons.items.map((l, index) => (
							<div
								key={l.id}
								className="group rounded-xl border border-foreground/10 bg-gradient-to-r from-foreground/[0.02] to-transparent p-5 transition-all hover:border-foreground/20 hover:shadow-md"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-semibold text-blue-600 dark:text-blue-400">
												{index + 1}
											</div>
											<Link
												href={`/courses/lessons/${encodeURIComponent(l.id)}`}
												className="font-semibold group-hover:text-blue-600 transition-colors"
											>
												{l.title}
											</Link>
										</div>
										
										{l.vocabularyCount > 0 ? (
											<div className="mt-3 flex flex-wrap items-center gap-2">
												<div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-700 dark:text-green-300">
													<span>📖</span>
													<span className="font-medium">{l.vocabularyCount} từ</span>
												</div>
												<Link
													className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-500/20 dark:text-blue-300"
													href={`/courses/lessons/${encodeURIComponent(l.id)}/flashcards`}
												>
													🎴 Flashcards
												</Link>
												<Link
													className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-500/20 dark:text-purple-300"
													href={`/courses/lessons/${encodeURIComponent(l.id)}/dictation`}
												>
													✍️ Dictation
												</Link>
											</div>
										) : (
											<p className="mt-2 text-xs text-foreground/50">Chưa có từ vựng</p>
										)}
									</div>
									
									<Link
										href={`/courses/lessons/${encodeURIComponent(l.id)}`}
										className="rounded-lg bg-foreground/5 px-4 py-2 text-sm font-medium hover:bg-foreground/10 transition-colors"
									>
										Học →
									</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
