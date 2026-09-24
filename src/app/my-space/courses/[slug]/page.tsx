import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import LearnCheckpointCard from '@/components/learn/LearnCheckpointCard';
import LearnCompleteButton from '@/components/learn/LearnCompleteButton';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import LearnNotes from '@/components/learn/LearnNotes';
import LearnQuizRunner from '@/components/learn/LearnQuizRunner';
import LearnReaderFrame from '@/components/learn/LearnReaderFrame';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { getLearnCourseOutline, getLearnProgress, getLearnReaderSection } from '@/features/learn/service';
import { LEARN_LEVEL_LABELS } from '@/features/learn/types';
import { auth } from '@/lib/auth';

import { learnViewerFrom } from '../viewer';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ s?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const viewer = learnViewerFrom(await auth());
	const course = await getLearnCourseOutline(slug, viewer);
	return { title: course?.title ?? 'Khóa học', robots: { index: false } };
}

export default async function LearnCoursePage({ params, searchParams }: Props) {
	const [{ slug }, query] = await Promise.all([params, searchParams]);
	const viewer = learnViewerFrom(await auth());
	const course = await getLearnCourseOutline(slug, viewer);
	if (!course) notFound();

	const progress = await getLearnProgress(viewer.userId, course.id);
	const flat = course.lessons.flatMap((lesson, lessonIndex) =>
		lesson.sections.map((section, sectionIndex) => ({ ...section, lessonIndex, sectionIndex })),
	);
	const requested = typeof query.s === 'string' ? query.s : undefined;
	const current =
		flat.find((section) => section.id === requested) ??
		flat.find((section) => !progress[section.id]?.completed) ??
		flat[0];
	const position = current ? flat.indexOf(current) : -1;
	const previous = position > 0 ? flat[position - 1] : null;
	const next = position >= 0 && position < flat.length - 1 ? flat[position + 1] : null;
	const section = current ? await getLearnReaderSection(course.id, current.id, viewer.userId) : null;
	const state = section ? progress[section.id] : undefined;

	const completedCount = flat.filter((item) => progress[item.id]?.completed).length;
	const percent = flat.length ? Math.round((completedCount / flat.length) * 100) : 0;

	const outline = (
		<nav aria-label="Mục lục khóa học" className="ln-outline">
			{course.lessons.map((lesson, lessonIndex) => (
				<div key={lesson.id} className="ln-outline__lesson">
					<p className="ln-outline__lesson-label">Bài {lessonIndex + 1}</p>
					<p className="ln-outline__lesson-title">{lesson.title}</p>
					<ol>
						{lesson.sections.map((item) => {
							const done = progress[item.id]?.completed;
							const active = item.id === current?.id;
							return (
								<li key={item.id}>
									<Link
										href={routes.learnCourse(course.slug, item.id)}
										className="ln-outline__item"
										aria-current={active ? 'page' : undefined}
										data-done={done ? 'true' : undefined}
									>
										<span className="ln-outline__mark" aria-hidden="true" data-kind={item.type} />
										<span className="min-w-0 flex-1">{item.title}</span>
										<span className="ln-outline__minutes">
											{item.type === 'QUIZ' ? 'Kiểm tra' : `${item.minutes}′`}
										</span>
										{done ? <span className="sr-only">(đã hoàn thành)</span> : null}
									</Link>
								</li>
							);
						})}
					</ol>
				</div>
			))}
		</nav>
	);

	const header = (
		<>
			<Link href={routes.learnCourses} className="ln-backlink">
				← Khóa học
			</Link>
			<span className="ln-topbar__title">{course.title}</span>
			<span className="ln-topbar__progress" aria-label={`Đã hoàn thành ${completedCount} trên ${flat.length} mục`}>
				<span className="tabular-nums">
					{completedCount}/{flat.length}
				</span>
				<span className="ln-meter">
					<span style={{ width: `${percent}%` }} />
				</span>
			</span>
			{viewer.isAdmin ? (
				<Link href={routes.learnStudio(course.slug, current?.id)} className="ln-btn ln-btn--quiet">
					Soạn bài
				</Link>
			) : null}
		</>
	);

	return (
		<LearnReaderFrame header={header} outline={outline}>
			{!section || !current ? (
				<div className="ln-reader__empty">
					<h1 className="font-display text-4xl font-medium tracking-tight">{course.title}</h1>
					<p className="mt-4 text-ink-secondary">Khóa học này chưa có nội dung.</p>
				</div>
			) : (
				<article className="ln-reader" key={section.id}>
					{current.lessonIndex === 0 && current.sectionIndex === 0 && course.description ? (
						<div className="ln-course-intro">
							<p className="ln-eyebrow">
								{[course.category, LEARN_LEVEL_LABELS[course.level]].filter(Boolean).join(' · ')}
							</p>
							<p>{course.description}</p>
						</div>
					) : null}
					<p className="ln-eyebrow">
						Bài {current.lessonIndex + 1} · Mục {current.sectionIndex + 1} ·{' '}
						{section.type === 'QUIZ' ? 'Bài kiểm tra' : `${formatMinutes(section.minutes)} đọc`}
					</p>
					<h1 className="ln-reader__title">{section.title}</h1>
					{section.summary ? <p className="ln-reader__lead">{section.summary}</p> : null}

					{section.keyTakeaways.length ? (
						<aside className="ln-takeaways" aria-label="Ý chính">
							<p className="ln-takeaways__label">Ý chính</p>
							<ul>
								{section.keyTakeaways.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</aside>
					) : null}

					{section.type === 'QUIZ' ? (
						section.quiz && section.quiz.questions.length ? (
							<LearnQuizRunner sectionId={section.id} quiz={section.quiz} initialReview={section.review} />
						) : (
							<p className="mt-8 text-ink-secondary">Bài kiểm tra này chưa có câu hỏi.</p>
						)
					) : (
						<>
							{section.markdown ? (
								<LearnMarkdown markdown={section.markdown} />
							) : (
								<p className="mt-8 text-ink-secondary">Mục này chưa có nội dung.</p>
							)}
							{section.checkpoint ? <LearnCheckpointCard checkpoint={section.checkpoint} /> : null}
						</>
					)}

					<LearnNotes sectionId={section.id} initialNote={state?.note ?? ''} />

					<footer className="ln-reader__footer">
						{previous ? (
							<Link href={routes.learnCourse(course.slug, previous.id)} className="ln-pager">
								<span>← Trước</span>
								<span className="ln-pager__title">{previous.title}</span>
							</Link>
						) : (
							<span />
						)}
						{section.type === 'READING' ? (
							<LearnCompleteButton
								sectionId={section.id}
								completed={Boolean(state?.completed)}
								nextHref={next ? routes.learnCourse(course.slug, next.id) : null}
							/>
						) : null}
						{next ? (
							<Link href={routes.learnCourse(course.slug, next.id)} className="ln-pager ln-pager--next">
								<span>Tiếp →</span>
								<span className="ln-pager__title">{next.title}</span>
							</Link>
						) : (
							<span />
						)}
					</footer>
				</article>
			)}
		</LearnReaderFrame>
	);
}
