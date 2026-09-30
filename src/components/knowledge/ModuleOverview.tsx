import Link from 'next/link';
import { routes } from '@/config/routes';
import { buildLearningSubjectSummary } from '@/features/my-class/domain/knowledgeContent';
import type { MyClassCourseDetail, MyClassLearnerState } from '@/features/my-class';

export default function ModuleOverview({
	course,
	state,
	lessonSlug,
	moduleSlug,
}: {
	course: MyClassCourseDetail;
	state: MyClassLearnerState;
	lessonSlug: string;
	moduleSlug: string;
}) {
	const lesson = course.lessons.find((item) => item.slug === lessonSlug);
	const section = lesson?.sections.find((item) => item.slug === moduleSlug);
	if (!lesson || !section) return null;
	const moduleSummary = buildLearningSubjectSummary(course, state).modules.find(
		(item) => item.id === section.id,
	);
	if (!moduleSummary) return null;
	const firstOpen = moduleSummary.items.find((item) => !item.completed) ?? moduleSummary.items[0];
	const ctaLabel =
		moduleSummary.totalItems === 0
			? moduleSummary.tests.length
				? 'Làm checkpoint'
				: 'Module chưa có ý nhỏ'
			: moduleSummary.completedItems === 0
				? 'Bắt đầu module'
				: moduleSummary.completedItems === moduleSummary.totalItems
					? 'Xem lại module'
					: 'Tiếp tục module';
	const ctaHref = firstOpen
		? routes.myClassUnit(course.slug, lesson.slug, firstOpen.slug, { sectionSlug: section.slug })
		: '#module-checkpoint';
	return (
		<section className="mc-page-shell" aria-labelledby="module-overview-title">
			<div className="mc-page-main">
				<nav className="mc-breadcrumb" aria-label="Đường dẫn">
					<Link href={routes.myClassCourse(course.slug)}>{course.title}</Link>
					<span>→</span>
					<span>{lesson.title}</span>
					<span>→</span>
					<span>{section.title}</span>
				</nav>
				<header className="mc-module-head">
					<div>
						<p className="mc-eyebrow">MODULE {String(section.position + 1).padStart(2, '0')}</p>
						<h1 id="module-overview-title">{section.title}</h1>
						{section.summary ? <p className="mc-lead">{section.summary}</p> : null}
						<p className="mc-source">Nguồn: {lesson.title}</p>
					</div>
					<div className="mc-progress-summary">
						<strong>{moduleSummary.progressPercent}%</strong>
						<span>
							{moduleSummary.completedItems}/{moduleSummary.totalItems} ý nhỏ đã học
						</span>
						<div className="mc-meter">
							<span style={{ width: `${moduleSummary.progressPercent}%` }} />
						</div>
					</div>
				</header>
				<div className="mc-module-actions">
					<Link className="mc-button mc-button-primary" href={ctaHref}>
						{ctaLabel}
					</Link>
					<Link className="mc-button mc-button-secondary" href={routes.myClassCourse(course.slug)}>
						Về môn học
					</Link>
				</div>
				<div className="mc-row-list mc-module-items" aria-label="Ý nhỏ trong module">
					{moduleSummary.items.map((item) => (
						<Link
							key={item.id}
							className="mc-row"
							href={routes.myClassUnit(course.slug, lesson.slug, item.slug, {
								sectionSlug: section.slug,
							})}
							data-done={item.completed ? 'true' : 'false'}
						>
							<span className="mc-status" aria-label={item.completed ? 'Đã học' : 'Chưa học'}>
								{item.completed ? '✓' : '○'}
							</span>
							<span className="mc-row-copy">
								<strong>{item.title}</strong>
								{item.summary ? <small>{item.summary}</small> : null}
							</span>
							<span className="mc-row-meta">{item.completed ? 'Đã học' : 'Chưa học'}</span>
							<span aria-hidden="true">→</span>
						</Link>
					))}
				</div>
				{moduleSummary.tests.length ? (
					<section id="module-checkpoint" className="mc-checkpoint">
						<div>
							<p className="mc-eyebrow">CHECKPOINT</p>
							<h2>Kiểm tra module</h2>
							<p>Ôn lại các ý nhỏ vừa học qua bài test ngắn.</p>
						</div>
						<Link
							className="mc-button mc-button-secondary"
							href={routes.myClassTest(course.slug, moduleSummary.tests[0]!.slug)}
						>
							Làm checkpoint
						</Link>
					</section>
				) : null}
				{moduleSummary.totalItems === 0 && !moduleSummary.tests.length ? (
					<p className="mc-empty">Module này chưa có ý nhỏ hoặc checkpoint được xuất bản.</p>
				) : null}
			</div>
		</section>
	);
}
