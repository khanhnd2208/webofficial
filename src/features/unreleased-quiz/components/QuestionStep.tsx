'use client';

import { useEffect, useRef } from 'react';

import type { QuizQuestion } from '../content/questions';
import type { OptionKey } from '../domain/quiz';

type QuestionStepProps = {
	question: QuizQuestion;
	position: number;
	total: number;
	selected: OptionKey | undefined;
	onSelect: (key: OptionKey) => void;
	onNext: () => void;
	onBack: () => void;
	isLast: boolean;
};

export function QuestionStep({
	question,
	position,
	total,
	selected,
	onSelect,
	onNext,
	onBack,
	isLast,
}: QuestionStepProps) {
	const headingRef = useRef<HTMLHeadingElement>(null);
	const followUp = selected ? question.followUp?.[selected] : undefined;
	const percent = Math.round(((position - 1) / total) * 100);

	useEffect(() => {
		headingRef.current?.focus({ preventScroll: true });
	}, [question.id]);

	return (
		<div>
			<div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
				<span>
					Câu {position} / {total}
				</span>
				<span aria-hidden="true">UNRELEASED</span>
			</div>
			<div
				className="mt-3 h-1 w-full overflow-hidden rounded-full bg-hairline"
				role="progressbar"
				aria-label="Tiến độ quiz"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
			>
				<div
					className="h-full bg-accent transition-[width] duration-250 motion-reduce:transition-none"
					style={{ width: `${percent}%` }}
				/>
			</div>

			{question.lead ? (
				<p className="mt-8 text-sm italic text-ink-secondary">{question.lead}</p>
			) : null}

			<h2
				ref={headingRef}
				tabIndex={-1}
				className="mt-6 font-display text-2xl leading-snug text-ink outline-none md:text-3xl"
			>
				{question.prompt}
			</h2>
			{question.hint ? (
				<p className="mt-3 text-sm leading-relaxed text-ink-secondary">{question.hint}</p>
			) : null}

			<div role="radiogroup" aria-label={question.prompt} className="mt-7 grid gap-3">
				{question.options.map((option) => {
					const active = option.key === selected;
					return (
						<button
							key={option.key}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => onSelect(option.key)}
							className={`flex min-h-14 w-full items-start gap-4 rounded-[4px] border px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
								active
									? 'border-ink bg-surface-sunken text-ink ring-1 ring-ink'
									: 'border-hairline bg-paper text-ink hover:border-ink'
							}`}
						>
							<span
								aria-hidden="true"
								className={`mt-0.5 font-mono text-xs font-semibold ${active ? 'text-ink' : 'text-accent'}`}
							>
								{option.key}
							</span>
							<span className="flex-1">
								<span className="block text-base leading-relaxed">{option.text}</span>
								{option.example ? (
									<span className="mt-1 block text-sm leading-relaxed text-ink-secondary">
										{option.example}
									</span>
								) : null}
							</span>
						</button>
					);
				})}
			</div>

			{followUp ? (
				<p
					className="mt-5 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink"
					aria-live="polite"
				>
					{followUp}
				</p>
			) : null}

			<div className="mt-8 flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
				>
					← Quay lại
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={!selected}
					className="inline-flex min-h-12 items-center rounded-[4px] bg-ink px-6 text-sm font-semibold uppercase tracking-wider text-paper transition-colors duration-250 hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isLast ? 'Xem kết quả' : 'Tiếp'}
				</button>
			</div>
		</div>
	);
}
