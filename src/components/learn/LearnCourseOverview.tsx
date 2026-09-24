import Link from 'next/link';

import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { courseHue, toCurriculumLessons, type LearnCourseSummary } from '@/features/learn/progress';
import { LEARN_LEVEL_LABELS, type LearnCourseOutline } from '@/features/learn/types';

import LearnAppBar from './LearnAppBar';
import LearnCurriculum from './LearnCurriculum';
import { LearnCourseCover, LearnIcon, LearnProgressRing } from './LearnIcon';

/** Course home: what the course is, where the learner stands, and the full curriculum. */
export default function LearnCourseOverview({
	course,
	summary,
	isAdmin,
}: {
	course: LearnCourseOutline;
	summary: LearnCourseSummary;
	isAdmin: boolean;
}) {
	const first = summary.sections[0] ?? null;
	const next = summary.nextSection;
	const cta =
		summary.status === 'completed'
			? { label: 'Ôn lại từ đầu', href: first ? routes.learnCourse(course.slug, first.id) : null }
			: summary.status === 'in-progress'
				? { label: 'Tiếp tục học', href: next ? routes.learnCourse(course.slug, next.id) : null }
				: { label: 'Bắt đầu học', href: first ? routes.learnCourse(course.slug, first.id) : null };
	const notes = summary.sections.filter((section) => section.note.trim());
	const quizzes = summary.sections.filter((section) => section.type === 'QUIZ');
	const meta = [course.category, LEARN_LEVEL_LABELS[course.level]].filter(Boolean);

	return (
		<>
			<LearnAppBar
				crumbs={[{ label: course.title }]}
				actions={
					isAdmin ? (
						<Link href={routes.learnStudio(course.slug)} className="ln-btn ln-btn--ghost ln-btn--sm">
							<LearnIcon name="edit" size={14} /> Soạn bài
						</Link>
					) : null
				}
			/>
			<main className="ln-page ln-page--flush">
				<section className="ln-hero" style={{ ['--ln-hue' as string]: courseHue(course.slug) }}>
					<div className="ln-container ln-hero__inner">
						<div className="ln-hero__text">
							<div className="ln-hero__chips">
								{meta.map((item) => (
									<span key={item} className="ln-chip ln-chip--on-dark">
										{item}
									</span>
								))}
								{course.status !== 'PUBLISHED' ? <span className="ln-chip ln-chip--on-dark">Bản nháp</span> : null}
							</div>
							<h1 className="ln-hero__title">{course.title}</h1>
							{course.subtitle ? <p className="ln-hero__subtitle">{course.subtitle}</p> : null}
							<ul className="ln-hero__facts">
								<li>
									<LearnIcon name="layers" size={16} /> {summary.lessons.length} bài học
								</li>
								<li>
									<LearnIcon name="reading" size={16} /> {summary.totalCount} mục
								</li>
								<li>
									<LearnIcon name="clock" size={16} /> {formatMinutes(summary.totalMinutes)}
								</li>
								{summary.quizCount ? (
									<li>
										<LearnIcon name="quiz" size={16} /> {summary.quizCount} bài kiểm tra
									</li>
								) : null}
							</ul>
						</div>
						<LearnCourseCover hue={courseHue(course.slug)} title={course.title} className="ln-hero__cover" />
					</div>
				</section>

				<div className="ln-container ln-overview">
					<div className="ln-overview__main">
						{summary.status === 'completed' ? (
							<div className="ln-banner ln-banner--success" role="status">
								<LearnIcon name="trophy" size={22} />
								<div>
									<p className="font-semibold">Chúc mừng, bạn đã hoàn thành khóa học!</p>
									<p className="text-sm">
										{summary.totalCount} mục đã học
										{summary.quizCount ? ` · ${summary.quizzesPassed}/${summary.quizCount} bài kiểm tra đạt` : ''}. Bạn có
										thể ôn lại bất kỳ mục nào.
									</p>
								</div>
							</div>
						) : null}

						{course.description ? (
							<section className="ln-panel" aria-labelledby="ln-about">
								<h2 id="ln-about" className="ln-panel__title">
									Giới thiệu khóa học
								</h2>
								<p className="ln-overview__description">{course.description}</p>
							</section>
						) : null}

						<section className="ln-panel" aria-labelledby="ln-curriculum">
							<div className="ln-panel__head">
								<h2 id="ln-curriculum" className="ln-panel__title">
									Nội dung khóa học
								</h2>
								<p className="ln-panel__meta">
									{summary.lessons.length} bài · {summary.totalCount} mục · {formatMinutes(summary.totalMinutes)}
								</p>
							</div>
							{summary.lessons.length ? (
								<LearnCurriculum
									courseSlug={course.slug}
									lessons={toCurriculumLessons(summary.lessons)}
									openLessonId={next?.lessonId ?? summary.lessons[0]?.id}
								/>
							) : (
								<p className="text-ink-secondary">Khóa học này chưa có nội dung.</p>
							)}
						</section>

						{quizzes.length ? (
							<section className="ln-panel" aria-labelledby="ln-quizzes">
								<h2 id="ln-quizzes" className="ln-panel__title">
									Kết quả kiểm tra
								</h2>
								<ul className="ln-results">
									{quizzes.map((quiz) => (
										<li key={quiz.id}>
											<Link href={routes.learnCourse(course.slug, quiz.id)} className="ln-result">
												<span className="ln-result__icon" data-state={quiz.quizResult ? (quiz.quizResult.passed ? 'pass' : 'fail') : undefined}>
													<LearnIcon name={quiz.quizResult?.passed ? 'checkCircle' : 'quiz'} size={18} />
												</span>
												<span className="min-w-0 flex-1">
													<span className="ln-result__title">{quiz.title}</span>
													<span className="ln-result__sub">
														Bài {quiz.lessonIndex + 1} · {quiz.lessonTitle}
													</span>
												</span>
												<span className="ln-result__score tabular-nums">
													{quiz.quizResult ? `${quiz.quizResult.percentage}%` : 'Chưa làm'}
												</span>
											</Link>
										</li>
									))}
								</ul>
							</section>
						) : null}

						{notes.length ? (
							<section className="ln-panel" aria-labelledby="ln-notes">
								<div className="ln-panel__head">
									<h2 id="ln-notes" className="ln-panel__title">
										Ghi chú của bạn
									</h2>
									<p className="ln-panel__meta">{notes.length} ghi chú · chỉ bạn thấy</p>
								</div>
								<ul className="ln-note-list">
									{notes.map((section) => (
										<li key={section.id}>
											<Link href={routes.learnCourse(course.slug, section.id)} className="ln-note-card">
												<span className="ln-note-card__where">
													Bài {section.lessonIndex + 1} · {section.title}
												</span>
												<span className="ln-note-card__text">{section.note}</span>
											</Link>
										</li>
									))}
								</ul>
							</section>
						) : null}
					</div>

					<aside className="ln-overview__side">
						<div className="ln-side-card">
							<div className="ln-side-card__progress">
								<LearnProgressRing percent={summary.percent} size={72} stroke={6} />
								<div>
									<p className="ln-side-card__big tabular-nums">
										{summary.completedCount}/{summary.totalCount}
									</p>
									<p className="text-sm text-ink-secondary">mục đã hoàn thành</p>
								</div>
							</div>
							{cta.href ? (
								<Link href={cta.href} className="ln-btn ln-btn--primary ln-btn--lg ln-btn--full">
									<LearnIcon name="play" size={14} /> {cta.label}
								</Link>
							) : null}
							{next && summary.status === 'in-progress' ? (
								<div className="ln-side-card__next">
									<p className="ln-side-card__label">Mục tiếp theo</p>
									<Link href={routes.learnCourse(course.slug, next.id)} className="ln-side-card__next-title">
										{next.title}
									</Link>
									<p className="text-xs text-ink-secondary">
										Bài {next.lessonIndex + 1} · {next.type === 'QUIZ' ? 'Bài kiểm tra' : `${next.minutes} phút đọc`}
									</p>
								</div>
							) : null}
							<dl className="ln-side-card__facts">
								<div>
									<dt>Thời lượng còn lại</dt>
									<dd>{summary.remainingMinutes ? formatMinutes(summary.remainingMinutes) : '—'}</dd>
								</div>
								{summary.quizCount ? (
									<div>
										<dt>Bài kiểm tra đạt</dt>
										<dd className="tabular-nums">
											{summary.quizzesPassed}/{summary.quizCount}
										</dd>
									</div>
								) : null}
								<div>
									<dt>Ghi chú</dt>
									<dd className="tabular-nums">{notes.length}</dd>
								</div>
							</dl>
						</div>
					</aside>
				</div>
			</main>
		</>
	);
}
