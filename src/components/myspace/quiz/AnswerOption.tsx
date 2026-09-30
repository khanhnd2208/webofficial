'use client';

import type { KeyboardEvent } from 'react';

import type { AnswerOptionState, McqCorrectOption } from './types';

interface AnswerOptionProps {
	optionKey: McqCorrectOption;
	text: string;
	state: AnswerOptionState;
	disabled?: boolean;
	readOnly?: boolean;
	tabIndex?: number;
	onSelect?: () => void;
	onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
	reduceMotion?: boolean;
}

function LetterGlyph({
	optionKey,
	state,
}: {
	optionKey: McqCorrectOption;
	state: AnswerOptionState;
}) {
	const base =
		'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[0.75rem] font-semibold tracking-[0.04em]';

	if (state === 'correct') {
		return (
			<span className={`${base} bg-success text-canvas`} aria-hidden>
				{optionKey}
			</span>
		);
	}
	if (state === 'wrongPick') {
		return (
			<span className={`${base} bg-error text-canvas`} aria-hidden>
				{optionKey}
			</span>
		);
	}
	if (state === 'selected' || state === 'checking') {
		return (
			<span className={`${base} bg-accent text-canvas`} aria-hidden>
				{optionKey}
			</span>
		);
	}
	if (state === 'other') {
		return (
			<span className={`${base} border border-hairline bg-canvas text-ink-secondary`} aria-hidden>
				{optionKey}
			</span>
		);
	}
	return (
		<span className={`${base} border border-hairline bg-canvas text-ink-secondary`} aria-hidden>
			{optionKey}
		</span>
	);
}

function rowTone(state: AnswerOptionState): string {
	switch (state) {
		case 'correct':
			return 'bg-success-subtle';
		case 'wrongPick':
			return 'bg-error-subtle';
		case 'selected':
		case 'checking':
			return 'bg-paper';
		case 'other':
			return 'bg-transparent';
		default:
			return 'bg-transparent hover:bg-paper/70';
	}
}

function textTone(state: AnswerOptionState): string {
	switch (state) {
		case 'other':
			return 'text-ink-secondary';
		default:
			return 'text-ink';
	}
}

export default function AnswerOption({
	optionKey,
	text,
	state,
	disabled = false,
	readOnly = false,
	tabIndex,
	onSelect,
	onKeyDown,
	reduceMotion = false,
}: AnswerOptionProps) {
	const checked =
		state === 'selected' || state === 'checking' || state === 'correct' || state === 'wrongPick';
	const pulse =
		!reduceMotion && (state === 'correct' || state === 'wrongPick')
			? 'animate-[quiz-pulse_0.4s_ease-out]'
			: '';

	const content = (
		<>
			<span className="flex items-start pt-0.5">
				<LetterGlyph optionKey={optionKey} state={state} />
			</span>
			<span className={`min-w-0 font-sans text-base leading-[1.6] ${textTone(state)}`}>
				<span className="break-words">{text}</span>
				{state === 'checking' ? (
					<span className="ml-2 inline-flex items-center gap-1.5 align-middle font-mono text-[0.6875rem] tracking-[0.06em] text-ink-secondary">
						<span
							className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-hairline border-t-ink-secondary"
							aria-hidden
						/>
						Checking…
					</span>
				) : null}
			</span>
		</>
	);

	const baseClass = `grid w-full min-h-12 grid-cols-[2.5rem_1fr] gap-3 border-b border-hairline px-3 py-3.5 text-left transition-[background-color,color] duration-300 sm:gap-4 sm:px-4 sm:py-4 ${rowTone(state)} ${pulse}`;

	if (readOnly) {
		return (
			<li className={baseClass} data-testid={`myspace-option-${optionKey}`}>
				{content}
			</li>
		);
	}

	return (
		<li role="presentation" className="border-0 p-0">
			<button
				type="button"
				role="radio"
				aria-checked={checked}
				tabIndex={tabIndex}
				disabled={disabled}
				onClick={onSelect}
				onKeyDown={onKeyDown}
				className={`${baseClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-default`}
				data-testid={`myspace-option-${optionKey}`}
			>
				{content}
			</button>
		</li>
	);
}
