'use client';

import { newQuestionId } from '@/features/learn/content';
import type { LearnQuiz, LearnQuizQuestion } from '@/features/learn/types';

import AutoTextarea from './AutoTextarea';
import { StudioIcon } from './icons';
import OptionListEditor from './OptionListEditor';

function emptyQuestion(): LearnQuizQuestion {
	return { id: newQuestionId(), question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
}

export default function LearnQuizEditor({
	sectionId,
	quiz,
	onChange,
	onOpenImport,
	variant = 'quiz',
}: {
	sectionId: string;
	quiz: LearnQuiz;
	onChange: (quiz: LearnQuiz) => void;
	onOpenImport: () => void;
	variant?: 'quiz' | 'practice';
}) {
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
			{variant === 'quiz' ? (
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
			) : (
				<p className="text-sm text-ink-secondary">{quiz.questions.length} câu · học viên thấy đáp án ngay khi chọn</p>
			)}

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
								placeholder={variant === 'practice' ? 'Giải thích (hiện ngay khi học viên chọn)' : 'Giải thích đáp án (hiện sau khi nộp bài)'}
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
				<button type="button" className="ln-btn" onClick={onOpenImport}>
					<StudioIcon name="import" size={14} /> Nhập bằng AI
				</button>
			</div>
		</div>
	);
}
