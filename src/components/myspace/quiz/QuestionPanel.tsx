'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';

import AnswerFeedback from './AnswerFeedback';
import AnswerOption from './AnswerOption';
import type {
	AnswerOptionState,
	McqCorrectOption,
	PublicQuizQuestion,
	QuizPhase,
	Reveal,
} from './types';

interface QuestionPanelProps {
	question: PublicQuizQuestion;
	index: number;
	total: number;
	chosen?: McqCorrectOption;
	reveal?: Reveal;
	phase: QuizPhase;
	reduceMotion: boolean;
	focusKey: McqCorrectOption;
	onChoose: (key: McqCorrectOption) => void;
	onFocusKey: (key: McqCorrectOption) => void;
	onPrev: () => void;
	onNext: () => void;
	canPrev: boolean;
	canNext: boolean;
}

function optionState(
	key: McqCorrectOption,
	chosen: McqCorrectOption | undefined,
	reveal: Reveal | undefined,
	phase: QuizPhase,
): AnswerOptionState {
	if (reveal) {
		if (key === reveal.correctOption) return 'correct';
		if (key === reveal.chosen && !reveal.isCorrect) return 'wrongPick';
		return 'other';
	}
	if (chosen === key) {
		return phase === 'checking' ? 'checking' : 'selected';
	}
	return 'idle';
}

export default function QuestionPanel({
	question,
	index,
	total,
	chosen,
	reveal,
	phase,
	reduceMotion,
	focusKey,
	onChoose,
	onFocusKey,
	onPrev,
	onNext,
	canPrev,
	canNext,
}: QuestionPanelProps) {
	const stemId = useId();
	const groupRef = useRef<HTMLUListElement>(null);
	const answered = Boolean(reveal);
	const locked = answered || phase === 'checking' || phase === 'submitting';
	const optionKeys = question.options.map((o) => o.key);
	const shortcutHint =
		optionKeys.length <= 2
			? 'Phím tắt: A–B hoặc 1–2 chọn đáp án · ← câu trước · → / Enter câu tiếp'
			: 'Phím tắt: A–D hoặc 1–4 chọn đáp án · ← câu trước · → / Enter câu tiếp';

	useEffect(() => {
		const el = groupRef.current?.querySelector<HTMLButtonElement>(
			`[data-testid="myspace-option-${focusKey}"]`,
		);
		if (el && document.activeElement?.closest('[role="radiogroup"]') === groupRef.current) {
			el.focus();
		}
	}, [focusKey]);

	function handleOptionKeyDown(
		e: KeyboardEvent<HTMLButtonElement>,
		key: McqCorrectOption,
	) {
		const idx = optionKeys.indexOf(key);
		if (idx < 0 || optionKeys.length === 0) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
			e.preventDefault();
			const next = optionKeys[(idx + 1) % optionKeys.length]!;
			onFocusKey(next);
		} else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
			e.preventDefault();
			const prev = optionKeys[(idx - 1 + optionKeys.length) % optionKeys.length]!;
			onFocusKey(prev);
		} else if (e.key === ' ' || e.key === 'Enter') {
			if (!locked) {
				e.preventDefault();
				onChoose(key);
			}
		}
	}

	return (
		<section className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-4 sm:p-6 lg:p-8">
			{/* Header nav */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
				<button
					type="button"
					onClick={onPrev}
					disabled={!canPrev}
					className="inline-flex min-h-11 items-center gap-1.5 font-sans text-sm font-medium text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:text-ink-secondary/50"
					data-testid="myspace-quiz-prev"
				>
					<span aria-hidden>←</span>
					Câu trước
				</button>

				<p className="font-mono text-[0.875rem] font-semibold tracking-[0.04em] text-ink">
					Câu {index + 1} / {total}
				</p>

				<button
					type="button"
					onClick={onNext}
					disabled={!canNext || phase === 'checking' || phase === 'submitting'}
					className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:cursor-not-allowed disabled:border-hairline disabled:bg-hairline disabled:text-ink-secondary"
					data-testid="myspace-quiz-next"
				>
					{phase === 'submitting'
						? 'Đang nộp…'
						: index < total - 1
							? 'Câu tiếp →'
							: 'Nộp bài →'}
				</button>
			</div>

			<AnimatePresence mode="wait">
				<m.div
					key={question.id}
					initial={reduceMotion ? false : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
					transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
				>
					{!reveal ? (
						<p className="mt-5 font-sans text-sm text-ink-secondary">
							Chọn một đáp án để tiếp tục
						</p>
					) : null}

					<h1
						id={stemId}
						className="mt-4 max-w-[62ch] font-sans text-[clamp(1.0625rem,2.2vw,1.25rem)] font-medium leading-[1.65] text-ink text-balance break-words"
					>
						{question.stem}
					</h1>

					<ul
						ref={groupRef}
						className="mt-6 border-t border-hairline"
						role="radiogroup"
						aria-labelledby={stemId}
					>
						{question.options.map((opt) => {
							const state = optionState(opt.key, chosen, reveal, phase);
							return (
								<AnswerOption
									key={opt.key}
									optionKey={opt.key}
									text={opt.text}
									state={state}
									disabled={locked}
									tabIndex={focusKey === opt.key ? 0 : -1}
									onSelect={() => onChoose(opt.key)}
									onKeyDown={(e) => handleOptionKeyDown(e, opt.key)}
									reduceMotion={reduceMotion}
								/>
							);
						})}
					</ul>

					{reveal ? (
						<AnswerFeedback
							isCorrect={reveal.isCorrect}
							correctOption={reveal.correctOption}
						/>
					) : null}
				</m.div>
			</AnimatePresence>

			<p className="mt-6 font-mono text-[0.75rem] leading-relaxed text-ink-secondary">
				{shortcutHint}
			</p>
		</section>
	);
}
