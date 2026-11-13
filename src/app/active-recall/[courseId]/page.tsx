import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { routes } from '@/config/routes';
import { getPublishedRecallCourse } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

const getCourse = cache(getPublishedRecallCourse);
type PageProps = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const course = await getCourse((await params).courseId);
	return {
		title: course ? `Active Recall · ${course.courseName}` : 'Active Recall',
		robots: { index: false, follow: false },
	};
}

export default async function PublicCourseRecallPage({ params }: PageProps) {
	const { courseId } = await params;
	const course = await getCourse(courseId);
	if (!course) notFound();

	return (
		<main className="min-h-svh bg-canvas px-5 py-12 sm:px-8 sm:py-20">
			<div className="mx-auto max-w-3xl">
				<header className="border-t border-hairline pt-5">
					<p className="text-sm font-semibold text-ink-secondary">Active Recall</p>
					<h1 className="mt-2 font-display text-[clamp(2rem,6vw,3.75rem)] font-medium tracking-tight text-ink">
						{course.courseName}
					</h1>
					<p className="mt-3 text-base leading-relaxed text-ink-secondary">
						Chọn một bài để ôn. Tự trả lời rồi lật thẻ để đối chiếu.
					</p>
				</header>
				<ul className="mt-9 border-t border-hairline" aria-label="Các bộ thẻ của môn">
					{course.decks.map((deck) => (
						<li key={deck.slug}>
							<Link
								href={routes.publicCourseRecallDeck(courseId, deck.slug)}
								className="recall-deck-row group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
							>
								<div className="recall-stack-mark" aria-hidden="true">
									<i />
									<i />
									<i />
								</div>
								<div className="min-w-0 flex-1">
									{deck.lessonLabel && deck.lessonLabel !== deck.title ? (
										<p className="text-sm text-ink-secondary">{deck.lessonLabel}</p>
									) : null}
									<h2 className="font-display text-xl font-medium tracking-tight text-ink group-hover:text-bronze sm:text-2xl">
										{deck.title}
									</h2>
									{deck.description ? (
										<p className="mt-1 text-sm leading-relaxed text-ink-secondary">
											{deck.description}
										</p>
									) : null}
								</div>
								<span className="shrink-0 text-sm text-ink-secondary">
									{deck._count.cards} thẻ <span aria-hidden="true">→</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</main>
	);
}
