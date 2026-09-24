'use client';

import { useState } from 'react';

import type { LearnCheckpoint } from '@/features/learn/types';

const LETTERS = 'ABCDEFGH';

/** Low-stakes self-check at the end of a reading; nothing is recorded. */
export default function LearnCheckpointCard({ checkpoint }: { checkpoint: LearnCheckpoint }) {
	const [picked, setPicked] = useState<number | null>(null);
	const answered = picked !== null;

	return (
		<section className="ln-check" aria-label="Câu hỏi nhanh">
			<p className="ln-check__label">Câu hỏi nhanh</p>
			<p className="ln-check__question">{checkpoint.question}</p>
			<div className="ln-options" role="radiogroup">
				{checkpoint.options.map((option, index) => {
					const state = !answered
						? undefined
						: index === checkpoint.correctIndex
							? 'correct'
							: index === picked
								? 'wrong'
								: 'muted';
					return (
						<button
							key={index}
							type="button"
							role="radio"
							aria-checked={picked === index}
							className="ln-option"
							data-state={state}
							disabled={answered}
							onClick={() => setPicked(index)}
						>
							<span className="ln-option__letter">{LETTERS[index]}</span>
							<span>{option}</span>
						</button>
					);
				})}
			</div>
			{answered ? (
				<div className="ln-check__result">
					<p className="font-medium">{picked === checkpoint.correctIndex ? 'Chính xác.' : 'Chưa đúng.'}</p>
					{checkpoint.explanation ? <p>{checkpoint.explanation}</p> : null}
					<button type="button" className="ln-link-btn" onClick={() => setPicked(null)}>
						Thử lại
					</button>
				</div>
			) : null}
		</section>
	);
}
