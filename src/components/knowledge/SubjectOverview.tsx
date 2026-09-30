import Link from 'next/link';
import { routes } from '@/config/routes';
import { buildLearningSubjectSummary } from '@/features/my-class/domain/knowledgeContent';
import type { MyClassCourseDetail, MyClassLearnerState } from '@/features/my-class';
import SubjectTabs from './SubjectTabs';

export default function SubjectOverview({
	course,
	state,
}: {
	course: MyClassCourseDetail;
	state: MyClassLearnerState;
}) {
	const summary = buildLearningSubjectSummary(course, state);
	return (
		<section className="mc-page-shell" aria-labelledby="knowledge-subject-title">
			<div className="mc-page-main">
				<header className="mc-subject-head">
					<div>
						<p className="mc-eyebrow">MÔN HỌC</p>
						<h1 id="knowledge-subject-title">{course.title}</h1>
						<p className="mc-lead">{course.summary || course.description}</p>
					</div>
					<div className="mc-progress-summary">
						<strong>{state.percent}%</strong>
						<span>
							{state.completedItems}/{state.totalItems} ý nhỏ đã học
						</span>
						<div className="mc-meter">
							<span style={{ width: `${state.percent}%` }} />
						</div>
					</div>
				</header>
				<SubjectTabs
					courseSlug={course.slug}
					active="content"
					hasVocabulary={course.vocabSets.length > 0}
				/>
				<div className="mc-resume-bar">
					{state.resumeItem && !state.isComplete ? (
						<>
							<div>
								<span className="mc-eyebrow">TIẾP TỤC HỌC</span>
								<strong>{state.resumeItem.title}</strong>
							</div>
							<Link
								className="mc-button mc-button-primary"
								href={routes.myClassUnit(
									course.slug,
									state.resumeItem.lessonSlug,
									state.resumeItem.knowledgeUnitSlug,
									{ sectionSlug: state.resumeItem.sectionSlug },
								)}
							>
								Tiếp tục
							</Link>
						</>
					) : (
						<div>
							<span className="mc-eyebrow">TIẾN ĐỘ</span>
							<strong>
								{state.isComplete ? 'Bạn đã hoàn thành môn học' : 'Chọn một bài học để bắt đầu'}
							</strong>
						</div>
					)}
				</div>
				<div className="mc-lesson-groups">
					{summary.lessons.map((lesson, lessonIndex) => (
						<section
							key={lesson.id}
							className="mc-lesson-group"
							aria-labelledby={`lesson-${lesson.id}`}
						>
							<div className="mc-lesson-heading">
								<span className="mc-index">{String(lessonIndex + 1).padStart(2, '0')}</span>
								<div>
									<p className="mc-eyebrow">BÀI HỌC / CHỦ ĐỀ</p>
									<h2 id={`lesson-${lesson.id}`}>{lesson.title}</h2>
									{lesson.summary ? <p>{lesson.summary}</p> : null}
								</div>
								<span className="mc-lesson-progress">
									{lesson.completedItems}/{lesson.totalItems}
								</span>
							</div>
							<div className="mc-row-list">
								{lesson.modules.map((module, moduleIndex) => (
									<Link
										key={module.id}
										className="mc-row"
										href={routes.myClassModule(course.slug, lesson.slug, module.slug)}
									>
										<span className="mc-index">{`${lessonIndex + 1}.${moduleIndex + 1}`}</span>
										<span className="mc-row-copy">
											<strong>{module.title}</strong>
											<small>{module.summary || 'Module chưa có mô tả'}</small>
											<small>
												Nguồn: {lesson.title} · {module.totalItems} ý nhỏ
											</small>
										</span>
										<span className="mc-row-meta">
											{module.completedItems}/{module.totalItems}
											<br />
											{module.progressPercent}%
										</span>
										<span aria-hidden="true">→</span>
									</Link>
								))}
							</div>
						</section>
					))}
				</div>
			</div>
		</section>
	);
}
