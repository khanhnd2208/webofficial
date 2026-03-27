'use client';

/* ════════════════════════════════════════════════════════════════════════
   QuestionPhase — Paginated Likert-scale questions (BFI or SD3)
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionPhaseProps } from './types';
import { QUESTIONS_PER_PAGE, LIKERT_OPTIONS } from './constants';
import { getKey } from './helpers';

/* ── Info-tooltip component (click to toggle on mobile, hover on desktop) ── */
function InfoTooltip({ text }: { text: string }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const close = useCallback(() => setOpen(false), []);

	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) close();
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [open, close]);

	return (
		<div ref={ref} className="relative inline-flex">
			<button
				type="button"
				aria-label="Xem giải thích"
				onClick={() => setOpen((v) => !v)}
				className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[9px] font-black leading-none text-accent transition-all hover:bg-accent/20 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			>
				i
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 4, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 4, scale: 0.96 }}
						transition={{ duration: 0.15 }}
						className="absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-xl border border-accent/20 bg-surface p-3 shadow-lg shadow-accent/5"
					>
						<p className="text-[11px] leading-relaxed text-foreground-secondary">
							{text}
						</p>
						<div className="absolute -top-1 left-2 h-2 w-2 rotate-45 border-l border-t border-accent/20 bg-surface" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

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
							q.isAttentionCheck
								? selected !== undefined
									? 'border-amber-400/60 bg-amber-50/80 dark:bg-amber-900/10'
									: 'border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/5'
								: selected !== undefined
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
								{/* Vietnamese — secondary reference + info tooltip */}
								<p className="mt-1 flex items-start gap-0 text-[11px] leading-relaxed text-muted">
									<span className="flex-1">{q.textVi}</span>
									{q.explanationVi && <InfoTooltip text={q.explanationVi} />}
								</p>
							</div>
						</div>

						{/* Attention-check note — shown only for the 2 concentration-check items */}
						{q.isAttentionCheck && (
							<div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50 px-3 py-2.5 dark:border-amber-400/30 dark:bg-amber-900/20">
								<span className="mt-px shrink-0 text-base leading-none">🎯</span>
								<p className="text-[11px] font-semibold leading-relaxed text-amber-800 dark:text-amber-300">
									<span className="font-black">Câu kiểm tra sự tập trung.</span>{' '}
									Vui lòng chọn đúng số được yêu cầu trong câu hỏi này — đây không phải câu hỏi về tính cách, chỉ để xác nhận bạn đang đọc kỹ.
								</p>
							</div>
						)}

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
