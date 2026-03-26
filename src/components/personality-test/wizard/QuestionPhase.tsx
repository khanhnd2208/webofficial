'use client';

/* ════════════════════════════════════════════════════════════════════════
   QuestionPhase — Paginated Likert-scale questions (BFI or SD3)
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { QuestionPhaseProps } from './types';
import { QUESTIONS_PER_PAGE, LIKERT_OPTIONS } from './constants';
import { getKey } from './helpers';

export default function QuestionPhase({
	config,
	phase,
	currentPage,
	answers,
	onAnswer,
	onNextPage,
	onPrevPage,
}: QuestionPhaseProps) {
	const currentQuestions = phase === 'bfi' ? config.bfiQuestions : config.sd3Questions;
	const totalPages = Math.ceil(currentQuestions.length / QUESTIONS_PER_PAGE);
	const pageQuestions = currentQuestions.slice(
		currentPage * QUESTIONS_PER_PAGE,
		(currentPage + 1) * QUESTIONS_PER_PAGE
	);

	const answeredOnPage = pageQuestions.filter(
		(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;

	return (
		<motion.div
			key={`questions-${phase}-${currentPage}`}
			initial={{ opacity: 0, x: 30 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -30 }}
			transition={{ duration: 0.2 }}
			className="space-y-4"
		>
			{pageQuestions.map((q, idx) => {
				const key = getKey(q.testType, q.itemNumber);
				const selected = answers[key];
				const globalIndex =
					(phase === 'bfi' ? 0 : config.bfiQuestions.length) +
					currentPage * QUESTIONS_PER_PAGE +
					idx +
					1;

				return (
					<div
						key={key}
						className={`rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
							selected !== undefined
								? 'border-accent/30 bg-accent-subtle/50'
								: 'border-border bg-surface'
						}`}
					>
						{/* Question header */}
						<div className="flex items-start gap-3">
							<span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background-secondary text-xs font-bold text-muted">
								{globalIndex}
							</span>
							<div className="flex-1">
								{/* English — primary */}
								<p className="text-sm font-bold leading-snug text-foreground">
									{q.text}
								</p>
								{/* Vietnamese — secondary reference */}
								<p className="mt-1 text-[11px] leading-relaxed text-muted">
									{q.textVi}
								</p>
							</div>
						</div>

						{/* Likert scale */}
						<div className="mt-4 flex gap-1.5 sm:gap-2">
							{LIKERT_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									onClick={() => onAnswer(q.testType, q.itemNumber, opt.value)}
									title={`${opt.label} (${opt.labelVi})`}
									className={`group flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2.5 text-center transition-all duration-150 ${
										selected === opt.value
											? 'border-accent bg-accent text-white dark:text-[#121110] shadow-md scale-[1.04] font-black'
											: 'border-border bg-surface text-foreground-secondary hover:border-accent/60 hover:bg-accent-subtle hover:text-foreground'
									}`}
								>
									<span className="text-base font-black leading-none tabular-nums">{opt.value}</span>
									<span className={`text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5 ${
										selected === opt.value ? 'opacity-90' : 'opacity-50'
									}`}>
										{opt.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
									</span>
								</button>
							))}
						</div>
					</div>
				);
			})}

			{/* Navigation */}
			<div className="flex items-center justify-between pt-2">
				<button
					onClick={onPrevPage}
					disabled={currentPage === 0}
					className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
				>
					← Back
				</button>

				<span className="text-xs text-muted tabular-nums">
					Page {currentPage + 1} / {totalPages}
				</span>

				<button
					onClick={onNextPage}
					disabled={answeredOnPage < pageQuestions.length}
					className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{currentPage === totalPages - 1
						? phase === 'bfi'
							? 'Go to Part 2 →'
							: 'Review →'
						: 'Next →'}
				</button>
			</div>
		</motion.div>
	);
}
