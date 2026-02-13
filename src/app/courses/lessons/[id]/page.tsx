import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from '@/components/CodeBlock';
import LessonNavigation from '@/components/LessonNavigation';
import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { getLessonById } from '@/services/lessonService';
import { listLessonVocabulary } from '@/services/lessonVocabularyService';
import { getUnitById } from '@/services/unitService';

export const dynamic = 'force-dynamic';

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const lesson = await getLessonById(id);
	if (!lesson) notFound();

	const vocabulary = await listLessonVocabulary(lesson.id);
	
	// Get breadcrumb info
	const unit = lesson.unitId ? await getUnitById(lesson.unitId) : null;
	let course = null;
	if (unit) {
		const allCourseUnits = await listCourseUnits({});
		const courseUnit = allCourseUnits.find((cu) => cu.unitId === unit.id);
		if (courseUnit) {
			course = await getCourseById(courseUnit.courseId);
		}
	}

	return (
		<main className="mx-auto max-w-4xl px-6 py-12">
			{/* Breadcrumbs */}
			{course && unit ? (
				<nav className="flex items-center gap-2 text-sm text-foreground/60">
					<Link className="hover:text-foreground" href="/courses">Khóa học</Link>
					<span>/</span>
					<Link className="hover:text-foreground" href={`/courses/${encodeURIComponent(course.id)}`}>
						{course.name}
					</Link>
					<span>/</span>
					<Link className="hover:text-foreground" href={`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(unit.id)}`}>
						{unit.name}
					</Link>
					<span>/</span>
					<span className="text-foreground">{lesson.title}</span>
				</nav>
			) : (
				<nav className="flex items-center gap-2 text-sm text-foreground/60">
					<Link className="hover:text-foreground" href="/dashboard">Dashboard</Link>
					<span>/</span>
					<span className="text-foreground">{lesson.title}</span>
				</nav>
			)}

			<header className="mt-6">
				<h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
				{vocabulary.length > 0 ? (
					<div className="mt-3 flex items-center gap-2 text-sm">
						<span className="rounded-full bg-green-500/10 px-3 py-1 text-green-700 dark:text-green-300">
							📖 {vocabulary.length} từ vựng
						</span>
					</div>
				) : null}
			</header>

			{/* Lesson content */}
			<article className="prose prose-lg prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700 mt-8 max-w-none">
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
									className="rounded-xl border border-foreground/10 shadow-sm"
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

			{/* Vocabulary section */}
			<section className="mt-16">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-2xl font-bold">📚 Từ vựng</h2>
					{vocabulary.length > 0 ? (
						<div className="flex flex-wrap items-center gap-2">
							<Link 
								className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-500/20 dark:text-blue-300 transition-colors" 
								href={`/courses/lessons/${lesson.id}/flashcards`}
							>
								🎴 Flashcards
							</Link>
							<Link 
								className="rounded-full bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-500/20 dark:text-purple-300 transition-colors" 
								href={`/courses/lessons/${lesson.id}/dictation`}
							>
								✍️ Dictation
							</Link>
						</div>
					) : null}
				</div>

				{vocabulary.length === 0 ? (
					<div className="mt-6 rounded-xl border-2 border-dashed border-foreground/10 p-8 text-center">
						<div className="text-3xl">📭</div>
						<p className="mt-3 text-sm text-foreground/70">Bài học này chưa có từ vựng.</p>
					</div>
				) : (
					<div className="mt-6 overflow-hidden rounded-xl border border-foreground/10 shadow-sm">
						<table className="min-w-full">
							<thead className="bg-gradient-to-r from-foreground/[0.08] to-foreground/[0.04]">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Word</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">POS</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Nghĩa (VI)</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Meaning (EN)</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-foreground/10">
								{vocabulary.map((v, index) => (
									<tr key={v.id} className={index % 2 === 0 ? 'bg-foreground/[0.02]' : 'bg-transparent'}>
										<td className="px-4 py-3 text-sm font-semibold">{v.word}</td>
										<td className="px-4 py-3 text-xs text-foreground/60">{v.partOfSpeech || '—'}</td>
										<td className="px-4 py-3 text-sm">{v.meaningVi}</td>
										<td className="px-4 py-3 text-sm text-foreground/70">{v.meaningEn}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Lesson Navigation */}
			{course && unit ? (
				<LessonNavigation courseId={course.id} unitId={unit.id} currentLessonId={lesson.id} />
			) : null}
		</main>
	);
}
