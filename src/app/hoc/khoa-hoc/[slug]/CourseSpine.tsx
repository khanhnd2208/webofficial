'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { LearnerModuleSummary } from '@/features/progress/services/learningService';

type CourseSpineProps = {
	courseSlug: string;
	modules: LearnerModuleSummary[];
	nextLessonSlug?: string;
};

/**
 * Book-spine module list — current module open by default.
 */
export default function CourseSpine({ modules, nextLessonSlug }: CourseSpineProps) {
	const currentModuleId =
		modules.find((m) => m.lessons.some((l) => l.slug === nextLessonSlug))?.id ?? modules[0]?.id;

	const [openId, setOpenId] = useState<string | null>(currentModuleId ?? null);

	return (
		<div className="relative max-w-2xl">
			{/* Vertical spine — desktop only */}
			<div aria-hidden className="absolute bottom-2 left-[11px] top-2 hidden w-px bg-hairline md:block" />

			<div className="space-y-2">
				{modules.map((mod) => {
					const open = openId === mod.id;
					const hasCurrent = mod.lessons.some((l) => l.slug === nextLessonSlug);

					return (
						<section key={mod.id} className="relative md:pl-10">
							<button
								type="button"
								onClick={() => setOpenId(open ? null : mod.id)}
								className="group flex min-h-11 w-full items-start gap-3 py-3 text-left"
								aria-expanded={open}
							>
								<span
									className={`absolute left-1.5 top-5 hidden h-[14px] w-[14px] rounded-full border md:block ${
										hasCurrent ? 'border-vermilion bg-vermilion' : 'border-hairline bg-canvas'
									}`}
									aria-hidden
								/>
								<span className="min-w-0 flex-1">
									<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
										Chương {mod.position + 1}
									</span>
									<span className="mt-0.5 block font-display text-xl font-medium text-ink group-hover:text-vermilion">
										{mod.title}
									</span>
								</span>
								<span className="mt-2 text-xs text-ink-secondary">{open ? '−' : '+'}</span>
							</button>

							{open ? (
								<ul className="mb-4 space-y-0 border-l border-hairline pl-4 md:ml-[-1px] md:pl-6">
									{mod.lessons.map((lesson) => {
										const isNext = lesson.slug === nextLessonSlug;
										return (
											<li key={lesson.id}>
												<Link
													href={lesson.href}
													className={`flex min-h-11 items-center justify-between gap-3 py-3 text-sm transition-colors ${
														isNext ? 'text-ink' : 'text-ink-secondary hover:text-ink'
													}`}
												>
													<span className={isNext ? 'font-semibold' : ''}>
														{lesson.position + 1}. {lesson.title}
													</span>
													{lesson.completed ? (
														<span className="inline-flex items-center gap-1.5 shrink-0">
															<span
																className="flex h-5 w-5 items-center justify-center rounded-full bg-vermilion text-[9px] font-bold text-paper"
																aria-hidden
															>
																✓
															</span>
															<span className="sr-only">Hoàn thành</span>
															<span className="hidden text-[10px] font-semibold uppercase tracking-wider text-vermilion sm:inline">
																Xong
															</span>
														</span>
													) : isNext ? (
														<span className="h-px w-6 bg-vermilion" aria-hidden />
													) : null}
												</Link>
											</li>
										);
									})}
								</ul>
							) : null}
						</section>
					);
				})}
			</div>
		</div>
	);
}
