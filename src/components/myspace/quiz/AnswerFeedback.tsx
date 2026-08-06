'use client';

import type { McqCorrectOption } from './types';

interface AnswerFeedbackProps {
	isCorrect: boolean;
	correctOption: McqCorrectOption;
}

export default function AnswerFeedback({ isCorrect, correctOption }: AnswerFeedbackProps) {
	const label = isCorrect
		? 'Đúng'
		: `Chưa đúng. Đáp án đúng: ${correctOption}`;

	return (
		<div
			role="status"
			aria-live="polite"
			aria-atomic="true"
			data-testid="myspace-answer-feedback"
			className={`mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] border-l-[3px] px-4 py-3.5 ${
				isCorrect
					? 'border-success bg-success-subtle'
					: 'border-error bg-error-subtle'
			}`}
		>
			<span
				className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-canvas ${
					isCorrect ? 'bg-success' : 'bg-error'
				}`}
				aria-hidden
			>
				{isCorrect ? '✓' : '✕'}
			</span>
			<div className="min-w-0 pt-0.5">
				<p className="font-sans text-[0.9375rem] font-semibold leading-snug text-ink">
					{isCorrect ? 'Đúng' : 'Chưa đúng'}
				</p>
				{!isCorrect ? (
					<p className="mt-1 font-sans text-sm leading-snug text-ink">
						Đáp án đúng: <span className="font-semibold">{correctOption}</span>
					</p>
				) : null}
				<span className="sr-only">{label}</span>
			</div>
		</div>
	);
}
