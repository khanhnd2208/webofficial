import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import LearnCheckpointCard from '@/components/learn/LearnCheckpointCard';
import LearnCompleteButton from '@/components/learn/LearnCompleteButton';
import LearnCourseOverview from '@/components/learn/LearnCourseOverview';
import LearnCurriculum from '@/components/learn/LearnCurriculum';
import { LearnIcon, LearnProgressRing } from '@/components/learn/LearnIcon';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import LearnNotes from '@/components/learn/LearnNotes';
import { LearnKeyboardNav } from '@/components/learn/LearnPlayerChrome';
import LearnQuizRunner from '@/components/learn/LearnQuizRunner';
import LearnReaderFrame from '@/components/learn/LearnReaderFrame';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { summarizeCourse, toCurriculumLessons } from '@/features/learn/progress';
import { getLearnCourseOutline, getLearnProgress, getLearnReaderSection } from '@/features/learn/service';
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
	const summary = summarizeCourse(course, progress);
	const requested = typeof query.s === 'string' ? query.s : undefined;

	// Without a section the course opens on its overview, like any LMS course home.
	if (!requested) return <LearnCourseOverview course={course} summary={summary} isAdmin={viewer.isAdmin} />;

	const flat = summary.sections;
	const current = flat.find((section) => section.id === requested) ?? summary.nextSection ?? flat[0];
	const position = current ? flat.indexOf(current) : -1;
	const previous = position > 0 ? flat[position - 1] : null;
	const next = position >= 0 && position < flat.length - 1 ? flat[position + 1] : null;
	const section = current ? await getLearnReaderSection(course.id, current.id, viewer.userId) : null;
	const state = section ? progress[section.id] : undefined;
	const overviewHref = routes.learnCourse(course.slug);
	const previousHref = previous ? routes.learnCourse(course.slug, previous.id) : null;
	const nextHref = next ? routes.learnCourse(course.slug, next.id) : null;
	const remaining = flat.filter((item) => !item.completed);
	const finishesCourse = Boolean(current && remaining.length === 1 && remaining[0].id === current.id);

	const outlineHead = (
		<div className="ln-outline-head">
			<LearnProgressRing percent={summary.percent} size={40} stroke={4} />
			<div className="min-w-0">
				<p className="ln-outline-head__title">{summary.percent}% hoàn thành</p>
				<p className="ln-outline-head__sub tabular-nums">
					{summary.completedCount}/{summary.totalCount} mục
					{summary.remainingMinutes ? ` · còn ${formatMinutes(summary.remainingMinutes)}` : ''}
				</p>
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

	const header = (
		<>
			<Link href={overviewHref} className="ln-topbar__back" title="Về trang khóa học (O)">
				<LearnIcon name="arrowLeft" size={16} />
				<span className="ln-topbar__title">{course.title}</span>
			</Link>
			<span className="ln-topbar__progress" aria-label={`Đã hoàn thành ${summary.completedCount} trên ${summary.totalCount} mục`}>
				<LearnProgressRing percent={summary.percent} size={30} stroke={3} showValue={false} />
				<span className="tabular-nums">
					{summary.completedCount}/{summary.totalCount}
				</span>
			</span>
			<span className="ln-topbar__nav">
				{previousHref ? (
					<Link href={previousHref} className="ln-icon-btn" aria-label="Mục trước" title="Mục trước (←)">
						<LearnIcon name="chevronLeft" size={18} />
					</Link>
				) : (
					<span className="ln-icon-btn" aria-disabled="true">
						<LearnIcon name="chevronLeft" size={18} />
					</span>
				)}
				{nextHref ? (
					<Link href={nextHref} className="ln-icon-btn" aria-label="Mục tiếp" title="Mục tiếp (→)">
						<LearnIcon name="chevronRight" size={18} />
					</Link>
				) : (
					<span className="ln-icon-btn" aria-disabled="true">
						<LearnIcon name="chevronRight" size={18} />
					</span>
				)}
			</span>
			{viewer.isAdmin ? (
				<Link href={routes.learnStudio(course.slug, current?.id)} className="ln-btn ln-btn--ghost ln-btn--sm ln-topbar__studio">
					<LearnIcon name="edit" size={14} /> Soạn bài
				</Link>
			) : null}
		</>
	);

	return (
		<LearnReaderFrame header={header} outlineHead={outlineHead} outline={outline}>
			<LearnKeyboardNav previousHref={previousHref} nextHref={nextHref} overviewHref={overviewHref} />
			{!section || !current ? (
				<div className="ln-reader__empty">
					<h1 className="ln-reader__title">{course.title}</h1>
					<p className="mt-4 text-ink-secondary">Khóa học này chưa có nội dung.</p>
				</div>
			) : (
				<article className="ln-reader" key={section.id}>
					<nav className="ln-reader__crumbs" aria-label="Vị trí">
						<Link href={overviewHref}>Bài {current.lessonIndex + 1}</Link>
						<LearnIcon name="chevronRight" size={12} />
						<span>{current.lessonTitle}</span>
					</nav>
					<h1 className="ln-reader__title">{section.title}</h1>
					<div className="ln-reader__meta">
						<span className="ln-chip">
							<LearnIcon name={section.type === 'QUIZ' ? 'quiz' : 'reading'} size={13} />
							{section.type === 'QUIZ' ? 'Bài kiểm tra' : 'Bài đọc'}
						</span>
						<span className="ln-chip">
							<LearnIcon name="clock" size={13} />
							{formatMinutes(section.minutes)}
						</span>
						<span className="ln-chip tabular-nums">
							Mục {position + 1}/{flat.length}
						</span>
						{state?.completed ? (
							<span className="ln-chip" data-status="completed">
								<LearnIcon name="check" size={13} strokeWidth={2.4} />
								Đã hoàn thành
							</span>
						) : null}
					</div>
					{section.summary ? <p className="ln-reader__lead">{section.summary}</p> : null}

					{section.keyTakeaways.length ? (
						<aside className="ln-takeaways" aria-label="Ý chính">
							<p className="ln-takeaways__label">
								<LearnIcon name="target" size={15} /> Bạn sẽ nắm được
							</p>
							<ul>
								{section.keyTakeaways.map((item) => (
									<li key={item}>
										<LearnIcon name="check" size={14} strokeWidth={2.4} />
										<span>{item}</span>
									</li>
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
						{previous && previousHref ? (
							<Link href={previousHref} className="ln-pager">
								<span className="ln-pager__dir">
									<LearnIcon name="chevronLeft" size={14} /> Trước
								</span>
								<span className="ln-pager__title">{previous.title}</span>
							</Link>
						) : (
							<span />
						)}
						{section.type === 'READING' ? (
							<LearnCompleteButton
								sectionId={section.id}
								completed={Boolean(state?.completed)}
								nextHref={nextHref}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						) : (
							<span />
						)}
						{next && nextHref ? (
							<Link href={nextHref} className="ln-pager ln-pager--next">
								<span className="ln-pager__dir">
									Tiếp <LearnIcon name="chevronRight" size={14} />
								</span>
								<span className="ln-pager__title">{next.title}</span>
							</Link>
						) : (
							<Link href={overviewHref} className="ln-pager ln-pager--next">
								<span className="ln-pager__dir">Kết thúc</span>
								<span className="ln-pager__title">Về trang khóa học</span>
							</Link>
						)}
					</footer>
					<p className="ln-reader__hint">
						<LearnIcon name="keyboard" size={14} /> Phím tắt: <kbd>←</kbd> <kbd>→</kbd> chuyển mục · <kbd>O</kbd> về
						trang khóa học
					</p>
				</article>
			)}
		</LearnReaderFrame>
	);
}
