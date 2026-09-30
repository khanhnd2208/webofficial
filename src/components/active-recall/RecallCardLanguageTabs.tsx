'use client';

import { useState } from 'react';

import { recallHasContent } from '@/features/active-recall/richText';

import RecallRichTextEditor from './RecallRichTextEditor';

export default function RecallCardLanguageTabs({
	question,
	answer,
	questionVi,
	answerVi,
	onChangeQuestion,
	onChangeAnswer,
	onChangeQuestionVi,
	onChangeAnswerVi,
	idPrefix,
}: {
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
	onChangeQuestion: (value: string) => void;
	onChangeAnswer: (value: string) => void;
	onChangeQuestionVi: (value: string) => void;
	onChangeAnswerVi: (value: string) => void;
	idPrefix: string;
}) {
	const [tab, setTab] = useState<'original' | 'vi'>('original');
	const hasVi = recallHasContent(questionVi) || recallHasContent(answerVi);

	return (
		<div className="grid gap-2 sm:grid-cols-2">
			<div className="flex items-center gap-1 sm:col-span-2">
				<button
					type="button"
					onClick={() => setTab('original')}
					aria-pressed={tab === 'original'}
					className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
						tab === 'original'
							? 'bg-foreground text-background'
							: 'text-muted hover:bg-background hover:text-foreground'
					}`}
				>
					Gốc
				</button>
				<button
					type="button"
					onClick={() => setTab('vi')}
					aria-pressed={tab === 'vi'}
					className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
						tab === 'vi'
							? 'bg-foreground text-background'
							: 'text-muted hover:bg-background hover:text-foreground'
					}`}
				>
					🇻🇳 Tiếng Việt{!hasVi ? ' (chưa có)' : ''}
				</button>
			</div>
			{/* Cả 2 bộ editor luôn mount, chỉ ẩn bằng CSS — tránh mất nội dung khi tiptap bị hủy/tạo lại. */}
			<div className={tab === 'original' ? 'contents' : 'hidden'}>
				<div>
					<p
						id={`${idPrefix}-question`}
						className="text-xs font-bold uppercase tracking-wide text-muted"
					>
						Câu hỏi
					</p>
					<RecallRichTextEditor
						value={question}
						onChange={onChangeQuestion}
						labelledBy={`${idPrefix}-question`}
						placeholder="What is **HRM**?"
					/>
				</div>
				<div>
					<p
						id={`${idPrefix}-answer`}
						className="text-xs font-bold uppercase tracking-wide text-muted"
					>
						Đáp án
					</p>
					<RecallRichTextEditor
						value={answer}
						onChange={onChangeAnswer}
						labelledBy={`${idPrefix}-answer`}
						placeholder="A *system*…"
					/>
				</div>
			</div>
			<div className={tab === 'vi' ? 'contents' : 'hidden'}>
				<div>
					<p
						id={`${idPrefix}-question-vi`}
						className="text-xs font-bold uppercase tracking-wide text-muted"
					>
						Câu hỏi (Tiếng Việt)
					</p>
					<RecallRichTextEditor
						value={questionVi}
						onChange={onChangeQuestionVi}
						labelledBy={`${idPrefix}-question-vi`}
						placeholder="HRM là gì?"
					/>
				</div>
				<div>
					<p
						id={`${idPrefix}-answer-vi`}
						className="text-xs font-bold uppercase tracking-wide text-muted"
					>
						Đáp án (Tiếng Việt)
					</p>
					<RecallRichTextEditor
						value={answerVi}
						onChange={onChangeAnswerVi}
						labelledBy={`${idPrefix}-answer-vi`}
						placeholder="Một *hệ thống*…"
					/>
				</div>
			</div>
		</div>
	);
}
