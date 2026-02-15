import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from '@/components/CodeBlock';
import CourseSidebar from '@/components/CourseSidebar';
import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { getLessonById, listLessons } from '@/services/lessonService';
import { listLessonVocabulary } from '@/services/lessonVocabularyService';

export const dynamic = 'force-dynamic';

export default async function CourseLessonPage({
	params,
}: {
	params: Promise<{ courseId: string; unitId: string; lessonId: string }>;
}) {
	const { courseId, unitId, lessonId } = await params;

	const [course, lesson, vocabulary] = await Promise.all([
		getCourseById(courseId),
		getLessonById(lessonId),
		listLessonVocabulary(lessonId),
	]);
	if (!course || !lesson) notFound();

	// Build sidebar data: all units + their lessons
	const courseUnits = await listCourseUnits({ courseId: course.id });
	const sortedUnits = [...courseUnits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const sidebarData: {
		unitId: string;
		unitName: string;
		lessons: { id: string; title: string; vocabularyCount: number }[];
	}[] = [];

	for (const cu of sortedUnits) {
		const res = await listLessons({ unitId: cu.unitId, page: 1, limit: 50 });
		sidebarData.push({
			unitId: cu.unitId,
			unitName: cu.unit.name,
			lessons: res.items.map((l) => ({ id: l.id, title: l.title, vocabularyCount: l.vocabularyCount })),
		});
	}

	// Find prev/next lesson across units
	const allLessonsFlat = sidebarData.flatMap((u) =>
		u.lessons.map((l) => ({ ...l, unitId: u.unitId })),
	);
	const currentIdx = allLessonsFlat.findIndex((l) => l.id === lessonId);
	const prevLesson = currentIdx > 0 ? allLessonsFlat[currentIdx - 1] : null;
	const nextLesson = currentIdx < allLessonsFlat.length - 1 ? allLessonsFlat[currentIdx + 1] : null;

	return (
		<div className="flex min-h-screen bg-background-secondary">
			{/* Sidebar */}
			<CourseSidebar
				courseId={course.id}
				courseName={course.name}
				units={sidebarData}
				currentUnitId={unitId}
				currentLessonId={lessonId}
			/>

			{/* Main content */}
			<main className="min-w-0 flex-1">
				<div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
					{/* Breadcrumbs */}
					<nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
						<Link className="transition-colors hover:text-foreground" href="/courses">
							Khoá học
						</Link>
						<span>/</span>
						<Link
							className="transition-colors hover:text-foreground"
							href={`/courses/${encodeURIComponent(course.id)}`}
						>
							{course.name}
						</Link>
						<span>/</span>
						<span className="text-foreground-secondary">{lesson.title}</span>
					</nav>

					{/* Lesson header */}
					<header className="mt-6">
						<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
						{vocabulary.length > 0 ? (
							<div className="mt-3">
								<span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-3 py-1 text-xs font-semibold text-success">
									<svg
										className="h-3 w-3"
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
									{vocabulary.length} từ vựng
								</span>
							</div>
						) : null}
					</header>

					{/* Lesson content */}
					{lesson.content.trim() ? (
						<article className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-accent hover:prose-a:text-accent-hover prose-img:rounded-xl prose-blockquote:border-l-accent mt-8 max-w-none">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									img: (props) => {
										const src = typeof props.src === 'string' ? props.src.trim() : '';
										if (!src) return null;
										return (
											<img
												{...props}
												src={src}
												alt={props.alt ?? ''}
												className="rounded-xl border border-border shadow-sm"
												loading="lazy"
											/>
										);
									},
									pre: (props) => <CodeBlock {...props} />,
								}}
							>
								{lesson.content}
							</ReactMarkdown>
						</article>
					) : null}

					{/* Vocabulary section */}
					{vocabulary.length > 0 ? (
						<section className="mt-14">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<h2 className="text-xl font-bold">Từ vựng</h2>
								<div className="flex flex-wrap items-center gap-2">
									<Link
										className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
										href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}/flashcards`}
									>
										<svg
											className="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											/>
										</svg>
										Flashcards
									</Link>
									<Link
										className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3.5 py-2 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-surface-active"
										href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}/mcq`}
									>
										<svg
											className="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
											/>
										</svg>
										Trắc nghiệm
									</Link>
									<Link
										className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3.5 py-2 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-surface-active"
										href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}/fill-blank`}
									>
										<svg
											className="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Điền từ
									</Link>
								</div>
							</div>

							<div className="mt-4 overflow-hidden rounded-xl border border-border shadow-sm">
								<table className="min-w-full">
									<thead className="bg-surface-hover/60">
										<tr>
											<th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
												Word
											</th>
											<th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted sm:table-cell">
												POS
											</th>
											<th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
												Nghĩa (VI)
											</th>
											<th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted md:table-cell">
												Meaning (EN)
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border/60">
										{vocabulary.map((v, i) => (
											<tr key={v.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-secondary/40'}>
												<td className="px-4 py-2.5 text-sm font-semibold">{v.word}</td>
												<td className="hidden px-4 py-2.5 text-xs text-muted sm:table-cell">
													{v.partOfSpeech || '—'}
												</td>
												<td className="px-4 py-2.5 text-sm">{v.meaningVi}</td>
												<td className="hidden px-4 py-2.5 text-sm text-foreground-secondary md:table-cell">
													{v.meaningEn}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					) : null}

					{/* Prev / Next navigation */}
					<nav className="mt-14 flex items-stretch justify-between gap-4 border-t border-border pt-8">
						<div className="flex-1">
							{prevLesson ? (
								<Link
									href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(prevLesson.unitId)}/lessons/${encodeURIComponent(prevLesson.id)}`}
									className="group flex h-full flex-col items-start rounded-xl border border-border p-4 transition-all hover:border-accent hover:shadow-sm"
								>
									<span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
										← Bài trước
									</span>
									<span className="mt-1.5 text-sm font-semibold group-hover:text-accent">
										{prevLesson.title}
									</span>
								</Link>
							) : (
								<div />
							)}
						</div>
						<div className="flex-1 text-right">
							{nextLesson ? (
								<Link
									href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(nextLesson.unitId)}/lessons/${encodeURIComponent(nextLesson.id)}`}
									className="group flex h-full flex-col items-end rounded-xl border border-border p-4 transition-all hover:border-accent hover:shadow-sm"
								>
									<span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
										Bài tiếp theo →
									</span>
									<span className="mt-1.5 text-sm font-semibold group-hover:text-accent">
										{nextLesson.title}
									</span>
								</Link>
							) : (
								<div />
							)}
						</div>
					</nav>
				</div>
			</main>
		</div>
	);
}
