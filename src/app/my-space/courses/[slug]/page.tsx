import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import LearnCheckpointCard from '@/components/learn/LearnCheckpointCard';
import LearnCompleteButton from '@/components/learn/LearnCompleteButton';
import LearnDiscussionViewer from '@/components/learn/LearnDiscussionViewer';
import LearnCourseOverview from '@/components/learn/LearnCourseOverview';
import LearnCurriculum from '@/components/learn/LearnCurriculum';
import { LearnIcon } from '@/components/learn/LearnIcon';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import LearnPracticeRunner from '@/components/learn/LearnPracticeRunner';
import LearnNotesDrawer from '@/components/learn/LearnNotesDrawer';
import { LearnKeyboardNav } from '@/components/learn/LearnPlayerChrome';
import LearnQuizRunner from '@/components/learn/LearnQuizRunner';
import LearnReaderFrame from '@/components/learn/LearnReaderFrame';
import LearnReaderPrefs from '@/components/learn/LearnReaderPrefs';
import LearnStudyTracker from '@/components/learn/LearnStudyTracker';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { readingOutline } from '@/features/learn/outline';
import { summarizeCourse, toCurriculumLessons } from '@/features/learn/progress';
import {
	getLearnCourseOutline,
	getLearnProgress,
	getLearnReaderSection,
} from '@/features/learn/service';
import { LEARN_SECTION_KIND_LABELS } from '@/features/learn/types';
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

	const requested = typeof query.s === 'string' ? query.s : undefined;

	// Without a section the course opens on its overview, like any LMS course home.
	if (!requested) {
		const progress = await getLearnProgress(viewer.userId, course.id);
		const summary = summarizeCourse(course, progress);
		return (
			<>
				{!viewer.isAdmin ? <LearnStudyTracker userId={viewer.userId} courseSlug={course.slug} sectionId={null} /> : null}
				<LearnCourseOverview course={course} summary={summary} isAdmin={viewer.isAdmin} />
			</>
		);
	}

	const [progress, requestedSection] = await Promise.all([
		getLearnProgress(viewer.userId, course.id),
		getLearnReaderSection(course.id, requested, viewer.userId),
	]);
	const summary = summarizeCourse(course, progress);
	const flat = summary.sections;
	let current = flat.find((section) => section.id === requested) ?? null;
	let section = current ? requestedSection : null;
	if (!current) {
		current = summary.nextSection ?? flat[0] ?? null;
		section = current ? await getLearnReaderSection(course.id, current.id, viewer.userId) : null;
	}
	const position = current ? flat.indexOf(current) : -1;
	const previous = position > 0 ? flat[position - 1] : null;
	const next = position >= 0 && position < flat.length - 1 ? flat[position + 1] : null;
	const state = section ? progress[section.id] : undefined;
	const overviewHref = routes.learnCourse(course.slug);
	const previousHref = previous ? routes.learnCourse(course.slug, previous.id) : null;
	const nextHref = next ? routes.learnCourse(course.slug, next.id) : null;
	const remaining = flat.filter((item) => !item.completed);
	const finishesCourse = Boolean(
		current && remaining.length === 1 && remaining[0].id === current.id,
	);

	const outlineHead = (
		<div className="ln-outline-head">
			<p className="ln-outline-head__line tabular-nums">
				{summary.completedCount}/{summary.totalCount} mục
				{summary.remainingMinutes ? ` · còn ${formatMinutes(summary.remainingMinutes)}` : ''}
			</p>
			<div className="ln-bar ln-bar--thin" aria-hidden="true">
				<span style={{ width: `${summary.percent}%` }} />
			</div>
		</div>
	);

	const outline = (
		<nav aria-label="Mục lục khóa học">
			<LearnCurriculum
				courseSlug={course.slug}
				lessons={toCurriculumLessons(summary.lessons)}
				openLessonId={current?.lessonId}
				currentId={current?.id}
				compact
			/>
		</nav>
	);

	const quizPassed = Boolean(section?.type === 'QUIZ' && section.review?.result.passed);
	const headings =
		section?.type === 'READING' && section.markdown ? readingOutline(section.markdown) : [];

	function primaryAction() {
		if (section && current && section.type === 'READING') {
			return (
				<LearnCompleteButton
					sectionId={section.id}
					completed={Boolean(state?.completed)}
					nextHref={nextHref}
					nextTitle={next?.title}
					finishesCourse={finishesCourse}
					overviewHref={overviewHref}
				/>
			);
		}
		if (section?.type !== 'QUIZ') return null;
		const continueHref = quizPassed ? (finishesCourse ? overviewHref : nextHref) : null;
		if (continueHref) {
			return (
				<Link href={continueHref} className="ln-btn ln-btn--primary">
					Tiếp tục →
				</Link>
			);
		}
		return nextHref ? (
			<Link href={nextHref} className="ln-pager ln-pager--skip">
				Bỏ qua →
			</Link>
		) : null;
	}

	const header = (
		<>
			<Link href={overviewHref} className="ln-topbar__back" title="Về trang khóa học (O)">
				<LearnIcon name="arrowLeft" size={16} />
				<span className="ln-topbar__title">
					{course.title}
					{current ? <span className="ln-topbar__section"> / {current.title}</span> : null}
				</span>
			</Link>
			<span
				className="ln-topbar__count tabular-nums"
				aria-label={`Đã hoàn thành ${summary.completedCount} trên ${summary.totalCount} mục`}
			>
				{summary.completedCount}/{summary.totalCount}
			</span>
			<LearnReaderPrefs />
			{section ? (
				<LearnNotesDrawer key={section.id} sectionId={section.id} initialNote={state?.note ?? ''} />
			) : null}
			{viewer.isAdmin ? (
				<Link
					href={routes.learnStudio(course.slug, current?.id)}
					className="ln-btn ln-btn--ghost ln-btn--sm ln-topbar__studio"
				>
					<LearnIcon name="edit" size={14} /> Soạn bài
				</Link>
			) : null}
		</>
	);

	return (
		<LearnReaderFrame header={header} outlineHead={outlineHead} outline={outline}>
			{!viewer.isAdmin ? (
				<LearnStudyTracker userId={viewer.userId} courseSlug={course.slug} sectionId={section?.id ?? null} />
			) : null}
			<LearnKeyboardNav
				previousHref={previousHref}
				nextHref={nextHref}
				overviewHref={overviewHref}
			/>
			{!section || !current ? (
				<div className="ln-reader__empty">
					<h1 className="ln-reader__title">{course.title}</h1>
					<p className="mt-4 text-ink-secondary">Khóa học này chưa có nội dung.</p>
				</div>
			) : (
				<article className="ln-reader" key={section.id}>
					<p className="ln-reader__eyebrow">
						{/^bài\s*\d/i.test(current.lessonTitle) ? null : (
							<>
								Bài {current.lessonIndex + 1}
								<span aria-hidden="true"> · </span>
							</>
						)}
						<Link href={overviewHref}>{current.lessonTitle}</Link>
					</p>
					<h1 className="ln-reader__title">{section.title}</h1>
					<p className="ln-reader__meta">
						{LEARN_SECTION_KIND_LABELS[section.type]}
						<span aria-hidden="true"> · </span>
						{formatMinutes(section.minutes)}
						{state?.completed ? (
							<>
								<span aria-hidden="true"> · </span>
								<span className="ln-reader__done">✓ Đã hoàn thành</span>
							</>
						) : null}
					</p>
					{section.summary ? <p className="ln-reader__lead">{section.summary}</p> : null}

					{section.keyTakeaways.length ? (
						<aside className="ln-takeaways" aria-label="Ý chính">
							<p className="ln-takeaways__label">Bạn sẽ nắm được</p>
							<ul>
								{section.keyTakeaways.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</aside>
					) : null}

					{section.type === 'QUIZ' ? (
						section.quiz && section.quiz.questions.length ? (
							<LearnQuizRunner
								sectionId={section.id}
								quiz={section.quiz}
								initialReview={section.review}
								nextHref={nextHref}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						) : (
							<p className="mt-8 text-ink-secondary">Bài kiểm tra này chưa có câu hỏi.</p>
						)
					) : section.type === 'PRACTICE' ? (
						section.practice?.length ? (
							<LearnPracticeRunner
								sectionId={section.id}
								questions={section.practice}
								completed={Boolean(state?.completed)}
								nextHref={nextHref}
								nextTitle={next?.title}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						) : (
							<p className="mt-8 text-ink-secondary">Mục luyện tập này chưa có câu hỏi.</p>
						)
					) : section.type === 'DISCUSSION' ? (
						section.discussion ? (
							<LearnDiscussionViewer
								sectionId={section.id}
								discussion={section.discussion}
								completed={Boolean(state?.completed)}
								nextHref={nextHref}
								nextTitle={next?.title}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						) : (
							<p className="mt-8 text-ink-secondary">Mục này chưa có câu hỏi.</p>
						)
					) : (
						<>
							{section.markdown ? (
								<>
									{headings.length >= 3 ? (
										<details className="ln-toc">
											<summary>Trong mục này</summary>
											<ol>
												{headings.map((heading) => (
													<li key={heading.id} data-level={heading.level}>
														<a href={`#${heading.id}`}>{heading.text}</a>
													</li>
												))}
											</ol>
										</details>
									) : null}
									<LearnMarkdown markdown={section.markdown} />
								</>
							) : (
								<p className="mt-8 text-ink-secondary">Mục này chưa có nội dung.</p>
							)}
							{section.checkpoint ? <LearnCheckpointCard checkpoint={section.checkpoint} /> : null}
						</>
					)}

					<footer className="ln-reader__footer">
						{previous && previousHref ? (
							<Link href={previousHref} className="ln-pager">
								← {previous.title}
							</Link>
						) : (
							<span />
						)}
						<div className="ln-reader__action">{primaryAction()}</div>
					</footer>
				</article>
			)}
			{section && current ? (
				<div className="ln-actionbar">
					{previousHref ? (
						<Link href={previousHref} className="ln-icon-btn" aria-label="Mục trước">
							<LearnIcon name="chevronLeft" size={18} />
						</Link>
					) : (
						<span className="ln-icon-btn" aria-disabled="true">
							<LearnIcon name="chevronLeft" size={18} />
						</span>
					)}
					<div className="ln-actionbar__primary">{primaryAction()}</div>
					{nextHref ? (
						<Link href={nextHref} className="ln-icon-btn" aria-label="Mục tiếp">
							<LearnIcon name="chevronRight" size={18} />
						</Link>
					) : (
						<span className="ln-icon-btn" aria-disabled="true">
							<LearnIcon name="chevronRight" size={18} />
						</span>
					)}
				</div>
			) : null}
		</LearnReaderFrame>
	);
}
