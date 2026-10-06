'use client';

import { GRAPHIC_COLORS } from '@/config/graphicColors';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { routes } from '@/config/routes';

import AnswerOption from './AnswerOption';
import type { AnswerOptionState, McqCorrectOption, SessionSubmitResult } from './types';

interface QuizResultViewProps {
	title: string;
	result: SessionSubmitResult;
	completionNote?: string;
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

function celebrateCompletion() {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

	void import('canvas-confetti').then(({ default: fireConfetti }) => {
		const colors = [
			GRAPHIC_COLORS['9a6b2b'],
			GRAPHIC_COLORS['d4a34e'],
			GRAPHIC_COLORS['f5e6c5'],
			GRAPHIC_COLORS['1c1b1a'],
		];
		const shared = {
			colors,
			decay: 0.92,
			gravity: 1.05,
			particleCount: 72,
			spread: 68,
			startVelocity: 46,
			ticks: 240,
		};

		fireConfetti({ ...shared, angle: 58, origin: { x: 0.08, y: 0.72 } });
		fireConfetti({ ...shared, angle: 122, origin: { x: 0.92, y: 0.72 } });
	});
}

export default function QuizResultView({
	title,
	result,
	completionNote,
	onRestart,
	isPending = false,
}: QuizResultViewProps) {
	const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
	const headingRef = useRef<HTMLHeadingElement>(null);
	const [isCompletionNoteVisible, setIsCompletionNoteVisible] = useState(true);

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
					<p className="font-mono text-[12px] font-semibold tracking-[0.1em] text-accent uppercase">
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
					{completionNote && isCompletionNoteVisible ? (
						<aside
							aria-label="Lời chúc từ thầy"
							className="mt-6 flex max-w-xl flex-col gap-4 border border-accent/60 bg-accent/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
							data-testid="myspace-quiz-completion-note"
						>
							<div>
								<p className="font-sans text-base font-medium leading-relaxed text-ink">
									{completionNote}
								</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setIsCompletionNoteVisible(false);
									celebrateCompletion();
									window.requestAnimationFrame(() => headingRef.current?.focus());
								}}
								className="inline-flex min-h-11 shrink-0 items-center justify-center border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								Nhận lời chúc{' '}
								<span aria-hidden className="ml-2">
									✓
								</span>
							</button>
						</aside>
					) : null}
				</header>

				<ol className="mt-10 space-y-5">
					{result.review.map((item, i) => (
						<li key={item.questionId} className="border-t border-hairline pt-5">
							<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
								<span className="font-mono text-[13px] font-semibold text-ink-secondary">
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
										state={reviewOptionState(opt.key, item.chosen, item.correctOption)}
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
