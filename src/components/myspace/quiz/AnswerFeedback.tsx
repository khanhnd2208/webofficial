'use client';

import type { McqCorrectOption } from './types';

interface AnswerFeedbackProps {
	isCorrect: boolean;
	correctOption: McqCorrectOption;
}

export default function AnswerFeedback({ isCorrect, correctOption }: AnswerFeedbackProps) {
	const label = isCorrect ? 'Correct.' : `Incorrect — the answer is ${correctOption}.`;

	return (
		<p
			role="status"
			aria-live="polite"
			aria-atomic="true"
			data-testid="myspace-answer-feedback"
			className={`mt-5 border-l-[3px] pl-3 font-sans text-sm font-medium leading-snug ${
				isCorrect ? 'border-success text-success' : 'border-error text-error'
			}`}
		>
			{label}
		</p>
	);
}
