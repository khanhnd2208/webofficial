import Link from 'next/link';

import { routes } from '@/config/routes';

import LearnCourseThumb from './LearnCourseThumb';

export interface CourseCardProgress {
	percent: number;
	/** "Đang học", "Đã hoàn thành" … */
	label: string;
}

/**
 * The one course card on /khoa-hoc, for guests and signed-in learners alike: cover, title, one
 * line of description, facts, and progress once the learner has started.
 */
export default function CourseCard({
	slug,
	title,
	blurb,
	facts,
	thumbnailUrl,
	progress,
	lessonTitles = [],
}: {
	slug: string;
	title: string;
	blurb: string;
	facts: string[];
	thumbnailUrl: string | null;
	progress?: CourseCardProgress | null;
	lessonTitles?: string[];
}) {
	return (
		<article className="rounded-2xl border border-hairline bg-canvas" data-testid="course-card">
			<Link
				href={routes.learnCourse(slug)}
				className="flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-5 sm:p-4"
			>
				<span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-paper sm:w-[200px]">
					<LearnCourseThumb slug={slug} thumbnailUrl={thumbnailUrl} />
				</span>
				<span className="min-w-0 flex-1 py-0.5">
					<h2 className="font-display text-title-3 leading-tight tracking-tight break-words">
						{title}
					</h2>
					{blurb ? (
						<span className="mt-1 line-clamp-2 block text-body leading-relaxed text-ink-secondary">
							{blurb}
						</span>
					) : null}
					<span className="mt-2 block text-subhead text-ink-secondary">{facts.join(' · ')}</span>
					{progress ? (
						<span className="mt-3 flex items-center gap-3 text-subhead text-ink-secondary">
							<span
								className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-hairline"
								aria-hidden="true"
							>
								<span
									className="block h-full rounded-full bg-accent"
									style={{ width: `${progress.percent}%` }}
								/>
							</span>
							<span className="shrink-0 tabular-nums">
								{progress.label} · {progress.percent}%
							</span>
						</span>
					) : (
						<span className="mt-3 inline-flex items-center text-subhead font-medium text-ink">
							Vào khóa học
							<span aria-hidden="true" className="ml-2">
								→
							</span>
						</span>
					)}
				</span>
			</Link>
			{lessonTitles.length ? (
				<div className="border-t border-hairline px-3 sm:px-4">
					<details className="text-subhead">
						<summary className="min-h-11 w-full cursor-pointer rounded-md py-3 font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
							Xem chương trình
						</summary>
						<ol className="mt-1 space-y-1.5 pb-3 pl-5 leading-relaxed text-ink-secondary">
							{lessonTitles.map((lesson, index) => (
								<li key={`${index}-${lesson}`} className="list-decimal break-words">
									{lesson}
								</li>
							))}
						</ol>
					</details>
				</div>
			) : null}
		</article>
	);
}
