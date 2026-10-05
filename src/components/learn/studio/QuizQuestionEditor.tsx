'use client';

import { useState } from 'react';

import type { LearnQuizQuestion } from '@/features/learn/types';

import LearnMarkdown from '../LearnMarkdown';
import AutoTextarea from './AutoTextarea';
import OptionListEditor from './OptionListEditor';

const LETTERS = 'ABCDEFGH';

export default function QuizQuestionEditor({
	sectionId,
	question,
	variant,
	onChange,
}: {
	sectionId: string;
	question: LearnQuizQuestion;
	variant: 'quiz' | 'practice';
	onChange: (patch: Partial<LearnQuizQuestion>) => void;
}) {
	return (
		<div className="ln-qsplit__fields">
			<label className="ln-mdfield">
				<span>Đề bài</span>
				<AutoTextarea
					className="ln-qcard__question"
					value={question.question}
					placeholder="Nội dung câu hỏi"
					onChange={(value) => onChange({ question: value })}
				/>
			</label>
			<OptionListEditor
				name={`${sectionId}-${question.id}`}
				options={question.options}
				correctIndex={question.correctIndex}
				onChange={(next) => onChange(next)}
			/>
			<label className="ln-mdfield">
				<span>Giải thích</span>
				<AutoTextarea
					className="ln-qcard__explain"
					value={question.explanation}
					placeholder={
						variant === 'practice'
							? 'Giải thích (hiện ngay khi học viên chọn)'
							: 'Giải thích đáp án (hiện sau khi nộp bài)'
					}
					onChange={(value) => onChange({ explanation: value })}
				/>
			</label>
		</div>
	);
}

export function QuizQuestionPreview({
	question,
	index,
}: {
	question: LearnQuizQuestion;
	index: number;
}) {
	const [picked, setPicked] = useState<number | null>(null);
	return (
		<div className="ln-qpreview">
			<section className="ln-stepper__card" aria-label={`Câu ${index + 1}`}>
				<div className="ln-stepper__question">
					<LearnMarkdown markdown={question.question || '_Chưa có đề bài._'} />
				</div>
				<div className="ln-options" role="radiogroup" aria-label={`Câu ${index + 1}`}>
					{question.options.map((option, optionIndex) => {
						const state =
							picked === null
								? undefined
								: optionIndex === question.correctIndex
									? 'correct'
									: optionIndex === picked
										? 'wrong'
										: 'muted';
						return (
							<button
								key={optionIndex}
								type="button"
								role="radio"
								aria-checked={picked === optionIndex}
								className="ln-option"
								data-state={state}
								onClick={() => setPicked(optionIndex)}
							>
								<span className="ln-option__letter">{LETTERS[optionIndex]}</span>
								<span>{option}</span>
							</button>
						);
					})}
				</div>
			</section>
		</div>
	);
}
