import type { ReactNode } from 'react';
import Link from 'next/link';
import { routes } from '@/config/routes';
import { formatDuration } from '@/features/my-class/domain/estimateReading';
import type { MyClassCourseDetail } from '@/features/my-class/types';
import type {
	MyClassLearnerState,
	MyClassOutlineItem,
} from '@/features/my-class/domain/learnerState';
import { toOutlineItemLink } from '@/features/my-class/domain/learnerState';
import { McBadge, McCourseCover, McIcon, McMeter } from '@/components/myclass/ui';
import MyClassStudioLink from '@/components/myclass/MyClassStudioLink';

const LEVEL_LABEL: Record<string, string> = {
	BEGINNER: 'Cơ bản',
	INTERMEDIATE: 'Trung cấp',
	ADVANCED: 'Nâng cao',
};

function lessonProgress(lessonSlug: string, items: MyClassOutlineItem[]) {
	const unique = [
		...new Map(
			items
				.filter((item) => item.lessonSlug === lessonSlug)
				.map((item) => [item.knowledgeUnitId, item]),
		).values(),
	];
	const done = unique.filter((item) => item.status === 'done').length;
	return {
		done,
		total: unique.length,
		percent: unique.length ? Math.round((done / unique.length) * 100) : 0,
	};
}

export default function CourseLanding({
	course,
	state,
	items,
	isAdmin,
	editActions,
}: {
	course: MyClassCourseDetail;
	state: MyClassLearnerState;
	items: MyClassOutlineItem[];
	isAdmin?: boolean;
	editActions?: ReactNode;
}) {
	const continueHref = state.resumeItem ? toOutlineItemLink(state.resumeItem).href : null;
	return (
		<div className="space-y-10">
			<nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
				<Link
					href={routes.myClass}
					className="mc-focus-ring inline-flex min-h-11 items-center rounded-[var(--mc-r-xs)] font-medium text-ink-secondary hover:text-ink"
				>
					<McIcon name="arrow_back" size={18} className="mr-1" />
					Tất cả khóa học
				</Link>
				{isAdmin ? (
					<div className="flex flex-wrap items-center justify-end gap-2">
						{editActions}
						{editActions ? null : (
							<MyClassStudioLink href={routes.admin.myClassCourseContent(course.id)}>
								Thiết kế lớp
							</MyClassStudioLink>
						)}
					</div>
				) : null}
			</nav>

			<section className="mc-surface overflow-hidden">
				<div className="grid lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
					<McCourseCover
						url={course.thumbnailUrl}
						title={course.title}
						className="aspect-video min-h-full w-full"
					/>
					<div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
						<div className="flex flex-wrap gap-2">
							{course.level ? (
								<McBadge variant="level">{LEVEL_LABEL[course.level] ?? course.level}</McBadge>
							) : null}
							{course.tags.slice(0, 3).map((tag) => (
								<McBadge key={tag}>{tag}</McBadge>
							))}
						</div>
						<p className="mc-eyebrow mt-5 text-accent">Khóa học</p>
						<h1 className="mc-title mt-2 text-[clamp(2rem,4vw,3rem)]">{course.title}</h1>
						{course.summary || course.description ? (
							<p className="mt-3 max-w-2xl text-base leading-7 text-ink-secondary">
								{course.summary || course.description}
							</p>
						) : null}
						<p className="mc-meta mt-5">
							<span className="mc-num">{course.lessons.length}</span> bài ·{' '}
							<span className="mc-num">{state.totalItems}</span> nội dung
							{course.estimatedMinutes != null
								? ` · ${formatDuration(course.estimatedMinutes)}`
								: ''}
						</p>
						<div className="mt-6 max-w-xl">
							<div className="mb-2 flex items-center justify-between gap-3">
								<p className="text-sm font-medium text-ink-secondary">
									<span className="mc-num font-semibold text-ink">
										{state.completedItems}/{state.totalItems}
									</span>{' '}
									đã hiểu
								</p>
								<span className="mc-num text-sm font-semibold text-ink">{state.percent}%</span>
							</div>
							<McMeter value={state.percent} label="Tiến độ khóa học" />
							{state.resumeItem ? (
								<p className="mc-meta mt-3 line-clamp-1">Tiếp theo: {state.resumeItem.title}</p>
							) : null}
						</div>
						<div className="mt-7 flex flex-wrap gap-3">
							{continueHref ? (
								<Link
									href={continueHref}
									className="mc-focus-ring inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-5 text-sm font-semibold text-paper hover:bg-inverse-surface"
								>
									{state.completedItems ? 'Tiếp tục học' : 'Bắt đầu'}
									<McIcon name="arrow_forward" size={18} className="ml-1" />
								</Link>
							) : null}
							{course.vocabSets.length ? (
								<Link
									href={routes.myClassVocabIndex(course.slug)}
									className="mc-focus-ring inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-5 text-sm font-semibold text-ink hover:bg-surface-sunken"
								>
									Luyện từ vựng
								</Link>
							) : null}
						</div>
					</div>
				</div>
			</section>

			<section aria-labelledby="course-path-heading">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="mc-eyebrow text-accent">Lộ trình</p>
						<h2 id="course-path-heading" className="mc-title mt-2 text-[clamp(1.5rem,2.5vw,2rem)]">
							Các bài học
						</h2>
					</div>
					<p className="mc-meta">
						<span className="mc-num">{state.completedItems}</span>/{state.totalItems} nội dung
					</p>
				</div>
				<ol className="mc-surface mt-5 divide-y divide-mc-rule overflow-hidden">
					{course.lessons.map((lesson) => {
						const progress = lessonProgress(lesson.slug, items);
						const firstUnit = lesson.sections[0]?.knowledgeUnits[0];
						const href = firstUnit
							? routes.myClassUnit(course.slug, lesson.slug, firstUnit.slug)
							: routes.myClassLesson(course.slug, lesson.slug);
						const lessonNumber = String(lesson.position + 1).padStart(2, '0');
						const status =
							progress.total > 0 && progress.done === progress.total
								? 'Đã hoàn thành'
								: progress.done > 0
									? 'Đang học'
									: 'Chưa bắt đầu';
						return (
							<li key={lesson.id}>
								<Link
									href={href}
									aria-label={`Mở bài ${lessonNumber}: ${lesson.title}. ${
										status === 'Chưa bắt đầu' ? 'Chưa học' : status
									}. ${progress.done}/${progress.total} nội dung.`}
									className="mc-focus-ring group grid gap-4 p-4 transition-colors hover:bg-surface-sunken sm:grid-cols-[3rem_minmax(0,1fr)_8rem] sm:items-center sm:p-5"
								>
									<span className="mc-num text-sm font-semibold text-ink-tertiary">
										{lessonNumber}
									</span>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-base font-bold text-ink group-hover:text-accent">
												{lesson.title}
											</h3>
											<McBadge
												variant={
													status === 'Đã hoàn thành'
														? 'done'
														: status === 'Đang học'
															? 'accent'
															: 'neutral'
												}
											>
												{status}
											</McBadge>
										</div>
										{lesson.summary ? (
											<p className="mt-1 line-clamp-1 text-sm text-ink-secondary">
												{lesson.summary}
											</p>
										) : null}
										<p className="mc-meta mt-2">
											<span className="mc-num">
												{progress.done}/{progress.total}
											</span>{' '}
											nội dung
											{lesson.estimatedMinutes != null
												? ` · ${formatDuration(lesson.estimatedMinutes)}`
												: ''}
										</p>
										<div className="mt-3 max-w-sm sm:hidden">
											<McMeter value={progress.percent} label={`Tiến độ ${lesson.title}`} />
										</div>
									</div>
									<div className="hidden sm:block">
										<div className="flex items-center justify-between text-xs">
											<span className="text-ink-secondary">{status}</span>
											<span className="mc-num font-semibold">{progress.percent}%</span>
										</div>
										<div className="mt-2">
											<McMeter value={progress.percent} label={`Tiến độ ${lesson.title}`} />
										</div>
									</div>
								</Link>
							</li>
						);
					})}
				</ol>
			</section>
		</div>
	);
}
