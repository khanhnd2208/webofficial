import LearnLinkPending from './LearnLinkPending';
import Link from 'next/link';

import SiteHeader from '@/components/site/SiteHeader';
import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { formatMinutes, titleHasLessonNumber } from '@/features/learn/format';
import { toCurriculumLessons, type LearnCourseSummary } from '@/features/learn/progress';
import { LEARN_LEVEL_LABELS, type LearnCourseOutline } from '@/features/learn/types';

import LearnCurriculum from './LearnCurriculum';
import { LearnIcon } from './LearnIcon';

const ABOUT_FOLD = 280;

/** Course home: a light header, then the curriculum and anything the learner has already produced. */
export default function LearnCourseOverview({
	course,
	summary,
	isAdmin,
	signedIn = true,
}: {
	course: LearnCourseOutline;
	summary: LearnCourseSummary;
	isAdmin: boolean;
	/** Guests see the course home with a sign-in call to action and no progress. */
	signedIn?: boolean;
}) {
	const first = summary.sections[0] ?? null;
	const next = summary.nextSection;
	const resume = next ?? first;
	const started = signedIn && summary.status !== 'not-started';
	const firstHref = first ? routes.learnCourse(course.slug, first.id) : null;
	const cta: { label: string; detail: string | null; href: string | null } = !signedIn
		? {
				label: 'Đăng nhập để bắt đầu',
				detail: 'Tiến độ và ghi chú được lưu theo tài khoản',
				href: `${routes.login}?from=${encodeURIComponent(firstHref ?? routes.learnCourse(course.slug))}`,
			}
		: summary.status === 'completed'
			? { label: 'Ôn lại từ đầu', detail: null, href: firstHref }
			: summary.status === 'in-progress'
				? {
						label: 'Học tiếp',
						detail: next?.title ?? null,
						href: next ? routes.learnCourse(course.slug, next.id) : null,
					}
				: { label: 'Bắt đầu học', detail: first?.title ?? null, href: firstHref };
	const readings = summary.sections.filter((section) => section.type === 'READING');
	const discussions = summary.sections.filter((section) => section.type === 'DISCUSSION');
	const readingMinutes = readings.reduce((total, section) => total + section.minutes, 0);
	// Lesson titles are the closest thing to outcomes the course stores; drop their "Bài N —".
	const outcomes = summary.lessons.map((lesson) =>
		titleHasLessonNumber(lesson.title)
			? lesson.title.replace(/^bài\s*\d+\s*[—–:.-]?\s*/i, '')
			: lesson.title,
	);
	const notes = summary.sections.filter((section) => section.note.trim());
	const eyebrow = [course.category, LEARN_LEVEL_LABELS[course.level]].filter(Boolean).join(' · ');
	const aboutLong = course.description.length > ABOUT_FOLD;

	return (
		<>
			<SiteHeader
				trail={[{ label: 'Học tập', href: routes.learnCourses }, { label: course.title }]}
			/>
			<main className="ln-page">
				<div className="ln-overview">
					<header className="ln-overview__header">
						{eyebrow ? <p className="ln-eyebrow">{eyebrow}</p> : null}
						{course.status !== 'PUBLISHED' ? <p className="ln-eyebrow">Bản nháp</p> : null}
						<h1 className="ln-page__title">{course.title}</h1>
						{course.subtitle ? <p className="ln-overview__subtitle">{course.subtitle}</p> : null}
						<p className="ln-overview__meta">
							{summary.lessons.length} bài · {summary.totalCount} mục ·{' '}
							{formatMinutes(summary.totalMinutes)}
						</p>
						{started ? (
							<div className="ln-overview__progress">
								<p className="tabular-nums">
									{summary.completedCount}/{summary.totalCount} · {summary.percent}%
								</p>
								<div className="ln-bar ln-bar--thin" aria-hidden="true">
									<span style={{ width: `${summary.percent}%` }} />
								</div>
							</div>
						) : null}
						{summary.status === 'completed' ? (
							<div className="mt-5 flex items-center gap-4">
								<SpotIllustration variant="complete" size={72} />
								<p className="ln-status-line" role="status">
									Đã hoàn thành khóa học
								</p>
							</div>
						) : null}
						{cta.href || isAdmin ? (
							<div className="ln-overview__actions">
								{cta.href ? (
									<Link href={cta.href} className="ln-btn ln-btn--primary ln-cta">
										<span className="ln-cta__label">{cta.label}</span>
										{cta.detail ? <span className="ln-cta__detail">{cta.detail}</span> : null}
										<LearnLinkPending />
									</Link>
								) : null}
								{isAdmin ? (
									<Link href={routes.learnStudio(course.slug)} className="ln-btn ln-btn--ghost">
										<LearnIcon name="edit" size={14} /> Soạn bài
										<LearnLinkPending />
									</Link>
								) : null}
							</div>
						) : null}
					</header>

					{course.description ? (
						<section className="ln-block" aria-labelledby="ln-about">
							<h2 id="ln-about">Giới thiệu</h2>
							{aboutLong ? (
								<div className="ln-overview__about">
									<p className="ln-overview__description ln-overview__preview">
										{course.description.slice(0, ABOUT_FOLD).trim()}…
									</p>
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

					{outcomes.length >= 2 ? (
						<section className="ln-block" aria-labelledby="ln-outcomes">
							<h2 id="ln-outcomes">Bạn sẽ học</h2>
							<ul className="ln-outcomes">
								{outcomes.map((outcome, index) => (
									<li key={`${index}-${outcome}`}>
										<LearnIcon name="check" size={16} />
										<span>{outcome}</span>
									</li>
								))}
							</ul>
						</section>
					) : null}

					{readings.length ? (
						<section className="ln-block" aria-labelledby="ln-how">
							<h2 id="ln-how">Cách học</h2>
							<ul className="ln-how">
								<li>
									<LearnIcon name="reading" size={18} />
									<span>
										<b>{readings.length} mục bài giảng</b>
										Đọc theo thứ tự, khoảng {formatMinutes(readingMinutes)}
									</span>
								</li>
								{discussions.length ? (
									<li>
										<LearnIcon name="discussion" size={18} />
										<span>
											<b>{discussions.length} bộ câu hỏi phản biện</b>
											Tự trả lời trước, rồi so với đáp án mẫu
										</span>
									</li>
								) : null}
								<li>
									<LearnIcon name="note" size={18} />
									<span>
										<b>Lưu theo tài khoản</b>
										Tiến độ và ghi chú, học tiếp trên mọi thiết bị
									</span>
								</li>
							</ul>
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

					{notes.length ? (
						<section className="ln-block" aria-labelledby="ln-notes">
							<h2 id="ln-notes">Ghi chú của bạn</h2>
							<ul className="ln-note-list">
								{notes.map((section) => (
									<li key={section.id}>
										<Link
											href={routes.learnCourse(course.slug, section.id)}
											className="ln-note-card"
										>
											<span className="ln-note-card__where">
												Bài {section.lessonIndex + 1} · {section.title}
											</span>
											<span className="ln-note-card__text">{section.note}</span>
											<LearnLinkPending />
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
