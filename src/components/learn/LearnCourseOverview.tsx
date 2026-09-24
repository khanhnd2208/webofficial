import Link from 'next/link';

import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { toCurriculumLessons, type LearnCourseSummary } from '@/features/learn/progress';
import { LEARN_LEVEL_LABELS, type LearnCourseOutline } from '@/features/learn/types';

import LearnAppBar from './LearnAppBar';
import LearnCurriculum from './LearnCurriculum';
import { LearnIcon } from './LearnIcon';

const ABOUT_FOLD = 280;

/** Course home: a light header, then the curriculum and anything the learner has already produced. */
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
	const resume = next ?? first;
	const cta =
		summary.status === 'completed'
			? { label: 'Ôn lại', href: first ? routes.learnCourse(course.slug, first.id) : null }
			: summary.status === 'in-progress'
				? { label: `Học tiếp: ${next?.title ?? ''}`, href: next ? routes.learnCourse(course.slug, next.id) : null }
				: { label: 'Bắt đầu học', href: first ? routes.learnCourse(course.slug, first.id) : null };
	const notes = summary.sections.filter((section) => section.note.trim());
	const quizzes = summary.sections.filter((section) => section.type === 'QUIZ' && section.quizResult);
	const eyebrow = [course.category, LEARN_LEVEL_LABELS[course.level]].filter(Boolean).join(' · ');
	const aboutLong = course.description.length > ABOUT_FOLD;

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
			<main className="ln-page">
				<div className="ln-overview">
					<header className="ln-overview__header">
						{eyebrow ? <p className="ln-eyebrow">{eyebrow}</p> : null}
						{course.status !== 'PUBLISHED' ? <p className="ln-eyebrow">Bản nháp</p> : null}
						<h1 className="ln-page__title">{course.title}</h1>
						{course.subtitle ? <p className="ln-overview__subtitle">{course.subtitle}</p> : null}
						<p className="ln-overview__meta">
							{summary.lessons.length} bài · {summary.totalCount} mục · {formatMinutes(summary.totalMinutes)}
						</p>
						<div className="ln-overview__progress">
							<p className="tabular-nums">
								{summary.completedCount}/{summary.totalCount} · {summary.percent}%
							</p>
							<div className="ln-bar ln-bar--thin" aria-hidden="true">
								<span style={{ width: `${summary.percent}%` }} />
							</div>
						</div>
						{summary.status === 'completed' ? (
							<p className="ln-status-line" role="status">
								Đã hoàn thành khóa học
								{summary.quizCount ? ` · ${summary.quizzesPassed}/${summary.quizCount} bài kiểm tra đạt` : ''}
							</p>
						) : null}
						{cta.href ? (
							<Link href={cta.href} className="ln-btn ln-btn--primary">
								{cta.label}
							</Link>
						) : null}
					</header>

					{course.description ? (
						<section className="ln-block" aria-labelledby="ln-about">
							<h2 id="ln-about">Giới thiệu</h2>
							{aboutLong ? (
								<div className="ln-overview__about">
									<p className="ln-overview__description ln-overview__preview">{course.description.slice(0, ABOUT_FOLD).trim()}…</p>
									<details className="ln-overview__more">
										<summary>Xem thêm</summary>
										<p className="ln-overview__description">{course.description}</p>
									</details>
								</div>
							) : (
								<p className="ln-overview__description">{course.description}</p>
							)}
						</section>
					) : null}

					<section className="ln-block" aria-labelledby="ln-curriculum">
						<h2 id="ln-curriculum">Nội dung khóa học</h2>
						{summary.lessons.length ? (
							<LearnCurriculum
								courseSlug={course.slug}
								lessons={toCurriculumLessons(summary.lessons)}
								openLessonId={resume?.lessonId ?? summary.lessons[0]?.id}
							/>
						) : (
							<p className="text-ink-secondary">Khóa học này chưa có nội dung.</p>
						)}
					</section>

					{quizzes.length ? (
						<section className="ln-block" aria-labelledby="ln-quizzes">
							<h2 id="ln-quizzes">Kết quả kiểm tra</h2>
							<ul className="ln-results">
								{quizzes.map((quiz) => (
									<li key={quiz.id}>
										<Link href={routes.learnCourse(course.slug, quiz.id)} className="ln-result">
											<span className="min-w-0 flex-1">
												<span className="ln-result__title">{quiz.title}</span>
												<span className="ln-result__sub">
													Bài {quiz.lessonIndex + 1} · {quiz.lessonTitle}
												</span>
											</span>
											<span className="ln-result__score tabular-nums" data-passed={quiz.quizResult?.passed ? 'true' : 'false'}>
												{quiz.quizResult?.percentage}%
											</span>
										</Link>
									</li>
								))}
							</ul>
						</section>
					) : null}

					{notes.length ? (
						<section className="ln-block" aria-labelledby="ln-notes">
							<h2 id="ln-notes">Ghi chú của bạn</h2>
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
			</main>
		</>
	);
}
