'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/format';
import type { LearnCurriculumLesson } from '@/features/learn/progress';

import { LEARN_SECTION_KIND_SHORT, type LearnSectionKind } from '@/features/learn/types';

import { LearnIcon, type LearnIconName } from './LearnIcon';
import LearnLinkPending from './LearnLinkPending';

const SECTION_ICONS: Record<LearnSectionKind, LearnIconName> = {
	READING: 'reading',
	QUIZ: 'quiz',
	PRACTICE: 'practice',
	DISCUSSION: 'discussion',
};

/**
 * Lesson accordion with per-section status. The overview shows it full width; the player
 * shows the compact variant in its sidebar with the current section highlighted.
 */
export default function LearnCurriculum({
	courseSlug,
	lessons,
	openLessonId,
	currentId,
	compact = false,
}: {
	courseSlug: string;
	lessons: LearnCurriculumLesson[];
	openLessonId?: string;
	currentId?: string;
	compact?: boolean;
}) {
	const [open, setOpen] = useState<Set<string>>(() => new Set(openLessonId ? [openLessonId] : []));
	const [trackedLessonId, setTrackedLessonId] = useState(openLessonId);
	const currentRef = useRef<HTMLAnchorElement>(null);
	const allOpen = lessons.length > 0 && lessons.every((lesson) => open.has(lesson.id));

	if (openLessonId !== trackedLessonId) {
		setTrackedLessonId(openLessonId);
		if (openLessonId) {
			setOpen((current) => {
				if (current.has(openLessonId)) return current;
				const nextSet = new Set(current);
				nextSet.add(openLessonId);
				return nextSet;
			});
		}
	}

	useEffect(() => {
		currentRef.current?.scrollIntoView?.({ block: 'nearest' });
	}, [currentId]);

	function toggle(id: string) {
		setOpen((current) => {
			const nextSet = new Set(current);
			if (nextSet.has(id)) nextSet.delete(id);
			else nextSet.add(id);
			return nextSet;
		});
	}

	return (
		<div className="ln-curriculum" data-compact={compact ? 'true' : undefined}>
			{!compact && lessons.length > 1 ? (
				<div className="ln-curriculum__tools">
					<button
						type="button"
						className="ln-link-btn"
						onClick={() => setOpen(allOpen ? new Set() : new Set(lessons.map((lesson) => lesson.id)))}
					>
						{allOpen ? 'Thu gọn tất cả' : 'Mở tất cả'}
					</button>
				</div>
			) : null}
			{lessons.map((lesson) => {
				const isOpen = open.has(lesson.id);
				const done = lesson.completedCount === lesson.sections.length && lesson.sections.length > 0;
				const panelId = `ln-lesson-${lesson.id}`;
				return (
					<div key={lesson.id} className="ln-lesson" data-open={isOpen ? 'true' : undefined}>
						<button
							type="button"
							className="ln-lesson__head"
							aria-expanded={isOpen}
							aria-controls={panelId}
							onClick={() => toggle(lesson.id)}
						>
							<span className="ln-lesson__chevron">
								<LearnIcon name="chevronDown" size={16} />
							</span>
							<span className="min-w-0 flex-1">
								<span className="ln-lesson__label">Bài {lesson.index + 1}</span>
								<span className="ln-lesson__title">{lesson.title}</span>
							</span>
							<span className="ln-lesson__meta tabular-nums" data-done={done ? 'true' : undefined}>
								{done ? <LearnIcon name="checkCircle" size={15} /> : null}
								{lesson.completedCount}/{lesson.sections.length}
								{compact ? null : <span className="ln-lesson__minutes"> · {formatMinutes(lesson.minutes)}</span>}
							</span>
						</button>
						{isOpen ? (
							<ol id={panelId} className="ln-lesson__items">
								{!compact && lesson.description ? <li className="ln-lesson__desc">{lesson.description}</li> : null}
								{lesson.sections.map((section) => {
									const active = section.id === currentId;
									const result = section.quizResult;
									return (
										<li key={section.id}>
											<Link
												ref={active ? currentRef : undefined}
												href={routes.learnCourse(courseSlug, section.id)}
												className="ln-item"
												aria-current={active ? 'page' : undefined}
												data-done={section.completed ? 'true' : undefined}
											>
												<span className="ln-item__status" aria-hidden="true">
													{section.completed ? (
														<LearnIcon name="check" size={12} strokeWidth={3} />
													) : null}
												</span>
												<span className="ln-item__body">
													<span className="ln-item__title">{section.title}</span>
													<span className="ln-item__meta">
														<LearnIcon name={SECTION_ICONS[section.type]} size={13} />
														{LEARN_SECTION_KIND_SHORT[section.type]} · {section.minutes} phút
														{section.hasNote ? (
															<span className="ln-item__note" title="Có ghi chú">
																<LearnIcon name="note" size={13} />
															</span>
														) : null}
													</span>
												</span>
												{result ? (
													<span className="ln-item__score tabular-nums" data-passed={result.passed ? 'true' : 'false'}>
														{result.percentage}%
													</span>
												) : null}
												<span className="sr-only">
													{section.completed ? '(đã hoàn thành)' : ''}
													{active ? '(đang xem)' : ''}
												</span>
												<LearnLinkPending />
											</Link>
										</li>
									);
								})}
							</ol>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
