'use client';

import { useRef, useState } from 'react';

import DiscussionQuestionCard from '@/components/learn/DiscussionQuestionCard';
import { discussionMarkdown, parseDiscussionPaste } from '@/features/learn/discussionImport';
import { discussionQuestionViews } from '@/features/learn/discussionView';
import { LEARN_MAX_QUESTIONS } from '@/features/learn/schemas';
import type { LearnDiscussion, LearnDiscussionQuestion } from '@/features/learn/types';

import MarkdownEditor from './MarkdownEditor';

const PLACEHOLDER = `Câu 1:
### Tên câu hỏi
> [!EXAMPLE] Tình huống:
> …
> [!REFLECT] Câu hỏi:
> …

Đáp án mẫu:
…

Câu 2: …`;

/**
 * Keep question ids stable across re-parses so learners keep their "opened" marks:
 * an unchanged prompt keeps its id, otherwise the question at the same position does.
 */
export function keepQuestionIds(
	parsed: LearnDiscussionQuestion[],
	previous: LearnDiscussionQuestion[],
): LearnDiscussionQuestion[] {
	const used = new Set<string>();
	const byText = new Map<string, string>();
	for (const item of previous) if (!byText.has(item.question)) byText.set(item.question, item.id);
	const withText = parsed.map((item) => {
		const id = byText.get(item.question);
		if (!id || used.has(id)) return null;
		used.add(id);
		return id;
	});
	return parsed.map((item, index) => {
		const id = withText[index];
		if (id) return { ...item, id };
		const sameSpot = previous[index]?.id;
		if (sameSpot && !used.has(sameSpot)) {
			used.add(sameSpot);
			return { ...item, id: sameSpot };
		}
		return item;
	});
}

function QuestionPreview({ questions }: { questions: LearnDiscussionQuestion[] }) {
	const [open, setOpen] = useState<Set<number>>(() => new Set());
	const views = discussionQuestionViews(questions.map((item) => item.question));
	if (!questions.length)
		return <p className="ln-empty-hint">Các câu sẽ hiện ở đây, đúng như học viên thấy.</p>;
	return (
		<div className="ln ln-qpreview">
			{questions.map((item, index) => (
				<DiscussionQuestionCard
					key={index}
					index={index}
					view={views[index]}
					answer={item.answer}
					open={open.has(index)}
					onOpenChange={(next) =>
						setOpen((current) => {
							const copy = new Set(current);
							if (next) copy.add(index);
							else copy.delete(index);
							return copy;
						})
					}
				/>
			))}
		</div>
	);
}

/**
 * The whole question bank as one Markdown document ("Câu 1: … Đáp án mẫu: …"),
 * the same format the import and export use. Each edit is parsed and saved as questions.
 */
export default function LearnDiscussionEditor({
	discussion,
	onChange,
	onOpenHelp,
}: {
	discussion: LearnDiscussion;
	onChange: (discussion: LearnDiscussion) => void;
	onOpenHelp?: () => void;
}) {
	const [initial] = useState(() => discussionMarkdown(discussion));
	const saved = useRef(discussion.questions);
	const [parsed, setParsed] = useState(() => ({
		questions: discussion.questions,
		warnings: [] as string[],
		ignored: false,
	}));

	function change(markdown: string) {
		const result = parseDiscussionPaste(markdown);
		const warnings = [...result.warnings];
		let questions = result.questions;
		if (questions.length > LEARN_MAX_QUESTIONS) {
			warnings.push(`Tối đa ${LEARN_MAX_QUESTIONS} câu; các câu sau không được lưu.`);
			questions = questions.slice(0, LEARN_MAX_QUESTIONS);
		}
		// Text that is not yet a question never wipes the saved questions.
		const ignored = !questions.length && Boolean(markdown.trim());
		if (ignored) {
			setParsed({ questions: [], warnings, ignored });
			return;
		}
		questions = keepQuestionIds(questions, saved.current);
		saved.current = questions;
		setParsed({ questions, warnings, ignored });
		onChange({ questions });
	}

	return (
		<MarkdownEditor
			value={initial}
			label="Câu hỏi phản biện (Markdown)"
			placeholder={PLACEHOLDER}
			showCount={false}
			onOpenHelp={onOpenHelp}
			onChange={change}
			renderPreview={() => <QuestionPreview questions={parsed.questions} />}
			notice={
				<div className="ln-qdoc__status" role="status">
					<p>
						<strong className="tabular-nums">{parsed.questions.length} câu</strong> · Mỗi câu bắt
						đầu bằng “Câu 1:”, phần trả lời bắt đầu bằng “Đáp án mẫu:”.
					</p>
					{parsed.ignored ? (
						<p className="ln-qdoc__warn">
							Chưa nhận ra câu nào nên chưa lưu. Các câu đã lưu vẫn giữ nguyên.
						</p>
					) : null}
					{parsed.warnings.map((warning) => (
						<p key={warning} className="ln-qdoc__warn">
							{warning}
						</p>
					))}
				</div>
			}
		/>
	);
}
