'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useId, useRef, type KeyboardEvent, type RefObject } from 'react';

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
	/** Optional ref target for focus transfer after navigation */
	stemRef?: RefObject<HTMLHeadingElement | null>;
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

function NavRow({
	index,
	total,
	phase,
	canPrev,
	canNext,
	onPrev,
	onNext,
	className = '',
	/** When true, attach the canonical e2e data-testid attributes (only one row should). */
	withTestIds = false,
	/** When false, omit the centered counter (mobile bottom bar keeps counter). */
	showCounter = true,
}: {
	index: number;
	total: number;
	phase: QuizPhase;
	canPrev: boolean;
	canNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	className?: string;
	withTestIds?: boolean;
	showCounter?: boolean;
}) {
	const nextDisabled = !canNext || phase === 'checking' || phase === 'submitting';
	const nextLabel =
		phase === 'submitting'
			? 'Submitting…'
			: index < total - 1
				? 'Next →'
				: 'Submit →';

	return (
		<div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
			<button
				type="button"
				onClick={onPrev}
				disabled={!canPrev}
				className="inline-flex min-h-11 items-center gap-1.5 font-sans text-sm font-medium text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:text-ink-secondary/50"
				data-testid={withTestIds ? 'myspace-quiz-prev' : undefined}
			>
				<span aria-hidden>←</span>
				Previous
			</button>

			{showCounter ? (
				<p className="font-mono text-[0.875rem] font-semibold tracking-[0.04em] text-ink">
					Question {index + 1} / {total}
				</p>
			) : (
				<span className="flex-1" aria-hidden />
			)}

			<button
				type="button"
				onClick={onNext}
				disabled={nextDisabled}
				className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:cursor-not-allowed disabled:border-hairline disabled:bg-hairline disabled:text-ink-secondary"
				data-testid={withTestIds ? 'myspace-quiz-next' : undefined}
			>
				{nextLabel}
			</button>
		</div>
	);
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
	stemRef,
}: QuestionPanelProps) {
	const stemId = useId();
	const groupRef = useRef<HTMLUListElement>(null);
	const answered = Boolean(reveal);
	const locked = answered || phase === 'checking' || phase === 'submitting';
	const optionKeys = question.options.map((o) => o.key);

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

	const navProps = {
		index,
		total,
		phase,
		canPrev,
		canNext,
		onPrev,
		onNext,
	};

	return (
		<>
			<section className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-4 sm:p-6 lg:p-8">
				{/* Desktop nav — top of card (owns canonical e2e testids) */}
				<NavRow
					{...navProps}
					withTestIds
					className="hidden border-b border-hairline pb-4 lg:flex"
				/>

				<AnimatePresence mode="wait">
					<m.div
						key={question.id}
						initial={reduceMotion ? false : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
						transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
					>
						<h2
							ref={stemRef}
							id={stemId}
							tabIndex={-1}
							className="mt-4 max-w-[62ch] scroll-mt-28 font-sans text-[clamp(1.0625rem,2.2vw,1.25rem)] font-medium leading-[1.65] text-ink text-balance break-words outline-none lg:mt-5"
						>
							{question.stem}
						</h2>

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
			</section>

			{/* Mobile sticky bottom action bar — single counter lives here */}
			<div
				className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 px-[var(--gutter)] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
				data-testid="myspace-quiz-mobile-actions"
			>
				<NavRow {...navProps} showCounter />
			</div>
		</>
	);
}
