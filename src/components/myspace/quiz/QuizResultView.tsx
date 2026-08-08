'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { routes } from '@/config/routes';

import AnswerOption from './AnswerOption';
import type { AnswerOptionState, McqCorrectOption, SessionSubmitResult } from './types';

interface QuizResultViewProps {
	title: string;
	result: SessionSubmitResult;
	onRestart: () => void;
	isPending?: boolean;
}

function reviewOptionState(
	key: McqCorrectOption,
	chosen: McqCorrectOption,
	correctOption: McqCorrectOption,
): AnswerOptionState {
	if (key === correctOption) return 'correct';
	if (key === chosen && chosen !== correctOption) return 'wrongPick';
	return 'other';
}

export default function QuizResultView({
	title,
	result,
	onRestart,
	isPending = false,
}: QuizResultViewProps) {
	const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		headingRef.current?.focus({ preventScroll: true });
	}, []);

	return (
		<main
			className="min-h-svh bg-canvas pt-20 pb-24 sm:pt-24 sm:pb-28"
			data-testid="myspace-quiz-result"
		>
			<div className="shell">
				<header className="border-t border-hairline pt-6">
					<p className="font-mono text-[0.75rem] font-semibold tracking-[0.1em] text-accent uppercase">
						Results
					</p>
					<h1
						ref={headingRef}
						tabIndex={-1}
						className="mt-4 font-display text-[clamp(2.75rem,8vw,4rem)] font-medium leading-none tracking-tight text-ink outline-none"
					>
						{result.score}
						<span className="text-ink-secondary">/{result.total}</span>
					</h1>
					<p className="mt-3 font-sans text-base text-ink-secondary">
						{pct}% · {title}
					</p>
				</header>

				<ol className="mt-10 space-y-5">
					{result.review.map((item, i) => (
						<li
							key={item.questionId}
							className="border-t border-hairline pt-5"
						>
							<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
								<span className="font-mono text-[0.8125rem] font-semibold text-ink-secondary">
									Question {i + 1}
								</span>
								<span
									className={`font-sans text-sm font-semibold ${
										item.isCorrect ? 'text-success' : 'text-error'
									}`}
								>
									{item.isCorrect ? 'Correct' : 'Incorrect'}
								</span>
							</div>
							<p className="mt-3 max-w-[62ch] font-sans text-base leading-[1.65] text-ink break-words">
								{item.stem}
							</p>
							<ul className="mt-4 border-t border-hairline">
								{item.options.map((opt) => (
									<AnswerOption
										key={opt.key}
										optionKey={opt.key}
										text={opt.text}
										state={reviewOptionState(
											opt.key,
											item.chosen,
											item.correctOption,
										)}
										readOnly
									/>
								))}
							</ul>
						</li>
					))}
				</ol>

				<div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
					<button
						type="button"
						onClick={onRestart}
						disabled={isPending}
						className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-ink bg-ink px-5 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
					>
						{isPending ? 'Preparing…' : 'Try again'}
					</button>
					<Link
						href={routes.mySpaceTests}
						className="font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
					>
						← Tests
					</Link>
				</div>
			</div>
		</main>
	);
}
