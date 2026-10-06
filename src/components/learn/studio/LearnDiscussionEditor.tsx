'use client';

import { useState } from 'react';

import { newQuestionId } from '@/features/learn/content';
import { discussionQuestionViews } from '@/features/learn/discussionView';
import { discussionIssues } from '@/features/learn/questionHealth';
import type { LearnDiscussion, LearnDiscussionQuestion } from '@/features/learn/types';

import DiscussionQuestionCard from '../DiscussionQuestionCard';
import DiscussionQuestionEditor from './DiscussionQuestionEditor';
import { StudioIcon } from './icons';
import QuestionNavigator from './QuestionNavigator';
import { useWideStudio } from './StudioTabs';
import { useQuestionDelete } from './useDeferredDeletes';

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
	const [activeId, setActiveId] = useState<string | null>(discussion.questions[0]?.id ?? null);
	const [pane, setPane] = useState<'prompt' | 'answer' | 'preview'>('prompt');
	const [previewOpen, setPreviewOpen] = useState(false);
	const wide = useWideStudio();

	function setQuestions(questions: LearnDiscussionQuestion[]) {
		onChange({ questions });
	}
	const questions = useQuestionDelete(discussion.questions, setQuestions);
	const visible = questions.visible;
	const views = discussionQuestionViews(visible.map((item) => item.question));
	const activeIndex = Math.max(
		0,
		visible.findIndex((item) => item.id === activeId),
	);
	const active = visible[activeIndex] ?? null;
	const view = views[activeIndex];

	function update(id: string, patch: Partial<LearnDiscussionQuestion>) {
		setQuestions(
			discussion.questions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);
	}

	function reorder(ids: string[]) {
		const byId = new Map(discussion.questions.map((item) => [item.id, item]));
		setQuestions(ids.map((id) => byId.get(id)!).filter(Boolean));
	}

	function duplicate(id: string) {
		const index = discussion.questions.findIndex((item) => item.id === id);
		if (index < 0) return;
		const copy = { ...discussion.questions[index], id: newQuestionId() };
		const next = [...discussion.questions];
		next.splice(index + 1, 0, copy);
		setQuestions(next);
		setActiveId(copy.id);
	}

	return (
		<div className="ln-qsplit" data-pane={pane}>
			<details className="ln-qsplit__nav" open={wide || undefined}>
				<summary>Danh sách câu ({visible.length})</summary>
				<QuestionNavigator
					items={visible.map((item, index) => ({
						id: item.id,
						title: views[index]?.title || `Câu ${index + 1}`,
						issues: discussionIssues(item, views[index]),
						group: views[index]?.part ?? null,
					}))}
					activeId={active?.id ?? null}
					onSelect={setActiveId}
					onReorder={reorder}
					onDuplicate={duplicate}
					onDelete={(id) => {
						const index = visible.findIndex((item) => item.id === id);
						if (index >= 0) questions.removeAt(index);
					}}
				/>
			</details>

			<div className="ln-qsplit__switch" role="tablist" aria-label="Vùng soạn">
				{(
					[
						['prompt', 'Đề bài'],
						['answer', 'Đáp án mẫu'],
						['preview', 'Xem trước'],
					] as const
				).map(([id, label]) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={pane === id}
						onClick={() => setPane(id)}
					>
						{label}
					</button>
				))}
			</div>

			{active ? (
				<DiscussionQuestionEditor
					prompt={active.question}
					answer={active.answer}
					questions={visible.map((item) => item.question)}
					onPrompt={(question) => update(active.id, { question })}
					onAnswer={(answer) => update(active.id, { answer })}
				/>
			) : (
				<p className="ln-empty-hint">
					Chưa có câu hỏi. Thêm từng câu hoặc dán cả loạt từ tài liệu.
				</p>
			)}

			<div className="ln-qsplit__preview ln-qpreview">
				<p className="ln-eyebrow">Xem như học viên</p>
				{active && view ? (
					<>
						<DiscussionQuestionCard
							index={activeIndex}
							view={view}
							answer={active.answer}
							open={previewOpen}
							onOpenChange={setPreviewOpen}
						/>
						{previewOpen ? null : (
							<button
								type="button"
								className="ln-btn ln-btn--primary"
								onClick={() => setPreviewOpen(true)}
							>
								Xem đáp án mẫu
							</button>
						)}
					</>
				) : null}
			</div>

			<div className="ln-qsplit__actions">
				<button
					type="button"
					className="ln-btn"
					onClick={() => {
						const created = emptyQuestion();
						setQuestions([...discussion.questions, created]);
						setActiveId(created.id);
					}}
				>
					<StudioIcon name="plus" size={14} /> Thêm câu
				</button>
				<button type="button" className="ln-btn" onClick={onOpenImport}>
					<StudioIcon name="import" size={14} /> Nhập bằng AI
				</button>
			</div>
			{questions.toast}
		</div>
	);
}
