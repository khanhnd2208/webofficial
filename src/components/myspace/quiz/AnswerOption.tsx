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

function RadioGlyph({ state }: { state: AnswerOptionState }) {
	if (state === 'correct') {
		return (
			<span
				className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-[0.75rem] font-bold text-canvas"
				aria-hidden
			>
				✓
			</span>
		);
	}
	if (state === 'wrongPick') {
		return (
			<span
				className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error text-[0.75rem] font-bold text-canvas"
				aria-hidden
			>
				✕
			</span>
		);
	}
	if (state === 'selected' || state === 'checking') {
		return (
			<span
				className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-accent"
				aria-hidden
			>
				<span className="h-2 w-2 rounded-full bg-canvas" />
			</span>
		);
	}
	return (
		<span
			className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-hairline bg-canvas"
			aria-hidden
		/>
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
		case 'wrongPick':
			return 'text-ink';
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
	const checked = state === 'selected' || state === 'checking' || state === 'correct' || state === 'wrongPick';
	const pulse =
		!reduceMotion && (state === 'correct' || state === 'wrongPick')
			? 'animate-[quiz-pulse_0.4s_ease-out]'
			: '';

	const content = (
		<>
			<span className="flex items-start gap-3 pt-0.5">
				<RadioGlyph state={state} />
				<span
					className={`font-mono text-[0.8125rem] font-semibold tracking-[0.08em] ${
						state === 'correct'
							? 'text-success'
							: state === 'wrongPick'
								? 'text-error'
								: state === 'selected' || state === 'checking'
									? 'text-accent'
									: 'text-ink-secondary'
					}`}
				>
					{optionKey}
				</span>
			</span>
			<span className={`min-w-0 font-sans text-base leading-[1.6] ${textTone(state)}`}>
				<span className="break-words">{text}</span>
				{state === 'correct' ? (
					<span className="ml-2 inline-block align-middle font-mono text-[0.6875rem] font-semibold tracking-[0.08em] text-success uppercase">
						Đáp án đúng
					</span>
				) : null}
				{state === 'wrongPick' ? (
					<span className="ml-2 inline-block align-middle font-mono text-[0.6875rem] font-semibold tracking-[0.08em] text-error uppercase">
						Bạn chọn
					</span>
				) : null}
				{state === 'checking' ? (
					<span className="ml-2 inline-flex items-center gap-1.5 align-middle font-mono text-[0.6875rem] tracking-[0.06em] text-ink-secondary">
						<span
							className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-hairline border-t-ink-secondary"
							aria-hidden
						/>
						Đang kiểm tra…
					</span>
				) : null}
			</span>
		</>
	);

	const baseClass = `grid w-full min-h-12 grid-cols-[4.5rem_1fr] gap-3 border-b border-hairline px-3 py-3.5 text-left transition-[background-color,color] duration-300 sm:grid-cols-[5rem_1fr] sm:gap-4 sm:px-4 sm:py-4 ${rowTone(state)} ${pulse}`;

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
