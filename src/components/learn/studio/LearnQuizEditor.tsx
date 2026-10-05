'use client';

import { useState } from 'react';

import { newQuestionId } from '@/features/learn/content';
import { quizIssues } from '@/features/learn/questionHealth';
import type { LearnQuiz, LearnQuizQuestion } from '@/features/learn/types';

import { StudioIcon } from './icons';
import QuestionNavigator from './QuestionNavigator';
import QuizQuestionEditor, { QuizQuestionPreview } from './QuizQuestionEditor';
import { useWideStudio } from './StudioTabs';
import { useQuestionDelete } from './useDeferredDeletes';

function emptyQuestion(): LearnQuizQuestion {
	return {
		id: newQuestionId(),
		question: '',
		options: ['', '', '', ''],
		correctIndex: 0,
		explanation: '',
	};
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
	const [activeId, setActiveId] = useState<string | null>(quiz.questions[0]?.id ?? null);
	const [pane, setPane] = useState<'edit' | 'preview'>('edit');
	const wide = useWideStudio();

	function setQuestions(questions: LearnQuizQuestion[]) {
		onChange({ ...quiz, questions });
	}
	const questions = useQuestionDelete(quiz.questions, setQuestions);
	const visible = questions.visible;
	const activeIndex = Math.max(
		0,
		visible.findIndex((item) => item.id === activeId),
	);
	const active = visible[activeIndex] ?? null;

	function update(id: string, patch: Partial<LearnQuizQuestion>) {
		setQuestions(quiz.questions.map((item) => (item.id === id ? { ...item, ...patch } : item)));
	}

	function duplicate(id: string) {
		const index = quiz.questions.findIndex((item) => item.id === id);
		if (index < 0) return;
		const copy = { ...quiz.questions[index], id: newQuestionId() };
		const next = [...quiz.questions];
		next.splice(index + 1, 0, copy);
		setQuestions(next);
		setActiveId(copy.id);
	}

	return (
		<div className="ln-qsplit" data-pane={pane}>
			{variant === 'quiz' ? (
				<div className="ln-quizedit__settings">
					<label>
						<span>Điểm đạt</span>
						<span className="ln-affix">
							<input
								type="number"
								min={0}
								max={100}
								aria-label="Điểm đạt"
								value={quiz.passingScorePercent}
								onChange={(event) =>
									onChange({
										...quiz,
										passingScorePercent: Math.min(
											100,
											Math.max(0, Number(event.target.value) || 0),
										),
									})
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
								aria-label="Giới hạn thời gian"
								placeholder="Không"
								value={quiz.timeLimitMinutes ?? ''}
								onChange={(event) => {
									const minutes = Number(event.target.value);
									onChange({
										...quiz,
										timeLimitMinutes: minutes > 0 ? Math.min(600, minutes) : null,
									});
								}}
							/>
							phút
						</span>
					</label>
				</div>
			) : null}

			<details className="ln-qsplit__nav" open={wide || undefined}>
				<summary>Danh sách câu ({visible.length})</summary>
				<QuestionNavigator
					items={visible.map((item, index) => ({
						id: item.id,
						title: item.question.trim().slice(0, 80) || `Câu ${index + 1}`,
						issues: quizIssues(item),
						group: null,
					}))}
					activeId={active?.id ?? null}
					onSelect={setActiveId}
					onReorder={(ids) => {
						const byId = new Map(quiz.questions.map((item) => [item.id, item]));
						setQuestions(ids.map((id) => byId.get(id)!).filter(Boolean));
					}}
					onDuplicate={duplicate}
					onDelete={(id) => {
						const index = visible.findIndex((item) => item.id === id);
						if (index >= 0) questions.removeAt(index);
					}}
				/>
			</details>

			<div className="ln-qsplit__switch" role="tablist" aria-label="Vùng soạn">
				<button
					type="button"
					role="tab"
					aria-selected={pane === 'edit'}
					onClick={() => setPane('edit')}
				>
					Soạn
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={pane === 'preview'}
					onClick={() => setPane('preview')}
				>
					Xem trước
				</button>
			</div>

			{active ? (
				<QuizQuestionEditor
					sectionId={sectionId}
					question={active}
					variant={variant}
					onChange={(patch) => update(active.id, patch)}
				/>
			) : (
				<p className="ln-empty-hint">
					Chưa có câu hỏi. Thêm từng câu hoặc dán cả loạt từ tài liệu.
				</p>
			)}

			<div className="ln-qsplit__preview">
				<p className="ln-eyebrow">Xem như học viên</p>
				{active ? <QuizQuestionPreview question={active} index={activeIndex} /> : null}
			</div>

			<div className="ln-qsplit__actions">
				<button
					type="button"
					className="ln-btn"
					onClick={() => {
						const created = emptyQuestion();
						setQuestions([...quiz.questions, created]);
						setActiveId(created.id);
					}}
				>
					<StudioIcon name="plus" size={14} /> Thêm câu hỏi
				</button>
				<button type="button" className="ln-btn" onClick={onOpenImport}>
					<StudioIcon name="import" size={14} /> Nhập bằng AI
				</button>
			</div>
			{questions.toast}
		</div>
	);
}
