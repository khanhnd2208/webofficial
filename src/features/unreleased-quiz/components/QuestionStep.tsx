'use client';

import { useEffect, useRef, useState } from 'react';

import type { QuizQuestion } from '../content/questions';
import type { OptionKey } from '../domain/quiz';
import styles from './unreleased.module.css';

type QuestionStepProps = {
	question: QuizQuestion;
	position: number;
	total: number;
	selected: OptionKey | undefined;
	/** A follow-up line from the previous answer, carried onto this question. */
	note?: string;
	/** Choosing an option moves on by itself; `onNext` is for keeping an earlier answer. */
	onSelect: (key: OptionKey) => void;
	onNext: () => void;
	onBack: () => void;
	isLast: boolean;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function QuestionStep({
	question,
	position,
	total,
	selected,
	note,
	onSelect,
	onNext,
	onBack,
	isLast,
}: QuestionStepProps) {
	const headingRef = useRef<HTMLHeadingElement>(null);
	// Back on an answered question: offer to keep that answer without re-picking it.
	const [returning] = useState(selected !== undefined);
	const keys = question.options.map((option) => option.key);
	const lastKey = keys[keys.length - 1];

	useEffect(() => {
		headingRef.current?.focus({ preventScroll: true });
	}, [question.id]);

	// A–E or 1–5 picks an option, like tapping it.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
			const target = event.target as HTMLElement | null;
			if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
			const pressed = event.key.toUpperCase();
			const byLetter = keys.find((key) => key === pressed);
			const byNumber = /^[1-9]$/.test(pressed) ? keys[Number(pressed) - 1] : undefined;
			const key = byLetter ?? byNumber;
			if (!key) return;
			event.preventDefault();
			onSelect(key);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [keys, onSelect]);

	return (
		<div className={`${styles.enter} mx-auto max-w-2xl`}>
			<div className="flex items-center justify-between gap-4">
				<span className={styles.label}>
					Câu {pad(position)} <span className={styles.faint}>/ {pad(total)}</span>
				</span>
				<span className={`${styles.label} ${styles.faint}`}>Chọn là sang câu tiếp</span>
			</div>
			<div
				className={`${styles.segments} mt-3`}
				role="progressbar"
				aria-label="Tiến độ quiz"
				aria-valuemin={0}
				aria-valuemax={total}
				aria-valuenow={position - 1}
				aria-valuetext={`Câu ${position} trên ${total}`}
			>
				{Array.from({ length: total }, (_, index) => (
					<span
						key={index}
						className={`${styles.segment} ${
							index < position - 1
								? styles.segmentDone
								: index === position - 1
									? styles.segmentCurrent
									: ''
						}`}
					/>
				))}
			</div>

			{note ? <p className={`${styles.note} mt-8 text-[0.95rem] leading-relaxed`}>{note}</p> : null}
			{question.lead ? (
				<p className={`${styles.label} mt-8 !normal-case !tracking-normal !text-[0.85rem]`}>
					{question.lead}
				</p>
			) : null}

			<h2
				ref={headingRef}
				tabIndex={-1}
				className={`${styles.display} ${note || question.lead ? 'mt-4' : 'mt-8'} text-[1.65rem] outline-none sm:text-[2.15rem]`}
			>
				{question.prompt}
			</h2>
			{question.hint ? (
				<p className={`${styles.muted} mt-3 text-[0.95rem] leading-relaxed`}>{question.hint}</p>
			) : null}

			<div role="radiogroup" aria-label={question.prompt} className="mt-8 grid gap-3">
				{question.options.map((option) => {
					const active = option.key === selected;
					return (
						<button
							key={option.key}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => onSelect(option.key)}
							className={`${styles.option} ${active ? styles.optionActive : ''}`}
						>
							<span aria-hidden="true" className={styles.key}>
								{option.key}
							</span>
							<span className="flex-1 pt-0.5">
								<span className="block text-[1.02rem] leading-relaxed font-medium">
									{option.text}
								</span>
								{option.example ? (
									<span className={`${styles.muted} mt-1 block text-[0.9rem] leading-relaxed`}>
										{option.example}
									</span>
								) : null}
							</span>
						</button>
					);
				})}
			</div>

			<div className="mt-8 flex items-center justify-between gap-4">
				<button type="button" onClick={onBack} className={styles.ghost}>
					<span aria-hidden="true">←</span> Quay lại
				</button>
				{returning && selected ? (
					<button type="button" onClick={onNext} className={styles.outline}>
						{isLast ? 'Xem kết quả' : 'Tiếp'} <span aria-hidden="true">→</span>
					</button>
				) : (
					<span className={`${styles.faint} hidden text-sm sm:inline`}>
						Có thể bấm phím A–{lastKey} để chọn
					</span>
				)}
			</div>
		</div>
	);
}
