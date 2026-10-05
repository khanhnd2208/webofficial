'use client';

import { useRef, type RefObject } from 'react';

import { insertAtCaret } from '@/features/learn/discussionTemplates';

import DiscussionToolbar from './DiscussionToolbar';

function Field({
	label,
	value,
	inputRef,
	onChange,
	onCaret,
}: {
	label: string;
	value: string;
	inputRef: RefObject<HTMLTextAreaElement | null>;
	onChange: (value: string) => void;
	onCaret: () => void;
}) {
	return (
		<label className="ln-mdfield">
			<span>{label}</span>
			<textarea
				ref={inputRef}
				aria-label={label}
				value={value}
				rows={8}
				onSelect={onCaret}
				onKeyUp={onCaret}
				onClick={onCaret}
				onChange={(event) => onChange(event.target.value)}
			/>
		</label>
	);
}

export default function DiscussionQuestionEditor({
	prompt,
	answer,
	questions,
	onPrompt,
	onAnswer,
}: {
	prompt: string;
	answer: string;
	questions: string[];
	onPrompt: (value: string) => void;
	onAnswer: (value: string) => void;
}) {
	const promptRef = useRef<HTMLTextAreaElement>(null);
	const answerRef = useRef<HTMLTextAreaElement>(null);
	const caret = useRef({ prompt: [0, 0] as [number, number], answer: [0, 0] as [number, number] });

	function remember(field: 'prompt' | 'answer') {
		const node = field === 'prompt' ? promptRef.current : answerRef.current;
		if (!node) return;
		caret.current[field] = [node.selectionStart, node.selectionEnd];
	}

	function insert(field: 'prompt' | 'answer', snippet: string) {
		const node = field === 'prompt' ? promptRef.current : answerRef.current;
		const value = field === 'prompt' ? prompt : answer;
		const [start, end] = caret.current[field];
		const next = insertAtCaret(value, start, end, snippet);
		caret.current[field] = [next.caret, next.caret];
		if (field === 'prompt') onPrompt(next.value);
		else onAnswer(next.value);
		requestAnimationFrame(() => {
			node?.focus();
			node?.setSelectionRange(next.caret, next.caret);
		});
	}

	return (
		<div className="ln-qsplit__fields">
			<div className="ln-qsplit__prompt" data-field="prompt">
				<DiscussionToolbar
					field="prompt"
					questions={questions}
					answer={answer}
					onInsert={(snippet) => insert('prompt', snippet)}
				/>
				<Field
					label="Đề bài"
					value={prompt}
					inputRef={promptRef}
					onCaret={() => remember('prompt')}
					onChange={onPrompt}
				/>
			</div>
			<div className="ln-qsplit__answer" data-field="answer">
				<DiscussionToolbar
					field="answer"
					questions={questions}
					answer={answer}
					onInsert={(snippet) => insert('answer', snippet)}
				/>
				<Field
					label="Đáp án mẫu"
					value={answer}
					inputRef={answerRef}
					onCaret={() => remember('answer')}
					onChange={onAnswer}
				/>
			</div>
		</div>
	);
}
