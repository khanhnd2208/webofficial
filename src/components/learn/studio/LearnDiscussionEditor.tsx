'use client';

import { useState } from 'react';

import { newQuestionId } from '@/features/learn/content';
import type { LearnDiscussion, LearnDiscussionQuestion } from '@/features/learn/types';

import LearnMarkdown from '../LearnMarkdown';
import AutoTextarea from './AutoTextarea';
import { StudioIcon } from './icons';

function emptyQuestion(): LearnDiscussionQuestion {
	return { id: newQuestionId(), question: '', answer: '' };
}

export default function LearnDiscussionEditor({
	discussion,
	onChange,
	onOpenImport,
}: {
	discussion: LearnDiscussion;
	onChange: (discussion: LearnDiscussion) => void;
	onOpenImport: () => void;
}) {
	const [previewId, setPreviewId] = useState<string | null>(null);

	function setQuestions(questions: LearnDiscussionQuestion[]) {
		onChange({ questions });
	}

	function update(index: number, patch: Partial<LearnDiscussionQuestion>) {
		setQuestions(
			discussion.questions.map((question, i) =>
				i === index ? { ...question, ...patch } : question,
			),
		);
	}

	function move(index: number, step: number) {
		const target = index + step;
		if (target < 0 || target >= discussion.questions.length) return;
		const next = [...discussion.questions];
		[next[index], next[target]] = [next[target], next[index]];
		setQuestions(next);
	}

	return (
		<div className="ln-quizedit">
			<p className="text-sm text-ink-secondary">
				{discussion.questions.length} câu · đáp án mẫu hiện khi học viên bấm
			</p>
			{discussion.questions.length ? (
				<ol className="ln-qlist">
					{discussion.questions.map((question, index) => (
						<li key={question.id} className="ln-qcard">
							<div className="ln-qcard__head">
								<span className="ln-qcard__number">Câu {index + 1}</span>
								<span className="ml-auto flex gap-1">
									<button
										type="button"
										className="ln-icon-btn"
										onClick={() => move(index, -1)}
										disabled={index === 0}
										aria-label="Lên"
									>
										<StudioIcon name="up" size={14} />
									</button>
									<button
										type="button"
										className="ln-icon-btn"
										onClick={() => move(index, 1)}
										disabled={index === discussion.questions.length - 1}
										aria-label="Xuống"
									>
										<StudioIcon name="down" size={14} />
									</button>
									<button
										type="button"
										className="ln-icon-btn ln-icon-btn--danger"
										aria-label="Xóa câu hỏi"
										onClick={() => setQuestions(discussion.questions.filter((_, i) => i !== index))}
									>
										<StudioIcon name="trash" size={14} />
									</button>
								</span>
							</div>
							<AutoTextarea
								className="ln-qcard__question"
								value={question.question}
								placeholder="Câu hỏi (markdown)"
								onChange={(value) => update(index, { question: value })}
							/>
							<AutoTextarea
								className="ln-qcard__explain"
								value={question.answer}
								placeholder="Đáp án mẫu (markdown)"
								onChange={(value) => update(index, { answer: value })}
							/>
							<button
								type="button"
								className="ln-link-btn"
								onClick={() =>
									setPreviewId((current) => (current === question.id ? null : question.id))
								}
							>
								{previewId === question.id ? 'Ẩn xem trước' : 'Xem trước'}
							</button>
							{previewId === question.id ? (
								<div className="ln-sample">
									<LearnMarkdown markdown={question.question || '_Chưa có câu hỏi._'} />
									<LearnMarkdown markdown={question.answer || '_Chưa có đáp án mẫu._'} />
								</div>
							) : null}
						</li>
					))}
				</ol>
			) : (
				<p className="ln-empty-hint">
					Chưa có câu hỏi. Thêm từng câu hoặc dán cả loạt từ tài liệu / AI.
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className="ln-btn"
					onClick={() => setQuestions([...discussion.questions, emptyQuestion()])}
				>
					<StudioIcon name="plus" size={14} /> Thêm câu hỏi
				</button>
				<button type="button" className="ln-btn" onClick={onOpenImport}>
					<StudioIcon name="import" size={14} /> Nhập bằng AI
				</button>
			</div>
		</div>
	);
}
