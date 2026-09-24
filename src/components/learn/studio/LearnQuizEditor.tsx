'use client';

import { useState } from 'react';

import { newQuestionId } from '@/features/learn/content';
import { LEARN_QUIZ_PROMPT } from '@/features/learn/prompts';
import { parseQuizPaste } from '@/features/learn/quizImport';
import type { LearnQuiz, LearnQuizQuestion } from '@/features/learn/types';

import { StudioIcon } from './icons';
import OptionListEditor from './OptionListEditor';
import StudioDialog from './StudioDialog';
import { useCopy } from './useCopy';

function emptyQuestion(): LearnQuizQuestion {
	return { id: newQuestionId(), question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
}

function AutoTextarea({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	className: string;
}) {
	return (
		<textarea
			className={className}
			value={value}
			placeholder={placeholder}
			rows={1}
			onChange={(event) => onChange(event.target.value)}
			style={{ fieldSizing: 'content' } as React.CSSProperties}
		/>
	);
}

function QuizPasteDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (questions: LearnQuizQuestion[]) => void }) {
	const [text, setText] = useState('');
	const parsed = parseQuizPaste(text);
	const { copied, copy } = useCopy();

	return (
		<StudioDialog
			title="Dán nhiều câu hỏi"
			onClose={onClose}
			footer={
				<>
					<button type="button" className="ln-btn" onClick={onClose}>
						Hủy
					</button>
					<button
						type="button"
						className="ln-btn ln-btn--primary"
						disabled={!parsed.questions.length}
						onClick={() => onAdd(parsed.questions)}
					>
						Thêm {parsed.questions.length || ''} câu
					</button>
				</>
			}
		>
			<div className="ln-split">
				<div className="flex min-h-0 flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm text-ink-secondary">Mỗi câu: câu hỏi, các dòng A. B. C., rồi “Đáp án: B”.</p>
						<button type="button" className="ln-link-btn" onClick={() => copy(LEARN_QUIZ_PROMPT)}>
							<StudioIcon name="copy" size={14} /> {copied ? 'Đã chép prompt' : 'Chép prompt AI'}
						</button>
					</div>
					<textarea
						autoFocus
						className="ln-editor__source min-h-[18rem] flex-1"
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder={'Câu 1: Mâu thuẫn biện chứng là gì?\nA. Sai sót của tư duy\nB. Nguồn gốc của vận động\nC. Hiện tượng ngẫu nhiên\nĐáp án: B\nGiải thích: …'}
					/>
				</div>
				<div className="ln-preview">
					<p className="ln-preview__label">Xem trước · {parsed.questions.length} câu</p>
					{parsed.warnings.map((warning) => (
						<p key={warning} className="ln-warning">
							{warning}
						</p>
					))}
					<ol className="ln-preview__list">
						{parsed.questions.map((question, index) => (
							<li key={question.id}>
								<p className="font-medium">
									{index + 1}. {question.question || <em>(chưa có câu hỏi)</em>}
								</p>
								<ul>
									{question.options.map((option, optionIndex) => (
										<li key={optionIndex} data-correct={optionIndex === question.correctIndex ? 'true' : undefined}>
											{'ABCDEFGH'[optionIndex]}. {option}
										</li>
									))}
								</ul>
							</li>
						))}
					</ol>
				</div>
			</div>
		</StudioDialog>
	);
}

export default function LearnQuizEditor({
	sectionId,
	quiz,
	onChange,
}: {
	sectionId: string;
	quiz: LearnQuiz;
	onChange: (quiz: LearnQuiz) => void;
}) {
	const [pasteOpen, setPasteOpen] = useState(false);

	function setQuestions(questions: LearnQuizQuestion[]) {
		onChange({ ...quiz, questions });
	}

	function update(index: number, patch: Partial<LearnQuizQuestion>) {
		setQuestions(quiz.questions.map((question, i) => (i === index ? { ...question, ...patch } : question)));
	}

	function move(index: number, step: number) {
		const target = index + step;
		if (target < 0 || target >= quiz.questions.length) return;
		const next = [...quiz.questions];
		[next[index], next[target]] = [next[target], next[index]];
		setQuestions(next);
	}

	function addQuestion() {
		setQuestions([...quiz.questions, emptyQuestion()]);
		requestAnimationFrame(() =>
			document.querySelector<HTMLTextAreaElement>('.ln-qcard:last-of-type .ln-qcard__question')?.focus(),
		);
	}

	return (
		<div className="ln-quizedit">
			<div className="ln-quizedit__settings">
				<label>
					<span>Điểm đạt</span>
					<span className="ln-affix">
						<input
							type="number"
							min={0}
							max={100}
							value={quiz.passingScorePercent}
							onChange={(event) =>
								onChange({ ...quiz, passingScorePercent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })
							}
						/>
						%
					</span>
				</label>
				<label>
					<span>Giới hạn thời gian</span>
					<span className="ln-affix">
						<input
							type="number"
							min={0}
							max={600}
							placeholder="Không"
							value={quiz.timeLimitMinutes ?? ''}
							onChange={(event) => {
								const minutes = Number(event.target.value);
								onChange({ ...quiz, timeLimitMinutes: minutes > 0 ? Math.min(600, minutes) : null });
							}}
						/>
						phút
					</span>
				</label>
				<span className="ml-auto text-sm text-ink-secondary tabular-nums">{quiz.questions.length} câu hỏi</span>
			</div>

			{quiz.questions.length ? (
				<ol className="ln-qlist">
					{quiz.questions.map((question, index) => (
						<li key={question.id} className="ln-qcard">
							<div className="ln-qcard__head">
								<span className="ln-qcard__number">Câu {index + 1}</span>
								<span className="ml-auto flex gap-1">
									<button type="button" className="ln-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Lên">
										<StudioIcon name="up" size={14} />
									</button>
									<button
										type="button"
										className="ln-icon-btn"
										onClick={() => move(index, 1)}
										disabled={index === quiz.questions.length - 1}
										aria-label="Xuống"
									>
										<StudioIcon name="down" size={14} />
									</button>
									<button
										type="button"
										className="ln-icon-btn"
										aria-label="Nhân bản"
										onClick={() => {
											const next = [...quiz.questions];
											next.splice(index + 1, 0, { ...question, id: newQuestionId() });
											setQuestions(next);
										}}
									>
										<StudioIcon name="duplicate" size={14} />
									</button>
									<button
										type="button"
										className="ln-icon-btn ln-icon-btn--danger"
										aria-label="Xóa câu hỏi"
										onClick={() => setQuestions(quiz.questions.filter((_, i) => i !== index))}
									>
										<StudioIcon name="trash" size={14} />
									</button>
								</span>
							</div>
							<AutoTextarea
								className="ln-qcard__question"
								value={question.question}
								placeholder="Nội dung câu hỏi"
								onChange={(value) => update(index, { question: value })}
							/>
							<OptionListEditor
								name={`${sectionId}-${question.id}`}
								options={question.options}
								correctIndex={question.correctIndex}
								onChange={(next) => update(index, next)}
							/>
							<AutoTextarea
								className="ln-qcard__explain"
								value={question.explanation}
								placeholder="Giải thích đáp án (hiện sau khi nộp bài)"
								onChange={(value) => update(index, { explanation: value })}
							/>
						</li>
					))}
				</ol>
			) : (
				<p className="ln-empty-hint">Chưa có câu hỏi. Thêm từng câu hoặc dán cả loạt từ tài liệu / AI.</p>
			)}

			<div className="flex flex-wrap gap-2">
				<button type="button" className="ln-btn" onClick={addQuestion}>
					<StudioIcon name="plus" size={14} /> Thêm câu hỏi
				</button>
				<button type="button" className="ln-btn" onClick={() => setPasteOpen(true)}>
					<StudioIcon name="import" size={14} /> Dán nhiều câu
				</button>
			</div>

			{pasteOpen ? (
				<QuizPasteDialog
					onClose={() => setPasteOpen(false)}
					onAdd={(questions) => {
						setQuestions([...quiz.questions, ...questions]);
						setPasteOpen(false);
					}}
				/>
			) : null}
		</div>
	);
}
