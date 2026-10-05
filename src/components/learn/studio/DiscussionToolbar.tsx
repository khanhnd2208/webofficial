'use client';

import {
	ANSWER_SNIPPETS,
	PROMPT_SNIPPETS,
	nextPartSnippet,
	nextStepSnippet,
} from '@/features/learn/discussionTemplates';

function BarButton({ label, onInsert }: { label: string; onInsert: () => void }) {
	return (
		<button
			type="button"
			className="ln-mdbar__btn"
			onMouseDown={(event) => event.preventDefault()}
			onClick={onInsert}
		>
			{label}
		</button>
	);
}

export default function DiscussionToolbar({
	field,
	questions,
	answer,
	onInsert,
}: {
	field: 'prompt' | 'answer';
	questions: string[];
	answer: string;
	onInsert: (snippet: string) => void;
}) {
	if (field === 'prompt') {
		return (
			<div className="ln-mdbar" role="toolbar" aria-label="Chèn vào đề bài">
				<BarButton label="Phần" onInsert={() => onInsert(nextPartSnippet(questions))} />
				<BarButton label="Tiêu đề câu" onInsert={() => onInsert(PROMPT_SNIPPETS.title)} />
				<BarButton label="Tình huống" onInsert={() => onInsert(PROMPT_SNIPPETS.situation)} />
				<BarButton label="Câu hỏi" onInsert={() => onInsert(PROMPT_SNIPPETS.ask)} />
			</div>
		);
	}
	return (
		<div className="ln-mdbar" role="toolbar" aria-label="Chèn vào đáp án mẫu">
			<BarButton label="Nhắc lại bài học" onInsert={() => onInsert(ANSWER_SNIPPETS.recall)} />
			<BarButton label="Suy nghĩ từng bước" onInsert={() => onInsert(ANSWER_SNIPPETS.steps)} />
			<BarButton label="Thêm bước" onInsert={() => onInsert(nextStepSnippet(answer))} />
			<BarButton label="Lời giải" onInsert={() => onInsert(ANSWER_SNIPPETS.solution)} />
			<BarButton label="Điều rút ra" onInsert={() => onInsert(ANSWER_SNIPPETS.takeaway)} />
		</div>
	);
}
